import { z } from "zod";
import { isSkillTextReference, parseSkillTextSelection, skillTextSelectionPath } from "./skill-references.mjs";

export const localeSchema = z.enum(["zh-CN", "en"]);
export const kindSchema = z.enum(["component", "block", "page", "flow", "prototype", "layout", "support", "reference"]);
export const frameworkSchema = z.enum(["react", "next", "vite"]);
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const idSchema = z.string().regex(/^[a-z][a-z-]*:[a-z0-9][a-z0-9-]*$/);
export const registryNameSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
export const guideRoutesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  routes: z.array(z.strictObject({
    path: z.string().regex(/^(?:blocks|components)\/[a-z0-9][a-z0-9-]*\.md$/),
    itemId: idSchema,
  })).max(256),
}).superRefine((mapping, context) => {
  const paths = mapping.routes.map(route => route.path);
  if (new Set(paths).size !== paths.length || paths.some((value, index) => index > 0 && paths[index - 1] >= value)) {
    context.addIssue({ code: "custom", message: "Guide paths must be unique and sorted" });
  }
});

/** Previously published guide paths cannot silently disappear or change owners. */
export function validateGuideRouteEvolution(previousInput: unknown, currentInput: unknown) {
  const previous = guideRoutesSchema.parse(previousInput);
  const current = guideRoutesSchema.parse(currentInput);
  const byPath = new Map(current.routes.map(route => [route.path, route.itemId]));
  for (const route of previous.routes) {
    if (byPath.get(route.path) !== route.itemId) throw new Error(`Keep the published guide path and its item identity: ${route.path}`);
  }
  return current;
}
// 64 bytes use 86 base64 symbols plus ==; the final symbol has zero pad bits.
export const cliIntegritySchema = z.string().regex(/^sha512-[A-Za-z0-9+/]{85}[AQgw]==$/);
export const itemIdentitiesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  items: z.array(z.strictObject({
    id: idSchema,
    type: z.enum(["registry", "document", "page"]),
    key: z.string().regex(/^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)?$/),
    aliases: z.array(registryNameSchema).min(1),
    status: z.enum(["active", "retired"]),
    retirementReason: z.string().trim().min(1).nullable(),
  }).superRefine((item, context) => {
    if ((item.status === "retired") !== (item.retirementReason !== null)) {
      context.addIssue({ code: "custom", message: "Retirement requires an explicit reason; active identities cannot be retired" });
    }
    if ((item.type === "document") !== item.key.includes("/")) {
      context.addIssue({ code: "custom", message: "Documents use collection/slug; Registry and page keys use names" });
    }
    if (new Set(item.aliases).size !== item.aliases.length) {
      context.addIssue({ code: "custom", message: "Duplicate identity alias" });
    }
    if (!item.aliases.includes(item.id.split(":")[1])) {
      context.addIssue({ code: "custom", message: "Keep the original registered name as an alias" });
    }
  })),
}).superRefine((identities, context) => {
  const ids = new Set<string>();
  const sources = new Set<string>();
  for (const item of identities.items) {
    if (ids.has(item.id)) context.addIssue({ code: "custom", message: `Duplicate registered ID: ${item.id}` });
    ids.add(item.id);
    if (item.status === "active") {
      const source = `${item.type}:${item.key}`;
      if (sources.has(source)) context.addIssue({ code: "custom", message: `Duplicate active source: ${source}` });
      sources.add(source);
    }
  }
});

/** Persisted IDs survive source classification changes. Aliases remain explicit. */
export function createItemIdentityRegistry(input: unknown) {
  const identities = itemIdentitiesSchema.parse(input);
  const active = new Map(identities.items.filter((item) => item.status === "active").map((item) => [`${item.type}:${item.key}`, item]));
  const used = new Set<string>();
  return {
    identities,
    resolve(type: "registry" | "document" | "page", key: string, aliases: string[] = []) {
      const source = `${type}:${key}`;
      const identity = active.get(source);
      if (!identity) throw new Error(`Missing active identity registration: ${source}`);
      for (const alias of aliases) {
        if (!identity.aliases.includes(alias)) throw new Error(`Register current and previous aliases for ${identity.id}: missing ${alias}`);
      }
      used.add(source);
      return identity;
    },
    assertComplete() {
      for (const source of active.keys()) if (!used.has(source)) throw new Error(`Active identity has no source: ${source}; retire it explicitly`);
    },
  };
}

