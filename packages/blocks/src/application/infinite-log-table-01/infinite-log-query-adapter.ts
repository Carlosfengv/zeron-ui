import type {
  FilterClause,
  FilterField,
} from "@zeron/ui/system/filter-core";
import type {
  FilterQueryFieldConfig,
  FilterQueryFreeTextConfig,
} from "@zeron/ui/filter-query-input";
import type {
  InfiniteLogFilters,
  InfiniteLogMetadata,
  LogMethod,
  HttpLogOutcome,
} from "./infinite-log-types";
import {
  formatInfiniteLogDateTime,
  parseInfiniteLogDateTime,
} from "./infinite-log-time-range";
import { infiniteLogFieldIcons } from "./infinite-log-field-icons";

function textClause(id: string, field: string, value: string): FilterClause | undefined {
  return value ? { id, field, operator: "contains", value } : undefined;
}

function manyClause(id: string, field: string, value: readonly string[] | readonly number[]): FilterClause | undefined {
  return value.length ? { id, field, operator: "isAnyOf", value: [...value].map(String) } : undefined;
}

function createFacetSuggestionLoader(facet?: InfiniteLogMetadata["facets"]["hosts"]) {
  return async ({ query }: Parameters<NonNullable<FilterQueryFieldConfig["loadSuggestions"]>>[0]) => {
    const search = query.trim().toLocaleLowerCase();
    const matches = (facet?.values ?? []).filter((entry) => !search || entry.value.toLocaleLowerCase().includes(search));
    return {
      options: matches.map((entry) => ({ value: entry.value, label: entry.value, textValue: entry.value })),
      counts: new Map(matches.map((entry) => [entry.value, entry.count])),
    };
  };
}

export function createInfiniteLogQueryFields(timeZone = "UTC", metadata?: InfiniteLogMetadata): readonly FilterQueryFieldConfig[] {
  return [
    { fieldId: "query", suggest: false },
    { fieldId: "host", loadSuggestions: createFacetSuggestionLoader(metadata?.facets.hosts) },
    { fieldId: "pathname", key: "path", aliases: ["pathname"], loadSuggestions: createFacetSuggestionLoader(metadata?.facets.pathnames) },
    { fieldId: "status", aliases: ["code"] },
    { fieldId: "method" },
    { fieldId: "region" },
    { fieldId: "outcome" },
    { fieldId: "latency" },
    {
      fieldId: "timeRange",
      key: "time",
      aliases: ["timestamp"],
      parseValue: (rawValue) => {
        const [fromValue, toValue, extra] = rawValue.split("..");
        const from = fromValue ? parseInfiniteLogDateTime(fromValue, timeZone) : undefined;
        const to = toValue ? parseInfiniteLogDateTime(toValue, timeZone) : undefined;
        if (extra !== undefined || !from || !to || Date.parse(from) > Date.parse(to)) {
          return { valid: false, message: "Enter a valid time range." };
        }
        return { valid: true, operator: "isBetween", value: { from, to } };
      },
      serializeValue: (clause) => {
        const range = clause.value && typeof clause.value === "object" && !Array.isArray(clause.value)
          ? clause.value
          : undefined;
        if (typeof range?.from !== "string" || typeof range.to !== "string") return undefined;
        return `"${formatInfiniteLogDateTime(range.from, timeZone)}..${formatInfiniteLogDateTime(range.to, timeZone)}"`;
      },
    },
    { fieldId: "timing.dns", key: "dns" },
    { fieldId: "timing.connection", key: "connection" },
    { fieldId: "timing.tls", key: "tls" },
    { fieldId: "timing.ttfb", key: "ttfb" },
    { fieldId: "timing.transfer", key: "transfer" },
  ];
}

export const infiniteLogQueryFields = createInfiniteLogQueryFields();

export const infiniteLogFreeText: FilterQueryFreeTextConfig = {
  fieldId: "query",
  serialize: (value) => String(value),
};

