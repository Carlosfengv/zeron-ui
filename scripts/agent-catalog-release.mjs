import { artifactFileUrl, artifactOrigin } from "./agent-artifacts.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";
import { buildFullContext, assertContextBudget, contextBudgets } from "./agent-context.mjs";
import { renderDetail } from "./build-agent-catalog.mjs";
import { hasTaskContext } from "../lib/agent-catalog/task-context.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";
import { runtimeInstallationSummary, publishedInstallationVerificationSchema } from "./agent-release-record.mjs";
import { skillReleaseSchema } from "./skill-release.mjs";
import { selectSkillTextFiles } from "./skill-text-references.mjs";
import { skillTextSelectionPath } from "../lib/agent-catalog/skill-references.mjs";
import { assembleCatalogExamples, readCatalogExamples } from "./agent-catalog-examples.mjs";

const placeholder = "__ZERON_CATALOG_BASE__";
const guidePath = id => `guides/${id}.md`;

function contexts(runtime, site) {
  const intro = (hasTaskContext(runtime.skills) ? `# Task context\n\n[按任务读取 Zeron 规范](${placeholder}/skills/zeron-page-builder/references/task-context.md). New application: choose a standard shell; existing page: preserve the host; small control change: read only relevant contracts.\n\n` : "") + `# Zeron UI for agents\n\nRead this fixed catalog and the exact installed public types before choosing components.\n\n- [AI usage](${site}/docs/ai)\n- [Fixed catalog](${placeholder}/catalog.json)\n- [Fixed Skills installation](${new URL(runtime.catalog.catalogUrl).origin}/skills/releases/${runtime.catalog.skillVersion}/install.md)\n\n## Install\n\nUse the exact verified CLI and Registry from get_install_command. Confirm Next or Vite and npm or pnpm, then inspect add --dry-run and local conflicts before installing. React 19 and Tailwind 4 are required. Next-only blocks are not Vite installation candidates.\n\n## Design rules\n\nUse semantic tokens and public variants, sizes and icon slots. Preserve keyboard focus, loading and disabled states, host navigation and scroll ownership. Connect real data and callbacks. A static check does not prove business or visual behavior.\n`;
  const list = runtime.catalog.items.filter(item => item.kind !== "support").map(item =>
    `- [${item.title.en}](${placeholder}/items/${encodeURIComponent(item.id)}.md): ${item.summary.en}${item.installable ? ` Registry: ${item.registryName}.` : " Not installable."}`).join("\n");
  const guides = Object.values(runtime.details).filter(detail => detail.guide !== null).map(detail => ({
    text: detail.guide, key: runtime.guideRoutes?.routes.find(route => route.itemId === detail.item.id)?.path
      ?? `${detail.item.id.startsWith("component:") ? "components" : "blocks"}/${detail.item.registryName}.md`, id: detail.item.id,
  }));
  const guideIndex = guides.map(guide => `- [${guide.id}](${placeholder}/${guidePath(guide.id).split("/").map(encodeURIComponent).join("/")})`).join("\n");
  const result = buildFullContext({ intro, guides, site: placeholder });
  result.set("llms-small.txt", `${intro}\nRead only the item Markdown and Skill references needed for the current task.\n`);
  result.set("llms.txt", `${intro}\n## Catalog\n\n${list}\n\n## Detailed guides\n\n${guideIndex}\n`);
  result.set("instructions.md", intro);
  const originals = new Map(result);
  const normalize = text => {
    let normalized = text;
    for (const guide of guides) normalized = normalized.replaceAll(`${placeholder}/agent-guides/${guide.key}`,
      `${placeholder}/${guidePath(guide.id).split("/").map(encodeURIComponent).join("/")}`);
    return normalized;
  };
  for (const [name, text] of result) result.set(name, normalize(text));
  if (originals.has("ai/context/manifest.json")) {
    const manifest = JSON.parse(originals.get("ai/context/manifest.json"));
    for (const guide of manifest.guides) for (const part of guide.parts) {
      const originalPrefix = Buffer.from(originals.get(part.path)).subarray(0, part.sourceOffsetByte).toString("utf8");
      part.sourceOffsetByte = Buffer.byteLength(normalize(originalPrefix));
      part.bytes = Buffer.byteLength(result.get(part.path));
      part.sha256 = sha256(result.get(part.path));
    }
    result.set("ai/context/manifest.json", serialize(manifest));
  }
  return Object.fromEntries(result);
}

