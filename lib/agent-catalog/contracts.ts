import { z } from "zod";
import { frameworkSchema, hashSchema, kindSchema, localeSchema } from "./schema";

const common = {
  locale: localeSchema.default("zh-CN"),
  catalogVersion: hashSchema.optional(),
};
const filters = {
  kind: kindSchema.optional(),
  framework: frameworkSchema.optional(),
  installable: z.boolean().optional(),
  includeSupportItems: z.boolean().default(false),
};
const pagination = {
  limit: z.number().int().min(1).max(20).default(10),
  cursor: z.string().max(2048).optional(),
};
export const sectionSchema = z.enum(["overview", "usage", "api", "examples", "installation", "sources"]);
export const toolSchemas = {
  search_components: z.strictObject({ ...common, ...filters, ...pagination, query: z.string().trim().min(1).max(256) }),
  list_components: z.strictObject({ ...common, ...filters, ...pagination, collection: z.string().trim().min(1).max(64).optional(), domain: z.string().trim().min(1).max(64).optional() }),
  get_component: z.strictObject({ ...common, id: z.string().trim().min(1).max(128), sections: z.array(sectionSchema).min(1).max(6).optional(), cursor: z.string().max(2048).optional() }),
  get_install_command: z.strictObject({ ...common, ids: z.array(z.string().trim().min(1).max(128)).min(1).max(20), packageManager: z.enum(["npm", "pnpm"]), targetFramework: frameworkSchema.optional() }),
  get_skill: z.strictObject({ ...common, name: z.enum(["zeron-page-builder", "swap-to-zeronui"]), reference: z.string().min(1).max(256).default("SKILL.md"), section: z.string().min(1).max(256).optional(), cursor: z.string().max(2048).optional() }),
};
export type ToolName = keyof typeof toolSchemas;
export type ToolInputs = { [Name in ToolName]: z.infer<(typeof toolSchemas)[Name]> };

export const errorCodeSchema = z.enum([
  "ITEM_NOT_FOUND", "AMBIGUOUS_ITEM", "VERSION_UNAVAILABLE", "INVALID_CURSOR", "NOT_INSTALLABLE",
  "FRAMEWORK_INCOMPATIBLE", "TARGET_ENVIRONMENT_REQUIRED", "INSTALLATION_UNVERIFIED",
  "SKILL_NOT_FOUND", "REFERENCE_NOT_FOUND", "SECTION_NOT_FOUND", "INTERNAL_ERROR",
]);
export const metaSchema = z.object({
  schemaVersion: z.literal(1), catalogVersion: hashSchema.nullable(), catalogUrl: z.string().nullable(),
  sourceRevision: z.string().nullable(), mode: z.enum(["development", "release"]).nullable(),
  requestedLocale: localeSchema, warnings: z.array(z.string()),
});
const summarySchema = z.object({
  id: z.string(), registryName: z.string().nullable(), title: z.string(), summary: z.string(),
  titleLocale: localeSchema, summaryLocale: localeSchema, kind: kindSchema, collection: z.string(),
  framework: z.enum(["react", "next"]).nullable(), compatibility: z.enum(["compatible", "incompatible", "unknown"]),
  installable: z.boolean(), coverage: z.enum(["basic", "guided", "example-verified"]),
  docs: z.string().nullable(), markdown: z.string(), detailUrl: z.string(), matchedBy: z.array(z.string()),
});
const pageSchema = z.object({ items: z.array(summarySchema), total: z.number().int(), nextCursor: z.string().nullable() });
const chapterPageSchema = z.object({
  sections: z.array(z.object({ name: z.string(), text: z.string(), contentLocale: localeSchema.nullable(),
    startByte: z.number().int().nonnegative().optional(), endByte: z.number().int().nonnegative().optional() }).superRefine((section, context) => {
      if ((section.startByte === undefined) !== (section.endByte === undefined)
        || (section.startByte !== undefined && section.endByte! - section.startByte !== Buffer.byteLength(section.text, "utf8"))) {
        context.addIssue({ code: "custom", message: "Source byte range must exactly describe the returned UTF-8 text" });
      }
    })),
  availableSections: z.array(z.string()), truncated: z.boolean(), nextCursor: z.string().nullable(),
});
const installSchema = z.object({
  cliVersion: z.string(), cliDistIntegrity: z.string(), registryBase: z.string(),
  packageManager: z.enum(["npm", "pnpm"]), targetFramework: z.enum(["next", "vite"]),
  commands: z.object({ dryRun: z.string(), install: z.string() }),
  arguments: z.object({ executable: z.enum(["npx", "pnpm"]), dryRun: z.array(z.string()), install: z.array(z.string()) }),
  itemVerification: z.array(z.object({ id: z.string(), staticClosureChecked: z.literal(true), consumerTested: z.boolean() })),
  prerequisites: z.array(z.string()),
});
const dataSchemas = {
  search_components: pageSchema,
  list_components: pageSchema,
  get_component: chapterPageSchema.extend({ item: summarySchema }),
  get_install_command: installSchema,
  get_skill: chapterPageSchema.extend({ name: z.string(), reference: z.string(), references: z.array(z.string()), skillVersion: hashSchema.nullable(), installationGuide: z.string(),
    contentFormat: z.enum(["markdown", "text"]).optional(), sourceBytes: z.number().int().nonnegative().optional(), sourceSha256: hashSchema.optional() }).superRefine((data, context) => {
      if (data.contentFormat === "text" && (data.sourceBytes === undefined || data.sourceSha256 === undefined
        || data.availableSections.length !== 1 || data.availableSections[0] !== "Content"
        || data.sections.some(section => section.name !== "Content" || section.startByte === undefined || section.endByte! > data.sourceBytes!))) {
        context.addIssue({ code: "custom", message: "Text reference requires source identity and exact Content ranges" });
      }
    }),
};
const errorBodySchema = z.object({ code: errorCodeSchema, message: z.string(), details: z.record(z.string(), z.unknown()) });
// An object root avoids SDK compatibility wrapping under structuredContent.value.
const output = <Data extends z.ZodType>(data: Data) => z.object({ meta: metaSchema, data: data.optional(), error: errorBodySchema.optional() })
  .refine((result) => (result.data !== undefined) !== (result.error !== undefined), "Exactly one of data or error is required");
export const outputSchemas = {
  search_components: output(dataSchemas.search_components),
  list_components: output(dataSchemas.list_components),
  get_component: output(dataSchemas.get_component),
  get_install_command: output(dataSchemas.get_install_command),
  get_skill: output(dataSchemas.get_skill),
};
export type ResultMeta = z.infer<typeof metaSchema>;
export type ToolErrorCode = z.infer<typeof errorCodeSchema>;
export type QueryResult = { meta: ResultMeta; data: Record<string, unknown> } | { meta: ResultMeta; error: z.infer<typeof errorBodySchema> };
