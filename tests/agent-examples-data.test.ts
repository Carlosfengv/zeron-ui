// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createDeterministicApi } from "./fixtures/agent-examples/shared/deterministic-api";
import { useLatestRequest } from "./fixtures/agent-examples/shared/use-latest-request";
import type { ResourceQuery } from "./fixtures/agent-examples/shared/contracts";

const query: ResourceQuery = { search: "", status: "all", sort: "name", direction: "asc", pageIndex: 0, pageSize: 10 };
const signal = () => new AbortController().signal;
describe("business example service boundaries", () => {
  it("reports actual operation completion and returns independent read-only observation snapshots", async () => {
    const fixture = createDeterministicApi();
    fixture.enqueue("list", { delayMs: 40, ignoreAbort: true });
    const controller = new AbortController();
    const pending = fixture.api.list(query, controller.signal);
    expect(fixture.snapshot()).toEqual([{ operation: "list", input: query, status: "pending", aborted: false }]);
    const snapshot = fixture.snapshot();
    (snapshot[0].input as ResourceQuery).search = "tampered";
    snapshot[0].status = "rejected";
    expect(fixture.snapshot()[0]).toMatchObject({ input: query, status: "pending" });
    controller.abort(); await pending;
    expect(fixture.snapshot()[0]).toMatchObject({ status: "fulfilled", aborted: true });
    fixture.enqueue("saveSettings", { outcome: "unavailable" });
    await expect(fixture.api.saveSettings({ notificationEmail: "new@example.com", retentionDays: 5 }, 1, signal())).rejects.toMatchObject({ code: "unavailable" });
    expect(fixture.snapshot()[1]).toMatchObject({ operation: "saveSettings", status: "rejected", aborted: false });
  });
  it("filters and sorts the whole inventory before pagination and reports authoritative totals", async () => {
    const { api } = createDeterministicApi();
    const page = await api.list({ ...query, status: "active", direction: "desc", pageIndex: 1, pageSize: 5 }, signal());
    expect(page.total).toBe(18);
    expect(page.items.map(item => item.id)).toEqual(["resource-20", "resource-18", "resource-17", "resource-15", "resource-14"]);
    expect((await api.list({ ...query, search: "26" }, signal())).items.map(item => item.id)).toEqual(["resource-26"]);
  });
  it("keeps deterministic empty, service-error, forbidden and not-found outcomes distinct", async () => {
    const fixture = createDeterministicApi();
    fixture.enqueue("list", { outcome: "empty" });
    expect(await fixture.api.list(query, signal())).toEqual({ items: [], total: 0 });
    fixture.enqueue("detail", { outcome: "forbidden" });
    await expect(fixture.api.detail("resource-1", signal())).rejects.toMatchObject({ code: "forbidden" });
    await expect(fixture.api.detail("missing", signal())).rejects.toMatchObject({ code: "not-found" });
    fixture.enqueue("settings", { outcome: "unavailable" });
    await expect(fixture.api.settings(signal())).rejects.toMatchObject({ code: "unavailable" });
  });
  it("maps validation, preserves persisted values on failure and detects stale mutation revisions", async () => {
    const { api } = createDeterministicApi();
    const original = await api.settings(signal());
    await expect(api.saveSettings({ notificationEmail: "invalid", retentionDays: 0 }, original.revision, signal())).rejects.toMatchObject({ code: "validation", fields: { notificationEmail: expect.any(String), retentionDays: expect.any(String) } });
    expect(await api.settings(signal())).toEqual(original);
    const saved = await api.saveSettings({ notificationEmail: "new@example.com", retentionDays: 60 }, original.revision, signal());
    expect(saved.revision).toBe(original.revision + 1);
    await expect(api.saveSettings(original, original.revision, signal())).rejects.toMatchObject({ code: "conflict" });
    const resource = await api.rename("resource-1", "Renamed", 1, signal());
    expect(resource.name).toBe("Renamed");
    await expect(api.rename("resource-1", "Second", 1, signal())).rejects.toMatchObject({ code: "conflict" });
  });
  it("cancels a pending adapter operation", async () => {
    const fixture = createDeterministicApi();
    fixture.enqueue("list", { delayMs: 5000 });
    const controller = new AbortController();
    const pending = fixture.api.list(query, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
  it("ignores old responses even when the service ignores abort, and clears data on identity changes", async () => {
    const fixture = createDeterministicApi();
    fixture.enqueue("detail", { delayMs: 80, ignoreAbort: true });
    const loadA = (requestSignal: AbortSignal) => fixture.api.detail("resource-1", requestSignal);
    const loadB = (requestSignal: AbortSignal) => fixture.api.detail("resource-2", requestSignal);
    const { result, rerender } = renderHook(({ key, load }) => useLatestRequest(key, load), { initialProps: { key: "resource-1", load: loadA } });
    await waitFor(() => expect(fixture.calls).toHaveLength(1));
    rerender({ key: "resource-2", load: loadB });
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.data?.id).toBe("resource-2"));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    expect(result.current.data?.id).toBe("resource-2");
    expect(fixture.calls[0].signal.aborted).toBe(true);
  });
  it("retains same-query rows on refresh failure and allows retry", async () => {
    const fixture = createDeterministicApi();
    const load = (requestSignal: AbortSignal) => fixture.api.list(query, requestSignal);
    const { result } = renderHook(() => useLatestRequest("list", load));
    await waitFor(() => expect(result.current.data?.total).toBe(27));
    fixture.enqueue("list", { outcome: "unavailable" });
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).toMatchObject({ code: "unavailable" }));
    expect(result.current.data?.total).toBe(27);
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