function identityOf(runtime, identities, verificationBytes, skillManifestSha256, templates, siteBaseUrl) {
  const normalize = item => ({ ...item, markdown: `${placeholder}/items/${encodeURIComponent(item.id)}.md`,
    detailUrl: `${placeholder}/items/${encodeURIComponent(item.id)}.json` });
  return { schemaVersion: 1, artifactBaseUrl: new URL(runtime.catalog.catalogUrl).origin, siteBaseUrl,
    registryReleaseId: runtime.catalog.registryReleaseId, skillVersion: runtime.catalog.skillVersion,
    registryManifestSha256: runtime.catalog.registryManifestSha256, skillManifestSha256,
    items: runtime.catalog.items.map(normalize),
    details: Object.fromEntries(Object.entries(runtime.details).map(([id, detail]) => [id, { ...detail, item: normalize(detail.item),
      ...(detail.examples ? { examples: detail.examples.map(link => ({ ...link,
        source: `${placeholder}/${runtime.examples.entries.find(entry => entry.exampleId === link.exampleId).entry}`,
        instructions: `${placeholder}/${runtime.examples.instructions.path}`,
        verification: `${placeholder}/examples/verification.json` })) } : {}) }])),
    skills: runtime.skills, identities, installation: runtime.installation,
    ...(runtime.guideRoutes ? { guideRoutes: runtime.guideRoutes } : {}),
    ...(runtime.examples ? { examples: runtime.examples } : {}),
    installationVerificationSha256: sha256(verificationBytes), contextTemplates: templates };
}

function materialize(runtime, identity, verificationBytes, exampleFiles = new Map()) {
  const files = new Map([
    ["catalog.json", Buffer.from(serialize(runtime.catalog))], ["runtime.json", Buffer.from(serialize(runtime))],
    ["identity.json", Buffer.from(serialize(identity))], ["item-identities.json", Buffer.from(serialize(identity.identities))],
    ["installation-verification.json", Buffer.from(verificationBytes)],
  ]);
  for (const [name, bytes] of exampleFiles) files.set(name, bytes);
  if (runtime.guideRoutes) files.set("guide-routes.json", Buffer.from(serialize(runtime.guideRoutes)));
  for (const [id, detail] of Object.entries(runtime.details)) {
    files.set(`items/${id}.json`, Buffer.from(serialize(detail)));
    files.set(`items/${id}.md`, Buffer.from(renderDetail(detail, runtime.skills, hasTaskContext(runtime.skills) ? runtime.examples : undefined, runtime.catalog.catalogUrl)));
    if (detail.guide !== null) files.set(guidePath(id), Buffer.from(detail.guide));
  }
  if (hasTaskContext(runtime.skills)) for (const [name, references] of Object.entries(runtime.skills)) for (const [relative, text] of Object.entries(references)) {
    files.set(`skills/${name}/${relative}`, Buffer.from(text));
  }
  const base = runtime.catalog.catalogUrl.slice(0, -"/catalog.json".length);
  for (const [name, template] of Object.entries(identity.contextTemplates)) {
    const text = template.replaceAll(placeholder, base);
    const budget = name === "instructions.md" ? contextBudgets.instructions : name === "llms-small.txt" ? contextBudgets.small
      : name === "llms.txt" ? contextBudgets.index : name.endsWith(".json") ? 2 * 1024 * 1024 : contextBudgets.full;
    assertContextBudget(name, text, budget);
    files.set(name, Buffer.from(text));
  }
  const contextManifest = "ai/context/manifest.json";
  if (files.has(contextManifest)) {
    const manifest = JSON.parse(files.get(contextManifest).toString("utf8"));
    for (const guide of manifest.guides) for (const part of guide.parts) {
      const body = files.get(part.path);
      const templatePrefix = Buffer.from(identity.contextTemplates[part.path]).subarray(0, part.sourceOffsetByte).toString("utf8");
      part.sourceOffsetByte = Buffer.byteLength(templatePrefix.replaceAll(placeholder, base));
      part.bytes = body.length;
      part.sha256 = sha256(body);
      if (sha256(body.subarray(part.sourceOffsetByte, part.sourceOffsetByte + part.sourceLengthBytes)) !== part.sourceSha256) throw new Error("Context expansion changed source bytes");
    }
    files.set(contextManifest, Buffer.from(serialize(manifest)));
  }
  return files;
}

