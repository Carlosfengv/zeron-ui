import type {
  InfiniteLogBaseRecord,
  InfiniteLogField,
  InfiniteLogFieldFilterType,
  InfiniteLogFieldType,
} from "./infinite-log-types";

const sampleLimit = 100;
const facetLimit = 24;

export function humanizeInfiniteLogField(id: string) {
  return id
    .replace(/\[(\d+)\]/g, " $1 ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getInfiniteLogFieldValue<TRecord extends InfiniteLogBaseRecord>(
  record: TRecord,
  field: Pick<InfiniteLogField<TRecord>, "id" | "accessor"> | string,
) {
  if (typeof field !== "string" && field.accessor) return field.accessor(record);
  const id = typeof field === "string" ? field : field.id;
  return id.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, record);
}

function inferType(id: string, values: readonly unknown[]): InfiniteLogFieldType {
  if (id === "timestamp" || values.some((value) => value instanceof Date)) return "datetime";
  const value = values.find((candidate) => candidate !== null && candidate !== undefined);
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "object") return "json";
  return "text";
}

function inferFilter(type: InfiniteLogFieldType, values: readonly unknown[]): InfiniteLogFieldFilterType {
  if (type === "number") return "numberRange";
  if (type === "boolean") return "multiSelect";
  if (type === "datetime" || type === "json") return "none";
  const comparableValues = values.filter(
    (value): value is string | number | boolean =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean",
  );
  const uniqueCount = new Set(comparableValues.map(String)).size;
  return uniqueCount > 0 && uniqueCount <= facetLimit ? "multiSelect" : "text";
}

export function inferInfiniteLogFields<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
): InfiniteLogField<TRecord>[] {
  const samples = records.slice(0, sampleLimit);
  const ids = new Set<string>(["timestamp"]);
  for (const record of samples) {
    for (const id of Object.keys(record)) ids.add(id);
  }
  ids.delete("id");
  ids.delete("timestamp");

  const orderedIds = ["timestamp", ...ids, "id"];
  return orderedIds.map((id) => {
    const values = samples.map((record) => getInfiniteLogFieldValue(record, id));
    const type = inferType(id, values);
    return {
      id,
      label: humanizeInfiniteLogField(id),
      type,
      filter: id === "id" ? "text" : inferFilter(type, values),
      sortable: type !== "json",
      hidden: id === "id",
      width: type === "json" ? 240 : id === "timestamp" ? 176 : type === "number" ? 120 : 180,
      minWidth: id === "timestamp" ? 144 : 88,
    } satisfies InfiniteLogField<TRecord>;
  });
}

export function resolveInfiniteLogFields<TRecord extends InfiniteLogBaseRecord>(
  records: readonly TRecord[],
  fields?: readonly InfiniteLogField<TRecord>[],
) {
  return (fields ?? inferInfiniteLogFields(records)).map((field) => ({
    ...field,
    label: field.label ?? humanizeInfiniteLogField(field.id),
    type: field.type ?? "text",
    filter: field.filter ?? (field.type === "number" ? "numberRange" : "text"),
    sortable: field.sortable ?? field.type !== "json",
    hidden: field.hidden ?? false,
    width: field.width ?? (field.type === "number" ? 120 : 180),
    minWidth: field.minWidth ?? 88,
  }));
}

export function isHttpInfiniteLogRecord(record: InfiniteLogBaseRecord | undefined): boolean {
  if (!record) return false;
  return (
    typeof record.status === "number" &&
    typeof record.method === "string" &&
    typeof record.host === "string" &&
    typeof record.pathname === "string" &&
    typeof record.latency === "number" &&
    typeof record.region === "string" &&
    Boolean(record.timing && typeof record.timing === "object") &&
    Boolean(record.headers && typeof record.headers === "object")
  );
}
