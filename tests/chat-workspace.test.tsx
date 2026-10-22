// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactCard, ArtifactPanel, ChatWorkspace, getPendingReviewResources, type ArtifactResource } from "@zeron/blocks/chat-workspace-01";
import { artifactSizeText, safeArtifactUrl } from "../packages/blocks/src/application/chat-workspace-01/artifact-utils";
import { visibleArtifactIds } from "../packages/blocks/src/application/chat-workspace-01/artifact-tabs";

vi.mock("../packages/ui/src/components/artifact-panel/code-preview", () => ({
  ArtifactCodePreview: ({ resource, view }: { resource: { content: string }; view: string }) => {
    if (resource.content === "broken diff" && view === "diff") throw new Error("Diff renderer failed");
    return <div data-testid="code-preview" data-view={view}>{resource.content}</div>;
  },
}));
class TestResizeObserver { observe(_node: HTMLElement) {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const code: ArtifactResource = { id: "code", version: "1", name: "theme.ts", kind: "code", content: "new content", previousContent: "old content", review: "pending" };
const markdown: ArtifactResource = { id: "doc", version: "1", name: "README.md", kind: "markdown", content: "# Guide", previousContent: "", review: "pending" };
const web: ArtifactResource = { id: "web", version: "1", name: "Website", kind: "url", url: "https://example.com" };

async function batchReview(label: "Accept all" | "Reject all") {
  fireEvent.click(screen.getByRole("button", { name: "Batch review actions" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: label }));
}

async function tabAction(label: string) {
  fireEvent.click(screen.getByRole("button", { name: "More open content" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: label }));
}

it("finds only ready reviewable pending revisions in resource order", () => {
  expect(getPendingReviewResources([
    { ...code, review: "accepted" }, { ...code, status: "loading" }, { ...code, status: "error" },
    { ...code, previousContent: undefined }, web, markdown, code,
  ])).toEqual([markdown, code]);
});

it("formats explicit file sizes and counts text as UTF-8 bytes", () => {
  expect(artifactSizeText({ ...code, content: "你好" })).toBe("6 B");
  expect(artifactSizeText({ ...code, size: 2048 })).toBe("2 KB");
  expect(artifactSizeText({ ...code, size: 0 })).toBe("0 B");
  expect(artifactSizeText({ ...code, size: NaN, content: "你好" })).toBe("6 B");
  expect(artifactSizeText({ ...web, size: -1 })).toBeUndefined();
});

describe("ArtifactPanel", () => {
  it("works without a chat provider and only loads visited previews", async () => {
    const { container } = render(<ArtifactPanel resources={[code, web]} />);
    await screen.findByText("new content");
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Website" }));
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(web.url);
    expect(container.querySelector("iframe")?.getAttribute("sandbox")).not.toContain("allow-same-origin");
    fireEvent.click(screen.getByRole("tab", { name: "theme.ts" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.getByTestId("code-preview").getAttribute("data-view")).toBe("diff");
  });

  it("preserves per-resource view state and resets it when the version changes", async () => {
    const { rerender } = render(<ArtifactPanel resources={[code, markdown]} />);
    await screen.findByText("new content");
    fireEvent.click(screen.getByRole("tab", { name: "Source" }));
    fireEvent.click(screen.getByRole("tab", { name: "README.md" }));
    await screen.findByText("# Guide");
    fireEvent.click(screen.getByRole("tab", { name: "theme.ts" }));
    expect(screen.getAllByTestId("code-preview")[0].getAttribute("data-view")).toBe("source");
    rerender(<ArtifactPanel resources={[{ ...code, version: "2" }, markdown]} />);
    await waitFor(() => expect(screen.getAllByTestId("code-preview")[0].getAttribute("data-view")).toBe("diff"));
  });

  it("keeps controlled selection until the host commits it", async () => {
    const change = vi.fn();
    const { container } = render(<ArtifactPanel resources={[code, web]} activeId="code" onActiveIdChange={change} />);
    fireEvent.click(screen.getByRole("tab", { name: "Website" }));
    expect(change).toHaveBeenCalledWith("web");
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("keeps the fallback selected when an externally removed resource returns", () => {
    const { rerender } = render(<ArtifactPanel resources={[web, code]} defaultActiveId="code" />);
    rerender(<ArtifactPanel resources={[web]} />);
    expect(screen.getByRole("tab", { name: "Website" }).getAttribute("aria-selected")).toBe("true");
    rerender(<ArtifactPanel resources={[web, code]} />);
    expect(screen.getByRole("tab", { name: "Website" }).getAttribute("aria-selected")).toBe("true");
  });

  it("releases closed preview history and only mounts it again when selected", () => {
    const second = { ...web, id: "second", name: "Second" };
    const { container, rerender } = render(<ArtifactPanel resources={[web, second]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(2);
    rerender(<ArtifactPanel resources={[second]} />);
    rerender(<ArtifactPanel resources={[second, web]} />);
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    fireEvent.click(screen.getByRole("tab", { name: "Website" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(2);
  });

  it("recovers from a failed diff when switching to the source view", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ArtifactPanel resources={[{ ...code, content: "broken diff" }]} />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("tab", { name: "Source" }));
    expect(await screen.findByText("broken diff")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("closes an active tab, selects its neighbor and renders the empty state after the last close", async () => {
    function Example() {
      const [resources, setResources] = useState([web, { ...web, id: "second", name: "Second" }]);
      return <ArtifactPanel resources={resources} onClose={(resource) => setResources((current) => current.filter((item) => item.id !== resource.id))} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Close Website" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Second" }).getAttribute("aria-selected")).toBe("true"));
    fireEvent.keyDown(screen.getByRole("tab", { name: "Second" }), { key: "Delete" });
    expect(screen.getByText("Open something to take a closer look")).toBeTruthy();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("closes an inactive tab without switching the preview, and keeps the add action in the empty panel", async () => {
    const add = vi.fn();
    function Example() {
      const [resources, setResources] = useState([web, { ...web, id: "second", name: "Second" }]);
      return <ArtifactPanel resources={resources} addAction={<button onClick={add}>Open resource</button>} onClose={(resource) => setResources((current) => current.filter((item) => item.id !== resource.id))} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Close Second" }));
    expect(screen.getByRole("tab", { name: "Website" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Close Website" }));
    fireEvent.click(screen.getByRole("button", { name: "Open resource" }));
    expect(add).toHaveBeenCalledTimes(1);
  });

  it("sends a resource reference without sending a chat message and reports failure", async () => {
    const reference = vi.fn().mockRejectedValue(new Error("offline"));
    render(<ArtifactPanel resources={[web]} onReference={reference} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to conversation" }));
    await screen.findByText("Could not add this reference. Try again.");
    expect(reference).toHaveBeenCalledExactlyOnceWith(web);
  });

  it("blocks duplicate reviews, preserves partial failure and retries only pending resources", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const calls = vi.fn();
    function Example() {
      const [resources, setResources] = useState<ArtifactResource[]>([code, markdown]);
      return <ArtifactPanel resources={resources} onReview={async (resource, decision) => {
        calls(resource.id, resource.version, decision);
        await gate;
        if (resource.id === "doc") throw new Error("conflict");
        setResources((current) => current.map((item) => item.id === resource.id ? { ...code, review: "accepted" } : item));
      }} />;
    }
    render(<Example />);
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
    await batchReview("Accept all");
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(2));
    release?.();
    await screen.findByText(/Some changes could not be reviewed. Retry the remaining changes/);
    expect(screen.getByText("1 change to review")).toBeTruthy();
    await batchReview("Accept all");
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(3));
    expect(calls.mock.calls[2][0]).toBe("doc");
  });

  it("passes the exact revision to review and never invents an accepted status", async () => {
    const review = vi.fn().mockResolvedValue(undefined);
    render(<ArtifactPanel resources={[{ ...code, version: "revision-2" }]} onReview={review} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(review).toHaveBeenCalledTimes(1));
    expect(review.mock.calls[0][0].version).toBe("revision-2");
    expect(screen.queryByText("Accepted")).toBeNull();
  });

  it("shows loading, failure, retry and unsupported-file states", () => {
    const retry = vi.fn();
    const { rerender } = render(<ArtifactPanel resources={[{ ...web, status: "loading" }]} onRetry={retry} />);
    expect(screen.getByText("Loading preview…")).toBeTruthy();
    rerender(<ArtifactPanel resources={[{ ...web, status: "error", error: "Access expired" }]} onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalled();
    rerender(<ArtifactPanel resources={[{ id: "zip", version: "1", name: "archive.zip", kind: "file", size: 128, mimeType: "application/zip" }]} />);
    expect(screen.getByText("A preview is not available for this file.")).toBeTruthy();
  });

  it("refreshes only its frame and rejects executable URL protocols", () => {
    const { container, rerender } = render(<ArtifactPanel resources={[web]} />);
    const frame = container.querySelector("iframe");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(container.querySelector("iframe")).not.toBe(frame);
    rerender(<ArtifactPanel resources={[{ ...web, version: "2", url: "javascript:alert(1)" }]} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("link", { name: "Open externally" })).toBeNull();
    for (const url of ["javascript:alert(1)", "data:text/html,hello", "file:///secret", "vbscript:msgbox(1)"]) expect(safeArtifactUrl(url)).toBeUndefined();
    expect(safeArtifactUrl("blob:local", true)).toBeUndefined();
    expect(safeArtifactUrl("/preview.html", true)).toBe("/preview.html");
  });

  it("reports image errors and retries without replacing the panel", () => {
    const { container } = render(<ArtifactPanel resources={[{ id: "image", version: "1", kind: "image", name: "mock.png", url: "/mock.png" }]} />);
    const image = container.querySelector("img")!;
    fireEvent.error(image);
    expect(screen.getByText("This content could not be loaded.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(container.querySelector("img")).not.toBe(image);
  });

  it("supports a custom preview and localized labels outside ChatWorkspace", () => {
    render(<ArtifactPanel locale="zh-CN" resources={[web]} renderPreview={() => <p>Host browser</p>} />);
    expect(screen.getByText("Host browser")).toBeTruthy();
    expect(screen.getByRole("region", { name: "内容预览" })).toBeTruthy();
  });

  it("reviews only the current file and keeps the host's accepted and rejected states", async () => {
    const calls = vi.fn();
    function Example() {
      const [resources, setResources] = useState<ArtifactResource[]>([code, markdown]);
      return <ArtifactPanel resources={resources} onReview={(resource, decision) => {
        calls(resource, decision);
        setResources((current) => current.map((item) => item.id === resource.id && "review" in item ? { ...item, review: decision === "accept" ? "accepted" : "rejected" } : item));
      }} />;
    }
    const { container } = render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await screen.findByText("Accepted");
    expect(calls).toHaveBeenCalledExactlyOnceWith(code, "accept");
    expect(container.querySelectorAll('[data-slot="artifact-review-bar"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Review pending items" }));
    expect(screen.getByRole("tab", { name: "README.md" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await screen.findByText("Rejected");
    expect(calls.mock.calls[1]).toEqual([markdown, "reject"]);
    expect(container.querySelector('[data-slot="artifact-review-bar"]')).toBeNull();
  });

  it("navigates the pending list in order and wraps past unrelated or unavailable files", async () => {
    render(<ArtifactPanel resources={[code, web, { ...code, id: "loading", name: "loading.ts", status: "loading" }, markdown]} defaultActiveId="web" onReview={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Next pending item" }));
    expect(screen.getByRole("tab", { name: "theme.ts" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Previous pending item" }));
    expect(screen.getByRole("tab", { name: "README.md" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Next pending item" }));
    fireEvent.click(screen.getByRole("button", { name: "Pending review items" }));
    expect(await screen.findAllByRole("menuitemradio")).toHaveLength(2);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "README.md" }));
    expect(screen.getByRole("tab", { name: "README.md" }).getAttribute("aria-selected")).toBe("true");
  });

  it("locks individual and batch actions during a save, and scopes failures to their exact version", async () => {
    let fail: ((error: Error) => void) | undefined;
    const review = vi.fn(() => new Promise<void>((_, reject) => { fail = reject; }));
    const { rerender } = render(<ArtifactPanel resources={[code, markdown]} onReview={review} />);
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Next pending item" }));
    expect((screen.getByRole("button", { name: "Accept" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Batch review actions" }) as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(review).toHaveBeenCalledExactlyOnceWith(code, "reject"));
    fail?.(new Error("conflict"));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain("theme.ts");
    rerender(<ArtifactPanel resources={[{ ...code, version: "2" }, markdown]} onReview={review} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("tab", { name: "README.md" }).getAttribute("aria-selected")).toBe("true");
  });

  it("retains other file failures when retrying one failed revision", async () => {
    const review = vi.fn().mockRejectedValue(new Error("offline"));
    render(<ArtifactPanel resources={[code, markdown]} onReview={review} />);
    await batchReview("Accept all");
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("theme.ts, README.md");
    review.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("README.md");
      expect(screen.getByRole("alert").textContent).not.toContain("theme.ts");
    });
  });

  it("closes other tabs as one operation without reviewing or replacing the active preview", async () => {
    const closeMany = vi.fn();
    const review = vi.fn();
    function Example() {
      const [resources, setResources] = useState<ArtifactResource[]>([code, web, markdown]);
      return <ArtifactPanel resources={resources} defaultActiveId="web" onReview={review} onCloseMany={(items) => {
        closeMany(items);
        setResources((current) => current.filter((item) => !items.some((closed) => closed.id === item.id)));
      }} />;
    }
    const { container } = render(<Example />);
    const frame = container.querySelector("iframe");
    await tabAction("Close other tabs");
    expect(closeMany).toHaveBeenCalledExactlyOnceWith([code, markdown]);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(container.querySelector("iframe")).toBe(frame);
    expect(review).not.toHaveBeenCalled();
  });

  it("falls back to individual close callbacks and leaves controlled resources to the host", async () => {
    const close = vi.fn();
    const select = vi.fn();
    render(<ArtifactPanel resources={[code, web, markdown]} activeId="web" onActiveIdChange={select} onClose={close} />);
    await tabAction("Close all tabs");
    expect(close.mock.calls).toEqual([[code], [web], [markdown]]);
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Website" }).getAttribute("aria-selected")).toBe("true");
  });

  it("closes every tab atomically while retaining the empty panel's open action", async () => {
    const closeMany = vi.fn();
    function Example() {
      const [resources, setResources] = useState<ArtifactResource[]>([code, web]);
      return <ArtifactPanel resources={resources} addAction={<button>Open resource</button>} onCloseMany={(items) => { closeMany(items); setResources([]); }} />;
    }
    render(<Example />);
    await tabAction("Close all tabs");
    expect(closeMany).toHaveBeenCalledExactlyOnceWith([code, web]);
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("button", { name: "Open resource" })).toBeTruthy();
  });

  it("uses absolute image zoom and keeps it stable on resize until fit is restored", () => {
    let width = 548;
    let resize: (() => void) | undefined;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) { return this.dataset.slot === "artifact-image-viewport" ? width : 0; });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(448);
    vi.stubGlobal("ResizeObserver", class extends TestResizeObserver {
      constructor(private callback: () => void) { super(); }
      observe(node: HTMLElement) { if (node.dataset.slot === "artifact-image-viewport") resize = this.callback; }
    });
    const { container } = render(<ArtifactPanel resources={[{ id: "image", version: "1", kind: "image", name: "mock.png", url: "/mock.png" }]} />);
    const image = container.querySelector("img")!;
    Object.defineProperties(image, { naturalWidth: { value: 1000 }, naturalHeight: { value: 400 } });
    fireEvent.load(image);
    expect(image.style.width).toBe("500px");
    fireEvent.click(screen.getByRole("button", { name: "Actual size" }));
    expect(image.style.width).toBe("1000px");
    width = 348;
    act(() => resize?.());
    expect(image.style.width).toBe("1000px");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(image.style.width).toBe("1250px");
    fireEvent.click(screen.getByRole("button", { name: "Fit" }));
    expect(image.style.width).toBe("300px");
    expect(screen.getByRole("button", { name: "Fit" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("pans an image with the mouse, stops after cancellation, and leaves touch scrolling native", () => {
    vi.stubGlobal("PointerEvent", class extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? "mouse"; }
    });
    const { container } = render(<ArtifactPanel resources={[{ id: "image", version: "1", kind: "image", name: "mock.png", url: "/mock.png" }]} />);
    const image = container.querySelector("img")!;
    Object.defineProperties(image, { naturalWidth: { value: 1000 }, naturalHeight: { value: 400 } });
    fireEvent.load(image);
    const viewport = container.querySelector<HTMLElement>('[data-slot="artifact-image-viewport"]')!;
    viewport.setPointerCapture = vi.fn();
    viewport.releasePointerCapture = vi.fn();
    fireEvent.pointerDown(viewport, { button: 0, pointerId: 1, pointerType: "mouse", clientX: 200, clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 120, clientY: 50 });
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([80, 50]);
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 0, clientY: 0 });
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([80, 50]);
    fireEvent.pointerDown(viewport, { button: 0, pointerId: 2, pointerType: "touch", clientX: 200, clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 0, clientY: 0 });
    expect(viewport.setPointerCapture).toHaveBeenCalledExactlyOnceWith(1);
    expect([viewport.scrollLeft, viewport.scrollTop]).toEqual([80, 50]);
  });

  it("disables image controls after a decode failure and enables them again after retry", () => {
    const { container } = render(<ArtifactPanel resources={[{ id: "image", version: "1", kind: "image", name: "mock.png", url: "/mock.png" }]} />);
    const image = container.querySelector("img")!;
    Object.defineProperties(image, { naturalWidth: { value: 1000 }, naturalHeight: { value: 400 } });
    fireEvent.load(image);
    fireEvent.click(screen.getByRole("button", { name: "Actual size" }));
    fireEvent.error(image);
    for (const name of ["Zoom in", "Zoom out", "Actual size", "Fit"]) expect((screen.getByRole("button", { name }) as HTMLButtonElement).disabled).toBe(true);
    expect(container.querySelector('[data-slot="artifact-image-viewport"]')?.classList.contains("cursor-grab")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    const next = container.querySelector("img")!;
    Object.defineProperties(next, { naturalWidth: { value: 1000 }, naturalHeight: { value: 400 } });
    fireEvent.load(next);
    expect((screen.getByRole("button", { name: "Zoom in" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("artifact tab overflow", () => {
  const resources = [code, markdown, web];
  it("keeps all tabs when they fit, and reserves the menu button when they overflow", () => {
    expect([...visibleArtifactIds(resources, "code", [100, 120, 80], 304, 40, 2)]).toEqual(["code", "doc", "web"]);
    expect([...visibleArtifactIds(resources, "code", [100, 120, 80], 260, 40, 2)]).toEqual(["code", "web"]);
  });
  it("always retains the selected tab, including a long name in a narrow panel", () => {
    expect([...visibleArtifactIds(resources, "web", [100, 120, 80], 150, 40, 2)]).toEqual(["web"]);
    expect([...visibleArtifactIds(resources, "doc", [100, 256, 80], 100, 40, 2)]).toEqual(["doc"]);
    expect([...visibleArtifactIds(resources, "web", [100, 120, 80], 340, 40, 2)]).toEqual(["code", "doc", "web"]);
  });
  it("retains only the active tab when permanent actions exhaust the available width", () => {
    expect([...visibleArtifactIds(resources, "doc", [100, 120, 80], -8, 0, 2)]).toEqual(["doc"]);
    expect([...visibleArtifactIds(resources, "web", [100, 120, 80], 0, 0, 2)]).toEqual(["web"]);
    expect([...visibleArtifactIds([], "missing", [], 0, 32, 2)]).toEqual([]);
  });
  it("lists all resources in the overflow menu, promotes the selection, and expands when space returns", async () => {
    let width = 210;
    let resize: (() => void) | undefined;
    vi.stubGlobal("ResizeObserver", class extends TestResizeObserver {
      constructor(private callback: () => void) { super(); }
      observe(node: HTMLElement) { if (node.parentElement?.dataset.slot === "artifact-tab-bar") resize = this.callback; }
    });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.parentElement?.dataset.slot === "artifact-tab-bar" ? width : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return { x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 32, width: this.querySelector("[data-measure-artifact]") ? 100 : 32, height: 32, toJSON() {} };
    });
    render(<ArtifactPanel resources={resources} onClose={() => {}} />);
    expect(screen.getAllByRole("tab", { name: /theme.ts|README.md|Website/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "More open content" }));
    const options = await screen.findAllByRole("menuitemradio");
    expect(options).toHaveLength(3);
    expect(screen.getByRole("menuitemradio", { name: "theme.ts" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Website" }));
    expect(screen.getByRole("tab", { name: "Website" }).getAttribute("aria-selected")).toBe("true");
    width = 460;
    act(() => resize?.());
    expect(screen.getAllByRole("tab", { name: /theme.ts|README.md|Website/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "More open content" })).toBeTruthy();
  });
});

describe("ChatWorkspace", () => {
  it("retains composer identity and draft while changing pane visibility", () => {
    const composer = <textarea defaultValue="draft in progress" aria-label="Draft" />;
    const { rerender } = render(<ChatWorkspace composer={composer} artifacts={<ArtifactPanel resources={[web]} />} panelOpen />);
    const input = screen.getByRole("textbox", { name: "Draft" });
    rerender(<ChatWorkspace composer={composer} artifacts={<ArtifactPanel resources={[web]} />} panelOpen={false} />);
    rerender(<ChatWorkspace composer={composer} artifacts={<ArtifactPanel resources={[web]} />} panelOpen activePane="artifacts" />);
    expect(screen.getByLabelText("Draft")).toBe(input);
    expect((input as HTMLTextAreaElement).value).toBe("draft in progress");
  });

  it("opens a resource through a message card without managing host file state", () => {
    const open = vi.fn();
    const { container } = render(<ArtifactCard resources={[code, web, { ...web, id: "image", kind: "image", name: "mock.png", size: 1536 }]} onOpen={open} />);
    expect(container.querySelectorAll('[data-slot="info-item"]')).toHaveLength(3);
    expect(screen.getByText("11 B")).toBeTruthy();
    expect(screen.getByText("1.5 KB")).toBeTruthy();
    expect(screen.getByText("https://example.com")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Preview: theme.ts" }));
    expect(open).toHaveBeenCalledExactlyOnceWith(code);
  });
});
