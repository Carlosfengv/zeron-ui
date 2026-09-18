import { readFileSync } from "node:fs";
import { hash, readProjectFile, relativePath } from "./project.js";

export const planSchema = JSON.parse(readFileSync(new URL("./migration-plan.schema.json", import.meta.url), "utf8"));
export const scopeDigest = ({ roots, routes }) => hash(JSON.stringify({ roots, routes }));

// Deliberately implements only the vocabulary used by the bundled closed schema.
// Fail on malformed plans rather than coercing incomplete evidence into success.
export function validatePlan(plan) {
  const errors = [];
  function visit(value, schema, at) {
    if ("const" in schema && value !== schema.const) errors.push(`${at}: invalid version/value`);
    if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: expected ${schema.enum.join(" / ")}`);
    const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    if (schema.type && !(Array.isArray(schema.type) ? schema.type : [schema.type]).includes(type)) {
      errors.push(`${at}: expected ${schema.type}`);
      return;
    }
    if (type === "string") {
      if (schema.minLength && value.trim().length < schema.minLength) errors.push(`${at}: empty string`);
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: invalid format`);
    }
    if (type === "array") {
      if (value.length < (schema.minItems ?? 0)) errors.push(`${at}: too few items`);
      if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${at}: duplicate items`);
      value.forEach((item, index) => visit(item, schema.items, `${at}[${index}]`));
    }
    if (type === "object") {
      for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${at}.${key}: required`);
      if (Object.keys(value).length < (schema.minProperties ?? 0)) errors.push(`${at}: too few entries`);
      for (const [key, item] of Object.entries(value)) {
        const child = schema.properties?.[key] ?? schema.additionalProperties;
        if (child === false) errors.push(`${at}.${key}: unknown field`);
        else if (child && child !== true) visit(item, child, `${at}.${key}`);
      }
    }
  }
  visit(plan, planSchema, "plan");
  if (errors.length) return errors;
  const paths = [...plan.scope.roots, ...plan.scope.routes, ...Object.keys(plan.baseline.files), ...Object.keys(plan.managedFiles), ...plan.mappings.flatMap((m) => m.source.files), ...plan.batches.flatMap((b) => b.files.map((f) => f.path))];
  for (const file of paths) if (!relativePath(file)) errors.push(`Invalid relative path: ${file}`);
  for (const entries of [plan.mappings, plan.unknownResolutions, plan.batches]) if (new Set(entries.map((entry) => entry.id)).size !== entries.length) errors.push("Duplicate record id");
  if (new Set(plan.checks.map((check) => check.kind)).size !== plan.checks.length) errors.push("Duplicate check kind");
  for (const mapping of plan.mappings) if (!Object.values(mapping.source).some((list) => list.length)) errors.push(`Mapping ${mapping.id} needs a source selector`);
  if (plan.scope.digest !== scopeDigest(plan.scope)) errors.push("Scope digest changed; reconcile against original baseline scope");
  return errors;
}

export async function verifyEvidence(cwd, evidence) {
  try {
    return hash(await readProjectFile(cwd, evidence.path)) === evidence.sha256;
  } catch {
    return false;
  }
}