/** Pure assembly does not establish publication, npm verification or application activation. */
export async function assembleCatalogRelease({ runtime: input, identities: inputIdentities, verification: inputVerification,
  skillRelease: inputSkill, source, siteBaseUrl, examples = undefined, schemas = undefined }) {
  schemas ??= await loadAgentSchema();
  const verification = publishedInstallationVerificationSchema.parse(inputVerification);
  const skillRelease = skillReleaseSchema.parse(inputSkill);
  const origin = skillRelease.artifactBaseUrl;
  siteBaseUrl = artifactOrigin(siteBaseUrl);
  if (siteBaseUrl !== skillRelease.siteBaseUrl || verification.sourceRevision !== source.sourceRevision
    || new URL(verification.registry.baseUrl).origin !== origin || source.sourceClean !== true) throw new Error("Catalog inputs are not the same fixed source and origins");
  const runtime = structuredClone(input);
  if (runtime.examples || runtime.catalog.items.some(item => item.coverage === "example-verified")
    || Object.values(runtime.details).some(detail => detail.examples !== undefined || detail.item.coverage === "example-verified")) {
    throw new Error("Catalog source cannot supply verified example coverage or links");
  }
  if (!runtime.guideRoutes) throw new Error("New Catalog releases require explicit guide routes");
  schemas.guideRoutesSchema.parse(runtime.guideRoutes);
  if (serialize(input).includes(placeholder)) throw new Error("Source content contains the reserved catalog URL placeholder");
  const identities = schemas.itemIdentitiesSchema.parse(inputIdentities);
  const skillManifestSha256 = sha256(serialize(skillRelease));
  const exampleContent = examples ? assembleCatalogExamples(examples, { source, verification, skillManifestSha256,
    siteBaseUrl, artifactBaseUrl: origin, skillVersion: skillRelease.skillVersion, schemas }) : null;
  if (exampleContent) runtime.examples = exampleContent.metadata;
  runtime.installation = runtimeInstallationSummary(verification);
  runtime.catalog = { ...runtime.catalog, mode: "release", catalogVersion: "0".repeat(64),
    catalogUrl: `${origin}/ai/releases/${"0".repeat(64)}/catalog.json`, sourceRevision: source.sourceRevision,
    registryReleaseId: verification.registry.releaseId, skillVersion: skillRelease.skillVersion,
    registryManifestSha256: verification.registry.manifestSha256 };
  const skillTexts = Object.entries(runtime.skills).flatMap(([name, references]) => Object.entries(references).map(([relative, text]) => ({
    path: `${name}/${relative}`, bytes: Buffer.byteLength(text), sha256: sha256(text),
  }))).sort((a, b) => a.path.localeCompare(b.path, "en"));
  const [selectionName, ...selectionParts] = skillTextSelectionPath.split("/");
  const expectedTexts = selectSkillTextFiles(skillRelease.files, runtime.skills[selectionName]?.[selectionParts.join("/")]).sort((a, b) => a.path.localeCompare(b.path, "en"));
  if (serialize(skillTexts) !== serialize(expectedTexts)) throw new Error("Catalog Skill text differs from its fixed archive references");
  for (const item of runtime.catalog.items) {
    item.coverage = runtime.examples?.entries.some(example => example.adoptedItems.includes(item.id)) ? "example-verified"
      : runtime.details[item.id].guide !== null ? "guided" : "basic";
    if (item.docs) item.docs = `${siteBaseUrl}${new URL(item.docs).pathname}`;
    item.markdown = `${placeholder}/items/${encodeURIComponent(item.id)}.md`;
    item.detailUrl = `${placeholder}/items/${encodeURIComponent(item.id)}.json`;
    runtime.details[item.id].item = structuredClone(item);
    if (runtime.examples) {
      const links = schemas.exampleLinksForItem(runtime.examples, runtime.catalog.catalogUrl.slice(0, -"/catalog.json".length), item.id);
      if (links.length) runtime.details[item.id].examples = links;
    }
  }
  const templates = contexts(runtime, siteBaseUrl);
  const verificationBytes = Buffer.from(serialize(verification));
  const identity = identityOf(runtime, identities, verificationBytes, skillManifestSha256, templates, siteBaseUrl);
  const version = sha256(serialize(identity));
  const baseUrl = `${origin}/ai/releases/${version}`;
  runtime.catalog.catalogVersion = version;
  runtime.catalog.catalogUrl = `${baseUrl}/catalog.json`;
  for (const item of runtime.catalog.items) {
    item.markdown = artifactFileUrl(baseUrl, `items/${item.id}.md`);
    item.detailUrl = artifactFileUrl(baseUrl, `items/${item.id}.json`);
    runtime.details[item.id].item = structuredClone(item);
    if (runtime.details[item.id].examples) runtime.details[item.id].examples = schemas.exampleLinksForItem(runtime.examples, baseUrl, item.id);
  }
  schemas.runtimeSchema.parse(runtime);
  const files = materialize(runtime, identity, verificationBytes, exampleContent?.files);
  return { scope: "assembled-local-catalog-not-uploaded", executionTrust: "not-verified-by-pure-assembly", runtime, identity, baseUrl, files };
}

