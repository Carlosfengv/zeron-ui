"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "#components/button";
import { ResourceListPage } from "./resource-list/page";
import { ResourceDetailPage } from "./resource-detail/page";
import { SettingsPage } from "./settings/page";
import { createDeterministicApi } from "./shared/deterministic-api";
import type { ExampleApi, ResourceQuery } from "./shared/contracts";

declare global {
  interface Window { __zeronExampleObservations?: () => ReturnType<ReturnType<typeof createDeterministicApi>["snapshot"]> }
}

export const initialResourceQuery: ResourceQuery = { search: "", status: "all", sort: "name", direction: "asc", pageIndex: 0, pageSize: 10 };
type Route = { page: "list" } | { page: "detail"; id: string } | { page: "settings" };

/** Host-owned navigation demonstrates callbacks; consumers may replace it with their real router. */
export function ExamplesApp({ api, initialQuery = initialResourceQuery, initialPage = "list", initialResourceId = "resource-1" }: { api: ExampleApi; initialQuery?: ResourceQuery; initialPage?: "list" | "detail" | "settings"; initialResourceId?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [route, setRoute] = useState<Route>(initialPage === "detail" ? { page: "detail", id: initialResourceId } : { page: initialPage });
  const content = useRef<HTMLElement>(null);
  useEffect(() => { content.current?.focus(); }, [route]);
  const open = useCallback((id: string, context: ResourceQuery) => { setQuery(context); setRoute({ page: "detail", id }); }, []);
  const back = useCallback((context: ResourceQuery) => { setQuery(context); setRoute({ page: "list" }); }, []);
  return <div className="flex h-dvh min-h-0 min-w-0 flex-col bg-surface-floating text-fg-default">
    <nav className="flex shrink-0 flex-wrap gap-2 border-b border-border p-3" aria-label="Example navigation"><Button variant="ghost" active={route.page !== "settings"} onClick={() => setRoute({ page: "list" })}>Resources</Button><Button variant="ghost" active={route.page === "settings"} onClick={() => setRoute({ page: "settings" })}>Settings</Button></nav>
    <main ref={content} tabIndex={-1} aria-label="Example content" className="flex min-h-0 min-w-0 flex-1 flex-col">{route.page === "list" ? <ResourceListPage api={api} query={query} onQueryChange={setQuery} onOpenResource={open} /> : route.page === "detail" ? <ResourceDetailPage api={api} id={route.id} returnQuery={query} onBack={back} /> : <SettingsPage api={api} />}</main>
  </div>;
}

/** Standalone example adapter. Production hosts inject ExampleApi into ExamplesApp. */
export default function ExamplePreview() {
  const [preview, setPreview] = useState<{ api: ExampleApi; page: "list" | "detail" | "settings"; id: string } | null>(null);
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const name = parameters.get("example");
    const page = name === "detail" || name === "settings" ? name : "list";
    const scenario = parameters.get("scenario") ?? "success";
    const service = createDeterministicApi({ editable: scenario !== "readonly" });
    const observe = service.snapshot;
    if (parameters.get("observe") === "1") window.__zeronExampleObservations = observe;
    const operation = page === "list" ? "list" : page === "detail" ? "detail" : "settings";
    if (scenario === "error" || scenario === "forbidden") service.enqueue(operation, { outcome: scenario === "error" ? "unavailable" : "forbidden" });
    if (scenario === "empty" && page === "list") service.enqueue("list", { outcome: "empty" });
    if (scenario === "slow" || scenario === "race") service.enqueue(operation, { delayMs: 2000, ignoreAbort: scenario === "race" });
    if (scenario === "save-error" || scenario === "save-forbidden" || scenario === "saving") service.enqueue(page === "detail" ? "rename" : "saveSettings", {
      outcome: scenario === "save-error" ? "unavailable" : scenario === "save-forbidden" ? "forbidden" : "success", delayMs: scenario === "saving" ? 2000 : 0,
    });
    setPreview({ api: service.api, page, id: scenario === "missing" ? "missing-resource" : "resource-1" });
    return () => { if (window.__zeronExampleObservations === observe) delete window.__zeronExampleObservations; };
  }, []);
  return preview ? <ExamplesApp api={preview.api} initialPage={preview.page} initialResourceId={preview.id} /> : <p role="status">Starting example</p>;
}