export function createInfiniteLogFilterFields(metadata?: InfiniteLogMetadata): readonly FilterField[] {
  return [
    { id: "query", type: "text", label: "Search logs", icon: infiniteLogFieldIcons.query },
    { id: "host", type: "text", label: "Host", description: "Request hostname", icon: infiniteLogFieldIcons.host },
    { id: "pathname", type: "text", label: "Path", description: "Request pathname", icon: infiniteLogFieldIcons.pathname },
    {
      id: "status",
      type: "multiSelect",
      label: "Status",
      icon: infiniteLogFieldIcons.status,
      options: metadata?.facets.statuses.values.map((facet) => ({ value: String(facet.value), label: String(facet.value), textValue: String(facet.value), metadata: { count: facet.count } })),
    },
    {
      id: "method",
      type: "multiSelect",
      label: "Method",
      icon: infiniteLogFieldIcons.method,
      options: metadata?.facets.methods.values.map((facet) => ({ value: facet.value, label: facet.value, textValue: facet.value, metadata: { count: facet.count } })),
    },
    {
      id: "region",
      type: "multiSelect",
      label: "Region",
      icon: infiniteLogFieldIcons.region,
      options: metadata?.facets.regions.values.map((facet) => ({ value: facet.value, label: facet.value, textValue: facet.value, metadata: { count: facet.count } })),
    },
    {
      id: "outcome",
      type: "multiSelect",
      label: "Outcome",
      icon: infiniteLogFieldIcons.outcome,
      options: metadata?.facets.outcomes.values.map((facet) => ({ value: facet.value, label: facet.value, textValue: facet.value, metadata: { count: facet.count } })),
    },
    { id: "latency", type: "number", label: "Latency", icon: infiniteLogFieldIcons.latency, min: metadata?.facets.latency.min, max: metadata?.facets.latency.max },
    { id: "timeRange", type: "dateRange", label: "Time range", icon: infiniteLogFieldIcons.timeRange },
    { id: "timing.dns", type: "number", label: "DNS", icon: infiniteLogFieldIcons["timing.dns"], min: metadata?.facets.timing.dns.min, max: metadata?.facets.timing.dns.max },
    { id: "timing.connection", type: "number", label: "Connection", icon: infiniteLogFieldIcons["timing.connection"], min: metadata?.facets.timing.connection.min, max: metadata?.facets.timing.connection.max },
    { id: "timing.tls", type: "number", label: "TLS", icon: infiniteLogFieldIcons["timing.tls"], min: metadata?.facets.timing.tls.min, max: metadata?.facets.timing.tls.max },
    { id: "timing.ttfb", type: "number", label: "TTFB", icon: infiniteLogFieldIcons["timing.ttfb"], min: metadata?.facets.timing.ttfb.min, max: metadata?.facets.timing.ttfb.max },
    { id: "timing.transfer", type: "number", label: "Transfer", icon: infiniteLogFieldIcons["timing.transfer"], min: metadata?.facets.timing.transfer.min, max: metadata?.facets.timing.transfer.max },
  ];
}

export function fromInfiniteLogFilters(filters: InfiniteLogFilters): FilterClause[] {
  const clauses = [
    textClause("query", "query", filters.query),
    textClause("host", "host", filters.host),
    textClause("pathname", "pathname", filters.pathname),
    manyClause("status", "status", filters.statuses),
    manyClause("method", "method", filters.methods),
    manyClause("region", "region", filters.regions),
    manyClause("outcome", "outcome", filters.outcomes),
  ].filter((clause): clause is FilterClause => Boolean(clause));
  if (filters.latency?.min !== undefined && filters.latency.max !== undefined) {
    clauses.push({ id: "latency", field: "latency", operator: "isBetween", value: [filters.latency.min, filters.latency.max] });
  }
  if (filters.timeRange) clauses.push({ id: "timeRange", field: "timeRange", operator: "isBetween", value: { ...filters.timeRange } });
  for (const [key, range] of Object.entries(filters.timing ?? {})) {
    if (range?.min !== undefined && range.max !== undefined) {
      clauses.push({ id: `timing.${key}`, field: `timing.${key}`, operator: "isBetween", value: [range.min, range.max] });
    }
  }
  return clauses;
}

export function toInfiniteLogFilters(clauses: readonly FilterClause[], previous: InfiniteLogFilters): InfiniteLogFilters {
  const next: InfiniteLogFilters = {
    ...previous,
    query: "",
    host: "",
    pathname: "",
    statuses: [],
    methods: [],
    regions: [],
    outcomes: [],
    latency: undefined,
    timeRange: undefined,
    timing: undefined,
  };
  for (const clause of clauses) {
    switch (clause.field) {
      case "query": next.query = String(clause.value ?? ""); break;
      case "host": next.host = String(clause.value ?? ""); break;
      case "pathname": next.pathname = String(clause.value ?? ""); break;
      case "status": next.statuses = (Array.isArray(clause.value) ? clause.value : [clause.value]).map(Number).filter(Number.isFinite); break;
      case "method": next.methods = (Array.isArray(clause.value) ? clause.value : [clause.value]).map(String).filter((value): value is LogMethod => ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"].includes(value)); break;
      case "region": next.regions = (Array.isArray(clause.value) ? clause.value : [clause.value]).map(String); break;
      case "outcome": next.outcomes = (Array.isArray(clause.value) ? clause.value : [clause.value]).map(String).filter((value): value is HttpLogOutcome => ["success", "warning", "error"].includes(value)); break;
      case "latency": {
        if (Array.isArray(clause.value) && clause.value.length === 2 && clause.value.every((value) => typeof value === "number")) {
          next.latency = { min: clause.value[0] as number, max: clause.value[1] as number };
        }
        break;
      }
      case "timeRange": {
        if (clause.value && typeof clause.value === "object" && !Array.isArray(clause.value) && typeof clause.value.from === "string" && typeof clause.value.to === "string") {
          next.timeRange = { from: clause.value.from, to: clause.value.to };
        }
        break;
      }
      default: {
        if (!clause.field.startsWith("timing.")) break;
        const key = clause.field.slice("timing.".length) as keyof NonNullable<InfiniteLogFilters["timing"]>;
        if (["dns", "connection", "tls", "ttfb", "transfer"].includes(key) && Array.isArray(clause.value) && clause.value.length === 2 && clause.value.every((value) => typeof value === "number")) {
          next.timing = { ...(next.timing ?? {}), [key]: { min: clause.value[0] as number, max: clause.value[1] as number } };
        }
      }
    }
  }
  return next;
}