/** Release restoration compares against the previous frozen identity manifest. */
export function validateItemIdentityEvolution(previousInput: unknown, currentInput: unknown) {
  const previous = itemIdentitiesSchema.parse(previousInput);
  const current = itemIdentitiesSchema.parse(currentInput);
  const byId = new Map(current.items.map((item) => [item.id, item]));
  for (const before of previous.items) {
    const after = byId.get(before.id);
    if (!after) throw new Error(`Keep the registered ID and retire it explicitly: ${before.id}`);
    if (before.aliases.some((alias) => !after.aliases.includes(alias))) throw new Error(`Keep all previously published aliases: ${before.id}`);
    if (before.status === "retired" && after.status !== "retired") throw new Error(`A retired ID cannot be assigned again: ${before.id}`);
  }
  return current;
}
export const httpsUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
}, "Expected a fixed public HTTPS resource URL");
export const localizedTextSchema = z.object({ en: z.string(), "zh-CN": z.string().nullable() });
const exampleProfileSchema = z.strictObject({ framework: z.enum(["next", "vite"]), packageManager: z.enum(["npm", "pnpm"]) });
const exampleArtifactSchema = z.strictObject({
  path: z.string().regex(/^examples\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:ts|tsx|md|json)$/),
  bytes: z.number().int().nonnegative().max(2 * 1024 * 1024), sha256: hashSchema,
});
const exampleIdSchema = z.enum(["resource-detail", "resource-list", "settings"]);
export const catalogExamplesSchema = z.strictObject({
  schemaVersion: z.literal(1), sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
  inputSha256: hashSchema, registryReleaseId: z.string(), registryManifestSha256: hashSchema, skillVersion: hashSchema,
  sourceManifest: exampleArtifactSchema.extend({ path: z.literal("examples/source-manifest.json") }),
  declaration: exampleArtifactSchema.extend({ path: z.literal("examples/declarations.json") }),
  verification: exampleArtifactSchema.extend({ path: z.literal("examples/verification.json") }),
  installationInput: exampleArtifactSchema.extend({ path: z.literal("examples/installation-input.json") }),
  instructions: exampleArtifactSchema, sources: z.array(exampleArtifactSchema).min(1).max(64),
  entries: z.array(z.strictObject({
    exampleId: exampleIdSchema, entry: z.string().regex(/^examples\/sources\/(?:resource-detail|resource-list|settings)\/page\.tsx$/),
    adoptedItems: z.array(idSchema).min(1).max(64), profiles: z.array(exampleProfileSchema).min(1).max(4),
  })).length(3),
}).superRefine((examples, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  const paths = examples.sources.map(file => file.path);
  if (new Set(paths).size !== paths.length || paths.some((value, index) => !value.startsWith("examples/sources/")
    || (index > 0 && paths[index - 1] >= value)) || examples.sources.reduce((sum, file) => sum + file.bytes, 0) > 8 * 1024 * 1024) issue("Invalid example source inventory");
  if (!examples.sources.some(file => JSON.stringify(file) === JSON.stringify(examples.instructions))) issue("Missing example instructions");
  if (examples.entries.map(entry => entry.exampleId).join(",") !== "resource-detail,resource-list,settings") issue("Missing or duplicated runnable example");
  for (const entry of examples.entries) {
    const profiles = entry.profiles.map(profile => `${profile.framework}:${profile.packageManager}`);
    if (entry.entry !== `examples/sources/${entry.exampleId}/page.tsx` || !paths.includes(entry.entry)
      || new Set(entry.adoptedItems).size !== entry.adoptedItems.length || entry.adoptedItems.some((id, index) => index > 0 && entry.adoptedItems[index - 1] >= id)
      || new Set(profiles).size !== profiles.length || profiles.some((profile, index) => index > 0 && profiles[index - 1] >= profile)) issue("Invalid example adoption, entry or profiles");
  }
});
export const exampleLinkSchema = z.strictObject({
  exampleId: exampleIdSchema, source: httpsUrlSchema, instructions: httpsUrlSchema, verification: httpsUrlSchema,
  profiles: z.array(exampleProfileSchema).min(1).max(4),
});
export function exampleLinksForItem(examples: z.infer<typeof catalogExamplesSchema>, base: string, id: string) {
  return examples.entries.filter(entry => entry.adoptedItems.includes(id)).map(entry => ({
    exampleId: entry.exampleId, source: `${base}/${entry.entry}`, instructions: `${base}/${examples.instructions.path}`,
    verification: `${base}/${examples.verification.path}`, profiles: entry.profiles,
  }));
}
export const itemSchema = z.object({
  id: idSchema,
  slug: z.string(),
  registryName: registryNameSchema.nullable(),
  kind: kindSchema,
  collection: z.string(),
  title: localizedTextSchema,
  summary: localizedTextSchema,
  keywords: z.array(z.string()),
  useCases: z.array(z.string()),
  whenNotToUse: z.array(z.string()),
  related: z.array(idSchema),
  framework: z.enum(["react", "next"]).nullable(),
  react: z.string().nullable(),
  tailwind: z.string().nullable(),
  installable: z.boolean(),
  installationKind: z.enum(["ui", "data-block", "template"]).nullable(),
  readiness: z.string().nullable(),
  dataMode: z.string().nullable(),
  devices: z.array(z.string()).nullable(),
  domains: z.array(z.string()),
  docs: httpsUrlSchema.nullable(),
  markdown: httpsUrlSchema,
  detailUrl: httpsUrlSchema,
  coverage: z.enum(["basic", "guided", "example-verified"]),
  aliases: z.array(z.string()),
}).superRefine((item, context) => {
  if (item.installable !== (item.registryName !== null && item.installationKind !== null)) {
    context.addIssue({ code: "custom", message: "Installation identity is inconsistent" });
  }
});
export const detailSchema = z.object({
  item: itemSchema,
  guide: z.string().nullable(),
  guideLocale: localeSchema.nullable(),
  exports: z.array(z.string()),
  sourceFiles: z.array(z.string()),
  dependencies: z.array(z.string()),
  registryDependencies: z.array(z.string()),
  keyApi: z.array(z.string()),
  examples: z.array(exampleLinkSchema).min(1).max(3).optional(),
});
export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(["development", "release"]),
  catalogVersion: hashSchema,
  catalogUrl: httpsUrlSchema.nullable(),
  sourceRevision: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  registryReleaseId: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/).nullable(),
  skillVersion: hashSchema.nullable(),
  registryManifestSha256: hashSchema,
  items: z.array(itemSchema),
});
export const installationSchema = z.object({
    cliVersion: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/),
    cliDistIntegrity: cliIntegritySchema,
    registryBase: httpsUrlSchema,
    registryManifestSha256: hashSchema,
    staticCheckedItems: z.array(idSchema),
    matrices: z.array(z.object({
      framework: z.enum(["next", "vite"]),
      packageManager: z.enum(["npm", "pnpm"]),
      testedItems: z.array(idSchema),
      passed: z.literal(true),
    })),
}).strict().superRefine((installation, context) => {
  const keys = installation.matrices.map(matrix => `${matrix.framework}:${matrix.packageManager}`);
  if (new Set(keys).size !== keys.length || new Set(installation.staticCheckedItems).size !== installation.staticCheckedItems.length
    || installation.matrices.some(matrix => new Set(matrix.testedItems).size !== matrix.testedItems.length)) {
    context.addIssue({ code: "custom", message: "Duplicate installation verification scope" });
  }
});
export const runtimeSchema = z.object({
  catalog: catalogSchema,
  details: z.record(z.string(), detailSchema),
  // Absent only in historical snapshots created before explicit route publication.
  guideRoutes: guideRoutesSchema.optional(),
  // Legacy snapshots omit this; they cannot claim verified runnable examples.
  examples: catalogExamplesSchema.optional(),
  skills: z.record(z.string(), z.record(z.string(), z.string())),
  installation: installationSchema.nullable(),
}).superRefine((runtime, context) => {
  const { catalog } = runtime;
  const ids = new Set(catalog.items.map((item) => item.id));
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  if (ids.size !== catalog.items.length) issue("Duplicate catalog identity");
  if (Object.keys(runtime.details).length !== ids.size) issue("Detail coverage differs from catalog");
  for (const item of catalog.items) {
    if (!Object.hasOwn(runtime.details, item.id) || JSON.stringify(runtime.details[item.id].item) !== JSON.stringify(item)) issue(`Detail identity differs: ${item.id}`);
    if (item.related.some((id) => !ids.has(id))) issue(`Missing related identity: ${item.id}`);
  }
  if (runtime.guideRoutes) {
    const guided = new Set(runtime.guideRoutes.routes.map(route => route.itemId));
    for (const route of runtime.guideRoutes.routes) {
      if (!ids.has(route.itemId) || runtime.details[route.itemId]?.guide == null) issue(`Guide route has no maintained guide: ${route.path}`);
    }
    for (const [id, detail] of Object.entries(runtime.details)) {
      if (detail.guide !== null && !guided.has(id)) issue(`Maintained guide has no registered route: ${id}`);
    }
  }
  if (catalog.mode === "development" && (runtime.installation !== null || catalog.catalogUrl !== null)) issue("Development cannot claim published installation or catalog");
  if (catalog.mode === "release" && (!runtime.installation || !catalog.catalogUrl || !catalog.sourceRevision || !catalog.registryReleaseId || !catalog.skillVersion)) issue("Release requires frozen resources and verified installation");
  if (runtime.examples) {
    const examples = runtime.examples;
    if (catalog.mode !== "release" || examples.sourceRevision !== catalog.sourceRevision || examples.registryReleaseId !== catalog.registryReleaseId
      || examples.registryManifestSha256 !== catalog.registryManifestSha256 || examples.skillVersion !== catalog.skillVersion) issue("Runnable examples differ from frozen catalog resources");
    for (const entry of examples.entries) for (const id of entry.adoptedItems) {
      const item = catalog.items.find(item => item.id === id);
      if (!item?.installable || item.kind === "support" || !runtime.installation?.staticCheckedItems.includes(id)
        || entry.profiles.some(profile => profile.framework === "vite" && item.framework !== "react")) issue(`Invalid verified example adoption: ${id}`);
    }
  }
  for (const item of catalog.items) {
    const detail = runtime.details[item.id];
    const links = runtime.examples && catalog.catalogUrl ? exampleLinksForItem(runtime.examples, catalog.catalogUrl.slice(0, -"/catalog.json".length), item.id) : [];
    if (links.length) {
      if (item.coverage !== "example-verified" || JSON.stringify(detail?.examples) !== JSON.stringify(links)) issue(`Missing verified example links: ${item.id}`);
    } else if (item.coverage === "example-verified" || detail?.examples !== undefined) issue(`Example coverage has no bound declaration: ${item.id}`);
  }
  if (runtime.installation) {
    if (runtime.installation.registryManifestSha256 !== catalog.registryManifestSha256) issue("Installation manifest differs from catalog");
    if (runtime.installation.staticCheckedItems.some((id) => !ids.has(id))) issue("Installation verification references unknown item");
    for (const matrix of runtime.installation.matrices) {
      if (!matrix.testedItems.length || matrix.testedItems.some((id) => !ids.has(id))) issue("Invalid consumer verification scope");
    }
  }
  for (const [name, references] of Object.entries(runtime.skills)) {
    if (!["zeron-page-builder", "swap-to-zeronui"].includes(name) || !Object.hasOwn(references, "SKILL.md")) issue("Invalid skill identity");
    for (const [reference, text] of Object.entries(references)) {
      if (!isSkillTextReference(reference) || text.includes("\0") || Buffer.byteLength(text) > 8 * 1024 * 1024) issue("Invalid skill reference");
    }
  }
  const paths = Object.entries(runtime.skills).flatMap(([name, references]) => Object.keys(references).map(reference => `${name}/${reference}`)).sort();
  if (!["zeron-page-builder", "swap-to-zeronui"].every(name => Object.hasOwn(runtime.skills, name)) || paths.length > 256
    || Object.values(runtime.skills).flatMap(references => Object.values(references)).reduce((sum, text) => sum + Buffer.byteLength(text), 0) > 32 * 1024 * 1024) issue("Invalid paired Skill text inventory");
  const [selectionName, ...selectionParts] = skillTextSelectionPath.split("/");
  const selectionText = runtime.skills[selectionName]?.[selectionParts.join("/")];
  try {
    if (selectionText !== undefined) {
      if (JSON.stringify(parseSkillTextSelection(JSON.parse(selectionText), paths)) !== JSON.stringify(paths)) issue("Runtime Skill references differ from its text selection");
    } else if (paths.some(reference => !reference.endsWith(".md"))) issue("Non-Markdown Skill references require an explicit text selection");
  } catch { issue("Invalid runtime Skill text selection"); }
});
export type CatalogItem = z.infer<typeof itemSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type AgentRuntime = z.infer<typeof runtimeSchema>;

/** Only historical snapshots without a persisted mapping use their original URL convention. */
export function guideRoutesForRuntime(runtime: AgentRuntime) {
  if (runtime.guideRoutes) return guideRoutesSchema.parse(runtime.guideRoutes);
  return guideRoutesSchema.parse({ schemaVersion: 1, routes: Object.values(runtime.details).filter(detail => detail.guide !== null).map(detail => {
    if (!detail.item.registryName) throw new Error("Historical guide has no Registry location");
    return { path: `${detail.item.id.startsWith("component:") ? "components" : "blocks"}/${detail.item.registryName}.md`, itemId: detail.item.id };
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) });
}