/** Reconstruct the complete declared stage; identity hashing excludes only derived URLs/revision. */
export async function verifyCatalogReleaseFiles(files, manifest, { schemas = undefined } = {}) {
  schemas ??= await loadAgentSchema();
  const readJson = name => JSON.parse(files.get(name)?.toString("utf8") ?? "");
  const runtime = schemas.runtimeSchema.parse(readJson("runtime.json"));
  const identity = readJson("identity.json");
  const identities = schemas.itemIdentitiesSchema.parse(readJson("item-identities.json"));
  const verification = publishedInstallationVerificationSchema.parse(readJson("installation-verification.json"));
  const examples = runtime.examples ? readCatalogExamples(files, runtime.examples,
    { source: manifest.provenance, verification, skillManifestSha256: identity.skillManifestSha256,
      siteBaseUrl: identity.siteBaseUrl, artifactBaseUrl: identity.artifactBaseUrl, skillVersion: runtime.catalog.skillVersion, schemas }) : null;
  if (manifest.kind !== "catalog" || manifest.provenance?.sourceClean !== true || runtime.catalog.mode !== "release"
    || runtime.catalog.catalogVersion !== manifest.releaseId || runtime.catalog.catalogUrl !== `${manifest.baseUrl}/catalog.json`
    || runtime.catalog.sourceRevision !== manifest.provenance.sourceRevision || verification.sourceRevision !== runtime.catalog.sourceRevision
    || serialize(runtime.installation) !== serialize(runtimeInstallationSummary(verification))) throw new Error("Catalog stage differs from frozen source or installation verification");
  const templates = contexts(runtime, identity.siteBaseUrl);
  const expectedIdentity = identityOf(runtime, identities, files.get("installation-verification.json"), identity.skillManifestSha256, templates, identity.siteBaseUrl);
  if (!/^[a-f0-9]{64}$/.test(identity.skillManifestSha256) || artifactOrigin(identity.siteBaseUrl) !== identity.siteBaseUrl
    || serialize(expectedIdentity) !== serialize(identity) || sha256(serialize(identity)) !== manifest.releaseId) throw new Error("Catalog content identity mismatch");
  const active = identities.items.filter(item => item.status === "active");
  if (active.length !== runtime.catalog.items.length || active.some(identity => !runtime.catalog.items.some(item =>
    item.id === identity.id && serialize(item.aliases) === serialize(identity.aliases)
      && (identity.type !== "registry" || identity.key === item.registryName)))) throw new Error("Catalog identity registry differs from published items");
  for (const item of runtime.catalog.items) {
    if (item.markdown !== artifactFileUrl(manifest.baseUrl, `items/${item.id}.md`)
      || item.detailUrl !== artifactFileUrl(manifest.baseUrl, `items/${item.id}.json`)) throw new Error("Catalog item points outside its fixed version");
  }
  const expected = materialize(runtime, identity, files.get("installation-verification.json"), examples?.files);
  if (serialize([...files.keys()].sort()) !== serialize([...expected.keys()].sort())
    || [...expected].some(([name, bytes]) => !bytes.equals(files.get(name)))) throw new Error("Catalog files differ from the exact runtime and context bytes");
  return { runtime, identities, verification, identity, ...(examples ? { examples } : {}) };
}
