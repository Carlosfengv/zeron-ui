// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExamplePreview, { ExamplesApp, initialResourceQuery } from "./fixtures/agent-examples/app";
import { ResourceDetailPage } from "./fixtures/agent-examples/resource-detail/page";
import { SettingsPage } from "./fixtures/agent-examples/settings/page";
import { createDeterministicApi } from "./fixtures/agent-examples/shared/deterministic-api";
import { useSingleSubmit } from "./fixtures/agent-examples/shared/use-single-submit";

afterEach(cleanup);
const email = () => screen.getByLabelText("Notification email") as HTMLInputElement;
describe("agent business example interactions", () => {
  it("exposes observation only when requested by the standalone preview, and cleans it up on unmount", async () => {
    const original = window.location.href;
    try {
      window.history.replaceState(null, "", "/?example=settings");
      const ordinary = render(<ExamplePreview />);
      await screen.findByLabelText("Notification email");
      expect(window.__zeronExampleObservations).toBeUndefined(); ordinary.unmount();
      window.history.replaceState(null, "", "/?example=settings&observe=1");
      const observed = render(<ExamplePreview />);
      await screen.findByLabelText("Notification email");
      await waitFor(() => expect(window.__zeronExampleObservations?.()).toEqual([{ operation: "settings", input: null, status: "fulfilled", aborted: false }]));
      observed.unmount(); expect(window.__zeronExampleObservations).toBeUndefined();
    } finally { window.history.replaceState(null, "", original); }
  });
  it("validates before dispatch and preserves settings drafts when saving fails", async () => {
    const service = createDeterministicApi();
    service.enqueue("saveSettings", { outcome: "unavailable" });
    render(<SettingsPage api={service.api} />);
    await screen.findByLabelText("Notification email");
    fireEvent.change(email(), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(service.calls.filter(call => call.operation === "saveSettings")).toHaveLength(0);
    expect(email().getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(email(), { target: { value: "new@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await screen.findByRole("alert");
    expect(email().value).toBe("new@example.com");
    expect(service.calls.filter(call => call.operation === "saveSettings")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await screen.findByText("Settings saved.");
    expect((screen.getByRole("button", { name: "Save settings" }) as HTMLButtonElement).disabled).toBe(true);
    expect((await service.api.settings(new AbortController().signal)).notificationEmail).toBe("new@example.com");
  });
  it("resets a dirty settings draft and prevents edits under read-only access", async () => {
    const service = createDeterministicApi();
    const view = render(<SettingsPage api={service.api} />);
    await screen.findByLabelText("Notification email");
    fireEvent.change(email(), { target: { value: "draft@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(email().value).toBe("ops@example.com");
    view.unmount();
    const readOnly = createDeterministicApi({ editable: false });
    render(<SettingsPage api={readOnly.api} />);
    await screen.findByText("You have read-only access.");
    expect(email().disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Save settings" }) as HTMLButtonElement).disabled).toBe(true);
    expect(readOnly.calls.every(call => call.operation !== "saveSettings")).toBe(true);
  });
  it("removes sensitive settings when access is denied and recovers through retry", async () => {
    const service = createDeterministicApi();
    service.enqueue("settings", { outcome: "forbidden" });
    render(<SettingsPage api={service.api} />);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Notification email")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByLabelText("Notification email");
  });
  it("keeps a failed resource draft, retries with the same revision, and restores the supplied list context", async () => {
    const service = createDeterministicApi();
    service.enqueue("rename", { outcome: "unavailable" });
    const back = vi.fn();
    const context = { ...initialResourceQuery, search: "Resource", pageIndex: 2, direction: "desc" as const };
    render(<ResourceDetailPage api={service.api} id="resource-1" returnQuery={context} onBack={back} />);
    const name = await screen.findByLabelText("Resource name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "New resource name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save resource" }));
    await screen.findByRole("alert");
    expect(name.value).toBe("New resource name");
    fireEvent.click(screen.getByRole("button", { name: "Save resource" }));
    await screen.findByText("Resource saved.");
    expect((await service.api.detail("resource-1", new AbortController().signal)).name).toBe("New resource name");
    fireEvent.click(screen.getByRole("button", { name: "Back to resources" }));
    expect(back).toHaveBeenCalledWith(context);
  });
  it("does not let a cancelled mutation populate a newly selected resource", async () => {
    const service = createDeterministicApi();
    service.enqueue("rename", { delayMs: 80, ignoreAbort: true });
    const view = render(<ResourceDetailPage api={service.api} id="resource-1" returnQuery={initialResourceQuery} onBack={vi.fn()} />);
    const name = await screen.findByLabelText("Resource name");
    fireEvent.change(name, { target: { value: "Late old update" } });
    fireEvent.click(screen.getByRole("button", { name: "Save resource" }));
    await waitFor(() => expect(service.calls.some(call => call.operation === "rename")).toBe(true));
    view.rerender(<ResourceDetailPage api={service.api} id="resource-2" returnQuery={initialResourceQuery} onBack={vi.fn()} />);
    await waitFor(() => expect((screen.getByLabelText("Resource name") as HTMLInputElement).value).toBe("Resource 02"));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)); });
    expect((screen.getByLabelText("Resource name") as HTMLInputElement).value).toBe("Resource 02");
    expect(screen.queryByText("Resource saved.")).toBeNull();
    expect(service.calls.find(call => call.operation === "rename")?.signal.aborted).toBe(true);
  });
  it("represents a missing resource as an error without exposing an editor", async () => {
    render(<ResourceDetailPage api={createDeterministicApi().api} id="missing" returnQuery={initialResourceQuery} onBack={vi.fn()} />);
    await screen.findByRole("alert");
    expect(screen.queryByLabelText("Resource name")).toBeNull();
  });
  it("filters on the server, resets pagination, and preserves the query through detail navigation", async () => {
    const service = createDeterministicApi();
    render(<ExamplesApp api={service.api} initialQuery={{ ...initialResourceQuery, pageIndex: 2 }} />);
    await screen.findByRole("button", { name: "Resource 21" });
    fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "26" } });
    await screen.findByRole("button", { name: "Resource 26" });
    expect(service.calls.filter(call => call.operation === "list").at(-1)?.input).toMatchObject({ search: "26", pageIndex: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Resource 26" }));
    await screen.findByLabelText("Resource name");
    expect(document.activeElement).toBe(screen.getByRole("main", { name: "Example content" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to resources" }));
    await screen.findByRole("button", { name: "Resource 26" });
    expect((screen.getByLabelText("Search resources") as HTMLInputElement).value).toBe("26");
  });
  it("locks duplicate submissions synchronously, before disabled UI can render", async () => {
    let finish!: (value: string) => void;
    const task = vi.fn(() => new Promise<string>(resolve => { finish = resolve; }));
    const saved = vi.fn();
    const { result } = renderHook(() => useSingleSubmit(task, saved));
    let first!: Promise<boolean>;
    await act(async () => { first = result.current.submit("first"); expect(await result.current.submit("second")).toBe(false); });
    expect(task).toHaveBeenCalledTimes(1);
    await act(async () => { finish("saved"); expect(await first).toBe(true); });
    expect(saved).toHaveBeenCalledExactlyOnceWith("saved");
  });
});
