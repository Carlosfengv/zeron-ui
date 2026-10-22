// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArtifactPreviewPanel, GeneratedArtifactCard, type ArtifactDocument } from "@zeron/blocks/artifact-01";

vi.mock("../packages/ui/src/components/artifact-preview-panel/content", () => ({
  ArtifactContent: ({ revision, previous, view }: { revision: { content: string }; previous?: { content: string }; view: string }) => <div data-testid="artifact-content" data-view={view}>{previous && view === "changes" ? `${previous.content} → ` : ""}{revision.content}</div>,
}));
class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const document: ArtifactDocument = { id: "page", title: "Pricing page", filename: "pricing.html", kind: "html", revisions: [
  { id: "v1", content: "<h1>First</h1>" }, { id: "v2", content: "<h1>Second</h1>" },
] };

async function selectVersion(version: number) {
  fireEvent.click(screen.getByRole("button", { name: /Version \d of/ }));
  fireEvent.click(await screen.findByRole("menuitemradio", { name: `v${version}` }));
}

it("isolates generated HTML from the host and reloads the selected revision", () => {
  const { container } = render(<ArtifactPreviewPanel artifact={document} />);
  const frame = container.querySelector("iframe")!;
  expect(frame.getAttribute("srcdoc")).toBe(document.revisions[1].content);
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
  expect(frame.getAttribute("referrerpolicy")).toBe("no-referrer");
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  expect(container.querySelector("iframe")).not.toBe(frame);
  expect(container.querySelector("iframe")!.getAttribute("srcdoc")).toBe(document.revisions[1].content);
});

it("keeps streaming HTML in code and opens Preview only when ready", async () => {
  const streaming: ArtifactDocument = { ...document, revisions: [{ id: "v1", content: "<h1>Partial", status: "streaming" }] };
  const { container, rerender } = render(<ArtifactPreviewPanel artifact={streaming} />);
  await screen.findByText("<h1>Partial");
  expect(container.querySelector("iframe")).toBeNull();
  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("button", { name: "Copy code" }).hasAttribute("disabled")).toBe(true);
  rerender(<ArtifactPreviewPanel artifact={{ ...streaming, revisions: [{ id: "v1", content: "<h1>Complete</h1>", status: "ready" }] }} />);
  await waitFor(() => expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe("<h1>Complete</h1>"));
});

it("preserves the live preview and source viewport across view switches", async () => {
  const { container } = render(<ArtifactPreviewPanel artifact={document} />);
  const frame = container.querySelector("iframe");
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  const source = await screen.findByTestId("artifact-content");
  fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
  expect(container.querySelector("iframe")).toBe(frame);
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  await screen.findByText("<h1>First</h1> → <h1>Second</h1>");
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByRole("tabpanel", { name: "Code" }).querySelector('[data-testid="artifact-content"]')).toBe(source);
});

it("defers HTML until visited and replaces it for a different revision", async () => {
  const streaming: ArtifactDocument = { ...document, revisions: [{ ...document.revisions[0], status: "streaming" }] };
  const { container, rerender } = render(<ArtifactPreviewPanel artifact={streaming} />);
  await screen.findByTestId("artifact-content");
  expect(container.querySelector("iframe")).toBeNull();
  rerender(<ArtifactPreviewPanel artifact={document} revisionId="v1" />);
  const frame = container.querySelector("iframe");
  expect(frame?.getAttribute("srcdoc")).toBe(document.revisions[0].content);
  rerender(<ArtifactPreviewPanel artifact={document} revisionId="v2" />);
  expect(container.querySelectorAll("iframe")).toHaveLength(1);
  expect(container.querySelector("iframe")).not.toBe(frame);
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[1].content);
});

it("selects the appended revision after a successful uncontrolled restoration", async () => {
  function Host() {
    const [artifact, setArtifact] = useState(document);
    return <ArtifactPreviewPanel artifact={artifact} onRestore={(_, revision) => {
      setArtifact((current) => ({ ...current, revisions: [...current.revisions, { ...revision, id: "v3" }] }));
    }} />;
  }
  const { container } = render(<Host />);
  await selectVersion(1);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  await screen.findByRole("button", { name: "Version 3 of 3" });
  expect(screen.queryByRole("button", { name: "Restore this version" })).toBeNull();
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[0].content);
});

