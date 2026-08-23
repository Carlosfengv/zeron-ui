import type {
  FilterClause,
  FilterClauseValue,
  FilterField,
  FilterOperator,
} from "#system/filter-core";
import type {
  FilterQueryCodec,
  FilterQueryCodecContext,
  FilterQueryError,
  FilterQueryFieldConfig,
  FilterQueryParseResult,
  FilterQuerySerializeResult,
  FilterQueryToken,
  FilterQueryValueParseContext,
} from "./filter-query-types";

type RawToken = { value: string; start: number; end: number };

function splitTokens(input: string): RawToken[] {
  const tokens: RawToken[] = [];
  let start = -1;
  let quote: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index <= input.length; index += 1) {
    const char = input[index];
    if (index === input.length || (!quote && /\s/.test(char))) {
      if (start >= 0) tokens.push({ value: input.slice(start, index), start, end: index });
      start = -1;
      continue;
    }
    if (start < 0) start = index;
    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = undefined;
    } else if (char === "'" || char === '"') {
      quote = char;
    }
  }
  return tokens;
}

function unquote(value: string) {
  const first = value[0];
  const last = value[value.length - 1];
  const quoted = (first === '"' || first === "'") && first === last;
  const source = quoted ? value.slice(1, -1) : value;
  return source.replace(/\\([\\"'])/g, "$1");
}

function splitCommaValues(value: string) {
  const values: string[] = [];
  let start = 0;
  let quoteCharacter: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index <= value.length; index += 1) {
    const character = value[index];
    if (index === value.length || (!quoteCharacter && character === ",")) {
      values.push(value.slice(start, index));
      start = index + 1;
      continue;
    }
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (quoteCharacter && character === quoteCharacter) quoteCharacter = undefined;
    else if (!quoteCharacter && (character === "'" || character === '"')) quoteCharacter = character;
  }
  return values;
}

function hasUnclosedQuote(value: string) {
  let quoteCharacter: "'" | '"' | undefined;
  let escaped = false;
  for (const character of value) {
    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (quoteCharacter && character === quoteCharacter) quoteCharacter = undefined;
    else if (!quoteCharacter && (character === "'" || character === '"')) quoteCharacter = character;
  }
  return Boolean(quoteCharacter || escaped);
}

function quote(value: string) {
  return /[\s,:]/.test(value) ? `"${value.replace(/[\\"]/g, "\\$&")}"` : value;
}

function defaultOperator(field: FilterField): FilterOperator {
  if (field.defaultOperator) return field.defaultOperator;
  switch (field.type) {
    case "text": return "contains";
    case "select": return "is";
    case "multiSelect": return "isAnyOf";
    case "boolean": return "isTrue";
    case "number": return "equals";
    case "date": return "equals";
    case "dateRange": return "isBetween";
    default: return "equals";
  }
}

function operatorAllowed(field: FilterField, operator: FilterOperator) {
  return !field.operators || field.operators.some((definition) => definition.value === operator);
}

function isIsoDate(value: string) {
  return (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) && Number.isFinite(Date.parse(value));
}

function validateValue(field: FilterField, operator: FilterOperator, value: FilterClauseValue | undefined) {
  if (field.type === "date") {
    if (typeof value !== "string" || !isIsoDate(value)) return { valid: false as const, message: `Enter an ISO date for ${field.label}.` };
    return field.validate?.(value, { field, operator }) ?? { valid: true as const };
  }
  if (field.type === "dateRange") {
    const range = value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
    if (!range || typeof range.from !== "string" || typeof range.to !== "string" || !isIsoDate(range.from) || !isIsoDate(range.to)) {
      return { valid: false as const, message: `Enter an ISO date range for ${field.label}.` };
    }
    return field.validate?.(range, { field, operator }) ?? { valid: true as const };
  }
  if (field.type === "number" && typeof value !== "undefined") {
    const numeric = Array.isArray(value) ? value : value;
    return field.validate?.(numeric as number | number[], { field, operator }) ?? { valid: true as const };
  }
  if (field.type === "text" && typeof value === "string") {
    return field.validate?.(value, { field, operator }) ?? { valid: true as const };
  }
  return { valid: true as const };
}

function defaultParseValue(rawValue: string, context: FilterQueryValueParseContext) {
  const { field } = context;
  if (field.type === "custom") return { valid: false as const, message: `${field.label} needs a custom query parser.` };
  if (field.type === "boolean") {
    const value = rawValue.toLocaleLowerCase();
    if (["true", "1", "yes"].includes(value)) return { valid: true as const, operator: "isTrue" as FilterOperator };
    if (["false", "0", "no"].includes(value)) return { valid: true as const, operator: "isFalse" as FilterOperator };
    return { valid: false as const, message: `Use true or false for ${field.label}.` };
  }
  if (field.type === "number") {
    const range = rawValue.match(/^(-?(?:\d+\.?\d*|\.\d+))-(-?(?:\d+\.?\d*|\.\d+))$/);
    if (range) return { valid: true as const, operator: "isBetween" as FilterOperator, value: [Number(range[1]), Number(range[2])] as FilterClauseValue };
    const value = Number(rawValue);
    return Number.isFinite(value)
      ? { valid: true as const, operator: defaultOperator(field), value }
      : { valid: false as const, message: `Enter a valid number for ${field.label}.` };
  }
  if (field.type === "multiSelect") {
    const value = splitCommaValues(rawValue).map(unquote).filter(Boolean);
    return value.length
      ? { valid: true as const, operator: defaultOperator(field), value }
      : { valid: false as const, message: `Enter a value for ${field.label}.` };
  }
  if (field.type === "dateRange" && rawValue.includes("..")) {
    const [from, to] = rawValue.split("..", 2);
    return { valid: true as const, operator: "isBetween" as FilterOperator, value: { from, to } };
  }
  const value = unquote(rawValue);
  if (!value && field.type !== "text") return { valid: false as const, message: `Enter a value for ${field.label}.` };
  return { valid: true as const, operator: defaultOperator(field), value: field.type === "text" ? field.parse?.(value) ?? value : value };
}

function clauseIdentity(clause: Pick<FilterClause, "field" | "operator" | "value" | "meta">) {
  return JSON.stringify([clause.field, clause.operator, clause.value ?? null, clause.meta ?? null]);
}

function reconcileClauses(next: FilterClause[], previous: readonly FilterClause[], createClauseId: () => string) {
  const ids = new Map<string, string[]>();
  for (const clause of previous) {
    const key = clauseIdentity(clause);
    const bucket = ids.get(key) ?? [];
    bucket.push(clause.id);
    ids.set(key, bucket);
  }
  return next.map((clause) => {
    const bucket = ids.get(clauseIdentity(clause));
    return { ...clause, id: bucket?.shift() ?? createClauseId() };
  });
}

function resolveQueryFields(context: FilterQueryCodecContext) {
  const fields = new Map(context.fields.map((field) => [field.id, field]));
  const configs = context.queryFields.filter((config) => config.enabled !== false && fields.has(config.fieldId));
  const lookup = new Map<string, FilterQueryFieldConfig>();
  for (const config of configs) {
    for (const name of [config.key ?? config.fieldId, config.fieldId, ...(config.aliases ?? [])]) {
      lookup.set(name.toLocaleLowerCase(), config);
    }
  }
  return { fields, configs, lookup };
}

function parse(input: string, context: FilterQueryCodecContext): FilterQueryParseResult {
  const { fields, lookup } = resolveQueryFields(context);
  const errors: FilterQueryError[] = [];
  const tokens: FilterQueryToken[] = [];
  const clauses: FilterClause[] = [];
  const freeText: string[] = [];
  for (const rawToken of splitTokens(input)) {
    const colon = rawToken.value.indexOf(":");
    if (colon < 0) {
      if (context.freeText) {
        tokens.push({ kind: "text", rawValue: rawToken.value, start: rawToken.start, end: rawToken.end });
        freeText.push(unquote(rawToken.value));
      } else {
        tokens.push({ kind: "incomplete", rawValue: rawToken.value, start: rawToken.start, end: rawToken.end });
      }
      continue;
    }
    const queryKey = rawToken.value.slice(0, colon);
    const rawValue = rawToken.value.slice(colon + 1);
    const config = lookup.get(queryKey.toLocaleLowerCase());
    const valueStart = rawToken.start + colon + 1;
    if (!config) {
      tokens.push({ kind: "invalid", queryKey, rawValue, start: rawToken.start, end: rawToken.end, valueStart, valueEnd: rawToken.end });
      errors.push({ message: `Unknown filter: ${queryKey}.`, start: rawToken.start, end: rawToken.end });
      continue;
    }
    const field = fields.get(config.fieldId)!;
    if (!rawValue) {
      tokens.push({ kind: "incomplete", field: field.id, queryKey, rawValue, start: rawToken.start, end: rawToken.end, valueStart, valueEnd: rawToken.end });
      continue;
    }
    if (hasUnclosedQuote(rawValue)) {
      tokens.push({ kind: "incomplete", field: field.id, queryKey, rawValue, start: rawToken.start, end: rawToken.end, valueStart, valueEnd: rawToken.end });
      continue;
    }
    const valueContext: FilterQueryValueParseContext = { field, queryField: config, locale: context.locale };
    const result = config.parseValue?.(unquote(rawValue), valueContext) ?? defaultParseValue(rawValue, valueContext);
    const validation = result.valid ? validateValue(field, result.operator, result.value) : result;
    if (!result.valid || !validation.valid || !operatorAllowed(field, result.operator)) {
      tokens.push({ kind: "invalid", field: field.id, queryKey, rawValue, start: rawToken.start, end: rawToken.end, valueStart, valueEnd: rawToken.end });
      errors.push({ message: !result.valid ? result.message : !validation.valid ? validation.message : `${result.operator} is not available for ${field.label}.`, start: rawToken.start, end: rawToken.end });
      continue;
    }
    tokens.push({ kind: "filter", field: field.id, queryKey, rawValue, start: rawToken.start, end: rawToken.end, valueStart, valueEnd: rawToken.end });
    clauses.push({ id: "", field: field.id, operator: result.operator, value: result.value, meta: "meta" in result ? result.meta : undefined });
  }
  if (freeText.length && context.freeText) {
    const field = fields.get(context.freeText.fieldId);
    if (!field) {
      errors.push({ message: `Unknown free-text field: ${context.freeText.fieldId}.`, start: 0, end: input.length });
    } else {
      clauses.push({ id: "", field: field.id, operator: defaultOperator(field), value: context.freeText.parse?.(freeText) ?? freeText.join(context.freeText.joinWith ?? " ") });
    }
  }
  const reconciled = reconcileClauses(clauses, context.previousFilters, context.createClauseId);
  return { clauses: reconciled, tokens, errors, representedClauseIds: reconciled.map((clause) => clause.id), complete: errors.length === 0 && tokens.every((token) => token.kind !== "incomplete") };
}

function serialize(filters: readonly FilterClause[], context: FilterQueryCodecContext): FilterQuerySerializeResult {
  const { fields, configs } = resolveQueryFields(context);
  const byField = new Map(configs.map((config) => [config.fieldId, config]));
  const parts: string[] = [];
  const representedClauseIds: string[] = [];
  const unsupportedClauses: FilterClause[] = [];
  for (const clause of filters) {
    const config = byField.get(clause.field);
    const field = fields.get(clause.field);
    if (!config || !field || field.type === "custom") {
      unsupportedClauses.push(clause);
      continue;
    }
    const valueContext: FilterQueryValueParseContext = { field, queryField: config, locale: context.locale };
    let rawValue = config.serializeValue?.(clause, valueContext);
    if (rawValue === undefined) {
      if (clause.operator === "isTrue") rawValue = "true";
      else if (clause.operator === "isFalse") rawValue = "false";
      else if (clause.operator === "isBetween" && Array.isArray(clause.value) && clause.value.length === 2) rawValue = `${clause.value[0]}-${clause.value[1]}`;
      else if (Array.isArray(clause.value)) rawValue = clause.value.map((value) => quote(String(value))).join(",");
      else if (clause.value && typeof clause.value === "object") rawValue = `${clause.value.from ?? ""}..${clause.value.to ?? ""}`;
      else if (clause.value !== undefined) rawValue = quote(String(clause.value));
    }
    if (rawValue === undefined || !operatorAllowed(field, clause.operator)) {
      unsupportedClauses.push(clause);
      continue;
    }
    if (context.freeText && context.freeText.fieldId === clause.field && context.freeText.serialize && clause.value !== undefined) {
      parts.push(context.freeText.serialize(clause.value));
    } else {
      parts.push(`${config.key ?? config.fieldId}:${rawValue}`);
    }
    representedClauseIds.push(clause.id);
  }
  return { query: parts.join(" "), representedClauseIds, unsupportedClauses };
}

function replaceToken(input: string, token: FilterQueryToken | undefined, replacement: string) {
  if (!token) return { text: `${input}${input && !/\s$/.test(input) ? " " : ""}${replacement}`, caret: input.length + (input && !/\s$/.test(input) ? 1 : 0) + replacement.length };
  return { text: `${input.slice(0, token.start)}${replacement}${input.slice(token.end)}`, caret: token.start + replacement.length };
}

export const defaultFilterQueryCodec: FilterQueryCodec = { parse, serialize, replaceToken };
