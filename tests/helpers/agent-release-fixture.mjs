import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { artifactFileUrl, artifactManifestSchema, artifactManifestName } from "../../scripts/agent-artifacts.mjs";
import { artifactCompletionSchema } from "../../scripts/publish-agent-artifacts.mjs";
import { assembleSkillRelease } from "../../scripts/create-skill-release.mjs";
import { assembleCatalogRelease } from "../../scripts/agent-catalog-release.mjs";
import { serialize, sha256 } from "../../scripts/agent-utils.mjs";
import { frozenReleaseSchema, installationInputSchema } from "../../scripts/agent-release-record.mjs";
import { readSkillTexts } from "../../scripts/skill-text-references.mjs";
import { skillTextSelectionPath } from "../../lib/agent-catalog/skill-references.mjs";
import { readExampleSourceManifest, exampleDeclarationPath, exampleSourceDirectory } from "../../scripts/agent-example-sources.mjs";
import { fixtureExampleEvidence } from "./agent-example-evidence-fixture.mjs";

export const artifactOrigin = "https://artifacts.example.invalid";
export const siteOrigin = "https://docs.example.invalid";
export const reference = (url, bytes) => ({ url, bytes: bytes.length, sha256: sha256(bytes) });

// These resources never leave the test's injected public store or become a committed release.
export async function releaseFixture({ directory, label, objects, schemas, history = [], aliases = ["button"], guide = undefined,
  guideRoutes = { schemaVersion: 1, routes: [{ path: "components/button.md", itemId: "component:button" }] },
  extraSkillSources = new Map(), textSelection = false, includeExamples = false }) {
  const source = { sourceRevision: label.repeat(40), sourceInputSha256: label.repeat(64), lockfileSha256: "f".repeat(64), sourceClean: true };
  const skillSources = new Map(["zeron-page-builder", "swap-to-zeronui"].map(name => [`${name}/SKILL.md`, Buffer.from(`# ${name}\n\nHistorical fixture ${label}.\n`)]));
  for (const [relative, bytes] of extraSkillSources) skillSources.set(relative, bytes);
  if (textSelection) skillSources.set(skillTextSelectionPath, Buffer.from(serialize({ schemaVersion: 1,
    references: [...skillSources.keys(), skillTextSelectionPath].sort() })));
  const archive = zipSync(Object.fromEntries([...skillSources].map(([name, bytes]) => [name, [bytes, { mtime: new Date(2020, 0, 1) }]])));
  const skill = assembleSkillRelease({ archive,
    files: [...skillSources].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) })).sort((a, b) => a.path < b.path ? -1 : 1),
    template: await readFile("docs/skills/install.md", "utf8"), artifactBaseUrl: artifactOrigin, siteBaseUrl: siteOrigin });
  const skillFiles = new Map([["manifest.json", Buffer.from(serialize(skill.release))], ["zeron-skills.zip", archive], ["install.md", Buffer.from(skill.guide)],
    ...[...skillSources].map(([name, bytes]) => [`sources/${name}`, bytes])]);
  const stage = (kind, releaseId, files) => {
    const base = `${artifactOrigin}/${kind === "registry" ? "r" : kind === "skill" ? "skills" : "ai"}/releases/${releaseId}`;
    const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind, releaseId, baseUrl: base,
      files: [...files].sort(([a], [b]) => a.localeCompare(b, "en")).map(([name, bytes]) => ({ path: name, bytes: bytes.length,
        sha256: sha256(bytes), url: artifactFileUrl(base, name), contentType: name.endsWith(".json") ? "application/json"
          : name.endsWith(".zip") ? "application/zip" : name.endsWith(".md") ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8" })),
      ...(kind !== "skill" ? { provenance: source } : {}) });
    const manifestBytes = Buffer.from(serialize(manifest));
    const manifestUrl = artifactFileUrl(base, artifactManifestName(kind));
    const completion = artifactCompletionSchema.parse({ schemaVersion: 1, kind, releaseId, baseUrl: base,
      manifestUrl, manifestSha256: sha256(manifestBytes), files: files.size, totalBytes: [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0) });
    const completionBytes = Buffer.from(serialize(completion));
    for (const [name, bytes] of files) objects.set(artifactFileUrl(base, name), bytes);
    objects.set(manifestUrl, manifestBytes);
    objects.set(`${base}/complete.json`, completionBytes);
    return { manifest, manifestRef: reference(manifestUrl, manifestBytes), completionRef: reference(`${base}/complete.json`, completionBytes) };
  };
  const registryReleaseId = `fixture-${label}`;
  const exampleManifest = includeExamples ? await readExampleSourceManifest({ schemas }) : null;
  const registryIdentities = exampleManifest ? [...exampleManifest.hostRegistryItems.map(item => ({ id: item.itemId, registryName: item.registryName })),
    { id: "block:login-01", registryName: "login-01" }, { id: "support:tokens", registryName: "tokens" }].sort((a, b) => a.id.localeCompare(b.id, "en")) : null;
  const registryItems = registryIdentities?.map(identity => ({ name: identity.registryName, meta: { zeron: { framework: identity.id === "block:login-01" ? "next" : "react" } },
    registryDependencies: identity.registryName === "button" ? [`${artifactOrigin}/r/releases/${registryReleaseId}/tokens.json`] : [] }));
  const registryFiles = registryItems ? new Map([["registry.json", Buffer.from(serialize({ items: registryItems }))],
    ...registryItems.map(item => [`${item.name}.json`, Buffer.from(serialize(item))])]) : new Map([["registry.json", Buffer.from('{"items":[]}\n')], ["button.json", Buffer.from("{}\n")]]);
  const registry = stage("registry", registryReleaseId, registryFiles);
  const skillStage = stage("skill", skill.release.skillVersion, skillFiles);
  const verification = { schemaVersion: 1, kind: "published-consumer-verification", sourceRevision: source.sourceRevision,
    cli: { name: "zeron-ui", version: "1.2.3", distIntegrity: `sha512-${Buffer.alloc(64).toString("base64")}`,
      tarballUrl: "https://registry.npmjs.org/zeron-ui/-/zeron-ui-1.2.3.tgz", tarballBytes: 1234 },
    registry: { releaseId: registryReleaseId, baseUrl: registry.manifest.baseUrl, manifestSha256: registry.manifestRef.sha256, staticCheckedItems: ["component:button"] },
    matrices: ["next", "vite"].flatMap(framework => ["npm", "pnpm"].map(packageManager => ({ framework, packageManager,
      nodeVersion: "22.23.3", frameworkVersion: framework === "next" ? "15.5.9" : "7.1.0", packageManagerVersion: "10.1.0",
      testedItems: ["component:button"], registryClosure: ["button"], checks: { dryRun: true, install: true, types: true, build: true }, passed: true,
      evidence: reference(`https://github.com/example/fixture/actions/artifacts/${framework}-${packageManager}`, Buffer.from("fixture evidence")) }))) };
  const item = { id: "component:button", slug: "button", registryName: "button", kind: "component", collection: "components",
    title: { en: "Button", "zh-CN": "按钮" }, summary: { en: "Submit an action", "zh-CN": "提交操作" }, keywords: ["button"],
    useCases: ["Submit a form"], whenNotToUse: [], related: [], framework: "react", react: "^19.0.0", tailwind: "^4.0.0",
    installable: true, installationKind: "ui", readiness: null, dataMode: null, devices: null, domains: [],
    docs: `${siteOrigin}/docs/components/button`, markdown: `${siteOrigin}/ai/items/component%3Abutton.md`,
    detailUrl: `${siteOrigin}/ai/items/component%3Abutton.json`, coverage: "guided", aliases };
  const runtime = { catalog: { schemaVersion: 1, mode: "development", catalogVersion: "0".repeat(64), catalogUrl: null,
    sourceRevision: null, registryReleaseId: null, skillVersion: skill.release.skillVersion, registryManifestSha256: registry.manifestRef.sha256, items: [item] },
    details: { "component:button": { item, guide: guide ?? `# Button\n\n## Usage\n\nHistorical guide ${label}.\n`, guideLocale: "en",
      exports: ["Button"], sourceFiles: ["button.tsx"], dependencies: [], registryDependencies: [], keyApi: [] } },
    guideRoutes,
    skills: await readSkillTexts(skill.release.files, relative => skillSources.get(relative)), installation: null };
  const identities = { schemaVersion: 1, items: [{ id: "component:button", type: "registry", key: "button", aliases, status: "active", retirementReason: null }] };
  let examples;
  if (exampleManifest) {
    for (const identity of registryIdentities.filter(identity => identity.id !== "component:button")) {
      const extra = { ...structuredClone(item), id: identity.id, slug: identity.registryName, registryName: identity.registryName,
        kind: identity.id.startsWith("support:") ? "support" : identity.id.startsWith("block:") ? "block" : "component",
        framework: identity.id === "block:login-01" ? "next" : "react", aliases: [identity.registryName], coverage: "basic" };
      runtime.catalog.items.push(extra); runtime.details[extra.id] = { item: extra, guide: null, guideLocale: null,
        exports: [], sourceFiles: [], dependencies: [], registryDependencies: [], keyApi: [] };
      identities.items.push({ id: extra.id, type: "registry", key: extra.registryName, aliases: extra.aliases, status: "active", retirementReason: null });
    }
    verification.registry.staticCheckedItems = registryIdentities.map(item => item.id);
    for (const matrix of verification.matrices) {
      matrix.testedItems = matrix.framework === "next" ? ["component:button", "block:login-01"] : ["component:button"];
      matrix.registryClosure = matrix.framework === "next" ? ["button", "login-01", "tokens"] : ["button", "tokens"];
    }
    const sources = { manifest: exampleManifest, declaration: await readFile(exampleDeclarationPath),
      files: new Map(await Promise.all(exampleManifest.files.map(async file => [file.path, await readFile(`${exampleSourceDirectory}/${file.path}`)]))) };
    const input = installationInputSchema.parse({ schemaVersion: 1, kind: "published-installation-input", source, siteBaseUrl: siteOrigin, artifactBaseUrl: artifactOrigin,
      cli: { name: verification.cli.name, version: verification.cli.version, distIntegrity: verification.cli.distIntegrity },
      registry: { releaseId: registryReleaseId, manifest: registry.manifestRef, completion: registry.completionRef },
      skill: { version: skill.release.skillVersion, artifacts: skillStage.manifestRef, completion: skillStage.completionRef,
        manifest: reference(`${skill.baseUrl}/manifest.json`, skillFiles.get("manifest.json")), archive: reference(`${skill.baseUrl}/zeron-skills.zip`, archive),
        guide: reference(`${skill.baseUrl}/install.md`, Buffer.from(skill.guide)) }, items: registryIdentities,
      matrices: verification.matrices.map(({ framework, packageManager, testedItems }) => ({ framework, packageManager, testedItems })), nextOnlyRejectionItem: "block:login-01" });
    const prepared = { input, npm: { cli: verification.cli }, scope: { items: registryItems } };
    const synthetic = fixtureExampleEvidence(prepared, sources);
    examples = { prepared, sources, verification: synthetic.report, attachments: synthetic.attachments };
    for (const [url, bytes] of examples.attachments) objects.set(url, bytes);
  }
  const catalog = await assembleCatalogRelease({ runtime, identities, verification, skillRelease: skill.release, source, siteBaseUrl: siteOrigin, examples, schemas });
  const catalogStage = stage("catalog", catalog.runtime.catalog.catalogVersion, catalog.files);
  const record = frozenReleaseSchema.parse({ schemaVersion: 1, source, artifactBaseUrl: artifactOrigin, siteBaseUrl: siteOrigin,
    registry: { releaseId: registryReleaseId, manifest: registry.manifestRef, completion: registry.completionRef },
    skill: { version: skill.release.skillVersion, artifacts: skillStage.manifestRef, completion: skillStage.completionRef,
      manifest: reference(`${skill.baseUrl}/manifest.json`, skillFiles.get("manifest.json")),
      archive: reference(`${skill.baseUrl}/zeron-skills.zip`, archive), guide: reference(`${skill.baseUrl}/install.md`, Buffer.from(skill.guide)) },
    catalog: { version: catalog.runtime.catalog.catalogVersion, manifest: catalogStage.manifestRef, completion: catalogStage.completionRef,
      installationVerification: reference(`${catalog.baseUrl}/installation-verification.json`, catalog.files.get("installation-verification.json")) }, history });
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, `${record.catalog.version}.json`);
  const recordBytes = Buffer.from(serialize(record));
  await writeFile(filename, recordBytes);
  return { record, filename, recordBytes, localRef: { path: path.basename(filename), bytes: recordBytes.length, sha256: sha256(recordBytes) },
    catalog, skill, registry, skillStage, catalogStage, verification, identities, ...(examples ? { examples } : {}) };
}