it("keeps controlled selection with the host after successful restoration", async () => {
  const restore = vi.fn().mockResolvedValue(undefined);
  const change = vi.fn();
  const { rerender } = render(<ArtifactPreviewPanel artifact={document} revisionId="v1" onRestore={restore} onRevisionChange={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Restore this version" }).hasAttribute("disabled")).toBe(false));
  rerender(<ArtifactPreviewPanel artifact={{ ...document, revisions: [...document.revisions, { ...document.revisions[0], id: "v3" }] }} revisionId="v1" onRestore={restore} onRevisionChange={change} />);
  expect(screen.getByRole("button", { name: "Version 1 of 3" })).toBeDefined();
  expect(change).not.toHaveBeenCalled();
});

it("does not override a different version chosen while restoration is pending", async () => {
  let complete!: () => void;
  function Host() {
    const [artifact, setArtifact] = useState(document);
    return <ArtifactPreviewPanel artifact={artifact} onRestore={(_, revision) => new Promise<void>((resolve) => {
      complete = () => {
        setArtifact((current) => ({ ...current, revisions: [...current.revisions, { ...revision, id: "v3" }] }));
        resolve();
      };
    })} />;
  }
  render(<Host />);
  await selectVersion(1);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  await selectVersion(2);
  await act(async () => complete());
  expect(screen.getByRole("button", { name: "Version 2 of 3" })).toBeDefined();
});

it("keeps the selected historical revision when uncontrolled restoration fails", async () => {
  render(<ArtifactPreviewPanel artifact={document} onRestore={() => Promise.reject(new Error("Not saved"))} />);
  await selectVersion(1);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  await screen.findByText("Could not restore this version. Try again.");
  expect(screen.getByRole("button", { name: "Version 1 of 2" })).toBeDefined();
});

it("does not change another document's selection when an earlier restoration completes", async () => {
  let complete!: () => void;
  const restore = () => new Promise<void>((resolve) => { complete = resolve; });
  const { rerender } = render(<ArtifactPreviewPanel artifact={document} onRestore={restore} />);
  await selectVersion(1);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  rerender(<ArtifactPreviewPanel artifact={{ ...document, id: "another" }} onRestore={restore} />);
  await selectVersion(1);
  await act(async () => complete());
  expect(screen.getByRole("button", { name: "Version 1 of 2" })).toBeDefined();
});

it("browses history and compares the selected version against its predecessor", async () => {
  const { container } = render(<ArtifactPreviewPanel artifact={document} onRestore={() => {}} />);
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  await screen.findByText("<h1>First</h1> → <h1>Second</h1>");
  await selectVersion(1);
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[0].content);
  expect(screen.queryByRole("tab", { name: "Changes" })).toBeNull();
  expect(screen.getByRole("button", { name: "Restore this version" })).toBeDefined();
});

it("requests controlled version changes without committing them", async () => {
  const change = vi.fn();
  const { container } = render(<ArtifactPreviewPanel artifact={document} revisionId="v2" onRevisionChange={change} />);
  await selectVersion(1);
  expect(change).toHaveBeenCalledWith("v1");
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[1].content);
});

it("copies and downloads the historical version rather than the latest", async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  const create = vi.fn().mockReturnValue("blob:artifact");
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<ArtifactPreviewPanel artifact={document} revisionId="v1" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await screen.findByText("Copied");
  expect(copy).toHaveBeenCalledWith(document.revisions[0].content);
  fireEvent.click(screen.getByRole("button", { name: "Download pricing.html" }));
  expect(create).toHaveBeenCalledOnce();
  expect((click.mock.instances[0] as HTMLAnchorElement).download).toBe("pricing.html");
  expect((create.mock.calls[0][0] as Blob).size).toBe(new Blob([document.revisions[0].content]).size);
});

it("locks restoration and keeps rejected requests attached to their originating revision", async () => {
  let reject!: (reason: Error) => void;
  const restore = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
  const { rerender } = render(<ArtifactPreviewPanel artifact={document} revisionId="v1" onRestore={restore} />);
  fireEvent.click(screen.getByRole("button", { name: "Restore this version" }));
  fireEvent.click(screen.getByRole("button", { name: /Restoring/ }));
  expect(restore).toHaveBeenCalledOnce();
  expect(restore).toHaveBeenCalledWith(document, document.revisions[0]);
  rerender(<ArtifactPreviewPanel artifact={{ ...document, id: "another" }} revisionId="v1" onRestore={restore} />);
  await act(async () => { reject(new Error("Not saved")); });
  expect(screen.queryByText("Could not restore this version. Try again.")).toBeNull();
  rerender(<ArtifactPreviewPanel artifact={document} revisionId="v1" onRestore={restore} />);
  expect(screen.getByRole("alert").textContent).toContain("Could not restore");
});

it("resets internal selection across documents and tolerates missing revision IDs", async () => {
  const { container, rerender } = render(<ArtifactPreviewPanel artifact={document} />);
  await selectVersion(1);
  rerender(<ArtifactPreviewPanel artifact={{ ...document, id: "other" }} />);
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[1].content);
  rerender(<ArtifactPreviewPanel artifact={document} />);
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[1].content);
  rerender(<ArtifactPreviewPanel artifact={document} revisionId="missing" />);
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(document.revisions[1].content);
});

it("shows empty and failed states and passes an exact revision to retry", () => {
  const retry = vi.fn();
  const { rerender } = render(<ArtifactPreviewPanel artifact={null} />);
  expect(screen.getByText("Your next idea starts here")).toBeDefined();
  const failed: ArtifactDocument = { ...document, revisions: [{ id: "failed", content: "", status: "error", error: "Generation stopped" }] };
  rerender(<ArtifactPreviewPanel artifact={failed} onRetry={retry} />);
  expect(screen.getByRole("alert").textContent).toBe("Generation stopped");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledWith(failed, failed.revisions[0]);
});

it("shows code-only documents without an executable Preview and opens exact card versions", async () => {
  const open = vi.fn();
  const { rerender } = render(<ArtifactPreviewPanel artifact={{ ...document, kind: "code" }} />);
  expect(screen.queryByRole("tab", { name: "Preview" })).toBeNull();
  expect((await screen.findByTestId("artifact-content")).getAttribute("data-view")).toBe("code");
  rerender(<GeneratedArtifactCard artifact={document} revisionId="v1" onOpen={open} />);
  fireEvent.click(screen.getByRole("button", { name: "Preview: pricing.html" }));
  expect(open).toHaveBeenCalledWith(document, "v1");
});
