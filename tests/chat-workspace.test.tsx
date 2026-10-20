// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactCard, ArtifactPanel, ChatWorkspace, getPendingReviewResources, type ArtifactResource } from "@zeron/blocks/chat-workspace-01";
import { artifactSizeText, safeArtifactUrl } from "../packages/blocks/src/application/chat-workspace-01/artifact-utils";
import { visibleArtifactIds } from "../packages/blocks/src/application/chat-workspace-01/artifact-tabs";

vi.mock("../packages/blocks/src/application/chat-workspace-01/artifact-code-preview", () => ({
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
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const code: ArtifactResource = { id: "code", version: "1", name: "theme.ts", kind: "code", content: "new content", previousContent: "old content", review: "pending" };
const markdown: ArtifactResource = { id: "doc", version: "1", name: "README.md", kind: "markdown", content: "# Guide", previousContent: "", review: "pending" };
const web: ArtifactResource = { id: "web", version: "1", name: "Website", kind: "url", url: "https://example.com" };

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
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(2));
    release?.();
    await screen.findByText("Some changes could not be reviewed. Retry the remaining changes.");
    expect(screen.getByText("1 change to review")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    await waitFor(() => expect(calls).toHaveBeenCalledTimes(3));
    expect(calls.mock.calls[2][0]).toBe("doc");
  });

  it("passes the exact revision to review and never invents an accepted status", async () => {
    const review = vi.fn().mockResolvedValue(undefined);
    render(<ArtifactPanel resources={[{ ...code, version: "revision-2" }]} onReview={review} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
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
    expect(screen.queryByRole("button", { name: "More open content" })).toBeNull();
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
