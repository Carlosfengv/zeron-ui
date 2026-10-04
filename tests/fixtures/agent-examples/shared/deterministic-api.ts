import { ExampleApiError, validateSettings, type ExampleApi, type ResourceDetail, type ResourceQuery, type Settings } from "./contracts";

type Operation = keyof ExampleApi;
export type ResponsePlan = { delayMs?: number; outcome?: "success" | "empty" | "forbidden" | "unavailable"; ignoreAbort?: boolean };
type RecordedCall = { operation: Operation; input: unknown; signal: AbortSignal; status: "pending" | "fulfilled" | "rejected" };
const initialResources: ResourceDetail[] = Array.from({ length: 27 }, (_, index) => ({
  id: `resource-${index + 1}`, name: `Resource ${String(index + 1).padStart(2, "0")}`,
  status: index % 3 === 0 ? "paused" : "active", updatedAt: new Date(Date.UTC(2026, 9, 1, 0, index)).toISOString(),
  revision: 1, canEdit: true, description: `Service configuration for resource ${index + 1}.`, owner: "Platform team",
}));

/** A controllable test adapter, never represented as a deployed backend. */
export function createDeterministicApi({ editable = true }: { editable?: boolean } = {}) {
  const resources = structuredClone(initialResources).map(resource => ({ ...resource, canEdit: editable }));
  let settings: Settings = { notificationEmail: "ops@example.com", retentionDays: 30, revision: 1, canEdit: editable };
  const plans = new Map<Operation, ResponsePlan[]>();
  const calls: RecordedCall[] = [];
  async function before(operation: Operation, input: unknown, signal: AbortSignal) {
    const plan = plans.get(operation)?.shift() ?? {};
    if (!plan.ignoreAbort) signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(signal.reason); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, plan.delayMs ?? 0);
      if (!plan.ignoreAbort) signal.addEventListener("abort", abort, { once: true });
    });
    if (!plan.ignoreAbort) signal.throwIfAborted();
    if (plan.outcome === "forbidden") throw new ExampleApiError("forbidden", "You do not have access to this operation.");
    if (plan.outcome === "unavailable") throw new ExampleApiError("unavailable", "The service is unavailable. Retry this request.");
    return plan;
  }
  const api: ExampleApi = {
    async list(query: ResourceQuery, signal) {
      const plan = await before("list", query, signal);
      if (!Number.isSafeInteger(query.pageIndex) || query.pageIndex < 0 || !Number.isSafeInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100) throw new ExampleApiError("validation", "Invalid pagination.");
      if (plan.outcome === "empty") return { items: [], total: 0 };
      const matches = resources.filter(resource => resource.name.toLowerCase().includes(query.search.trim().toLowerCase()) && (query.status === "all" || resource.status === query.status))
        .sort((a, b) => (a[query.sort].localeCompare(b[query.sort], "en") || a.id.localeCompare(b.id, "en")) * (query.direction === "asc" ? 1 : -1));
      return { items: structuredClone(matches.slice(query.pageIndex * query.pageSize, (query.pageIndex + 1) * query.pageSize)), total: matches.length };
    },
    async detail(id, signal) {
      await before("detail", id, signal);
      const resource = resources.find(item => item.id === id);
      if (!resource) throw new ExampleApiError("not-found", "This resource no longer exists.");
      return structuredClone(resource);
    },
    async rename(id, name, expectedRevision, signal) {
      await before("rename", { id, name, expectedRevision }, signal);
      const resource = resources.find(item => item.id === id);
      if (!resource) throw new ExampleApiError("not-found", "This resource no longer exists.");
      if (!resource.canEdit) throw new ExampleApiError("forbidden", "You cannot edit this resource.");
      if (resource.revision !== expectedRevision) throw new ExampleApiError("conflict", "This resource changed. Reload before editing.");
      if (!name.trim() || name.trim().length > 80) throw new ExampleApiError("validation", "Check the resource name.", { name: "Use a name from 1 to 80 characters." });
      resource.name = name.trim(); resource.revision += 1;
      return structuredClone(resource);
    },
    async settings(signal) {
      await before("settings", null, signal);
      return structuredClone(settings);
    },
    async saveSettings(input, expectedRevision, signal) {
      await before("saveSettings", { input, expectedRevision }, signal);
      if (!settings.canEdit) throw new ExampleApiError("forbidden", "You cannot edit settings.");
      if (settings.revision !== expectedRevision) throw new ExampleApiError("conflict", "Settings changed. Reload before saving.");
      const fields = validateSettings(input);
      if (Object.keys(fields).length) throw new ExampleApiError("validation", "Check the settings fields.", fields);
      settings = { notificationEmail: input.notificationEmail, retentionDays: input.retentionDays, revision: settings.revision + 1, canEdit: settings.canEdit };
      return structuredClone(settings);
    },
  };
  async function track<T>(operation: Operation, input: unknown, signal: AbortSignal, action: () => Promise<T>): Promise<T> {
    const call: RecordedCall = { operation, input: structuredClone(input), signal, status: "pending" };
    calls.push(call);
    try { const result = await action(); call.status = "fulfilled"; return result; }
    catch (error) { call.status = "rejected"; throw error; }
  }
  const observed: ExampleApi = {
    list: (query, signal) => track("list", query, signal, () => api.list(query, signal)),
    detail: (id, signal) => track("detail", id, signal, () => api.detail(id, signal)),
    rename: (id, name, expectedRevision, signal) => track("rename", { id, name, expectedRevision }, signal, () => api.rename(id, name, expectedRevision, signal)),
    settings: signal => track("settings", null, signal, () => api.settings(signal)),
    saveSettings: (input, expectedRevision, signal) => track("saveSettings", { input, expectedRevision }, signal, () => api.saveSettings(input, expectedRevision, signal)),
  };
  return { api: observed, calls,
    // Observation never exposes the service, mutable records, response plans or an API override.
    snapshot: () => calls.map(({ operation, input, signal, status }) => ({ operation, input: structuredClone(input), status, aborted: signal.aborted })),
    enqueue(operation: Operation, plan: ResponsePlan) {
    if (plan.outcome === "empty" && operation !== "list") throw new Error("Only inventory reads have an empty collection state");
    if (plan.delayMs !== undefined && (!Number.isSafeInteger(plan.delayMs) || plan.delayMs < 0 || plan.delayMs > 10000)) throw new Error("Invalid response delay");
    const queue = plans.get(operation) ?? []; queue.push(plan); plans.set(operation, queue);
  } };
}
