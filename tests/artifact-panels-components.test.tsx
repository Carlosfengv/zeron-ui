// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactPanel, artifactEnLabels, artifactZhLabels, getPendingReviewResources, type ArtifactPanelProps, type ArtifactResource } from "@zeron/ui/artifact-panel";
import { ArtifactPreviewPanel, artifactPreviewEnLabels, artifactPreviewZhLabels, type ArtifactPreviewPanelProps, type ArtifactDocument } from "@zeron/ui/artifact-preview-panel";
import * as workspace from "@zeron/blocks/chat-workspace-01";
import * as artifact from "@zeron/blocks/artifact-01";
import { ArtifactTabs as LegacyTabs } from "../packages/blocks/src/application/chat-workspace-01/artifact-tabs";
import { ArtifactTabs } from "@zeron/ui/artifact-panel/tabs";

vi.mock("../packages/ui/src/components/artifact-panel/code-preview", () => ({ ArtifactCodePreview: () => <p>Host content</p> }));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Artifact panel component compatibility", () => {
  it("preserves resource panel exports, types, labels, helpers and workspace fixtures", () => {
    expect(workspace.ArtifactPanel).toBe(ArtifactPanel);
    expect(workspace.artifactEnLabels).toBe(artifactEnLabels);
    expect(workspace.artifactZhLabels).toBe(artifactZhLabels);
    expect(workspace.getPendingReviewResources).toBe(getPendingReviewResources);
    expect(LegacyTabs).toBe(ArtifactTabs);
    const oldProps: workspace.ArtifactPanelProps = { resources: workspace.createChatWorkspaceDemoResources(), labels: workspace.artifactZhLabels };
    const shared: ArtifactPanelProps = oldProps;
    expect(shared.resources.length).toBeGreaterThan(0);
    expect(shared.labels).toBe(artifactZhLabels);
    expect(typeof workspace.ChatWorkspace).toBe("function");
    expect(typeof workspace.ArtifactCard).toBe("function");
  });

  it("preserves generated preview exports, types, labels and block compositions", () => {
    expect(artifact.ArtifactPreviewPanel).toBe(ArtifactPreviewPanel);
    expect(artifact.artifactPreviewEnLabels).toBe(artifactPreviewEnLabels);
    expect(artifact.artifactPreviewZhLabels).toBe(artifactPreviewZhLabels);
    const oldProps: artifact.ArtifactPreviewPanelProps = { artifact: artifact.createArtifactDemoDocuments()[0], locale: "zh-CN" };
    const shared: ArtifactPreviewPanelProps = oldProps;
    expect(shared.artifact).toBe(oldProps.artifact);
    expect(typeof artifact.ArtifactWorkspace).toBe("function");
    expect(typeof artifact.GeneratedArtifactCard).toBe("function");
    expect(typeof artifact.createPricingArtifactHtml).toBe("function");
  });

  it("accepts readonly host resources without a workspace and emits the exact review version", async () => {
    const resource = Object.freeze({ id: "file / #1", version: "v2", name: "settings.ts", kind: "code" as const, content: "new", previousContent: "old", review: "pending" as const });
    const resources: readonly ArtifactResource[] = Object.freeze([resource]);
    const review = vi.fn();
    render(<ArtifactPanel resources={resources} onReview={review} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(review).toHaveBeenCalledWith(resource, "accept"));
    expect(review.mock.calls[0][0]).toBe(resource);
    expect(resource.review).toBe("pending");
    expect(getPendingReviewResources(resources)).toEqual([resource]);
  });

  it("accepts a standalone readonly document and leaves close persistence with the host", async () => {
    const revision = Object.freeze({ id: "v1", content: "<h1>Host snapshot</h1>" });
    const snapshot: ArtifactDocument = Object.freeze({ id: "page", title: "Host document", filename: "page.html", kind: "html", revisions: Object.freeze([revision]) });
    const close = vi.fn();
    const { container } = render(<ArtifactPreviewPanel artifact={snapshot} onClose={close} />);
    expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toBe(revision.content);
    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(container.querySelector("iframe")).toBeTruthy();
    expect(snapshot.revisions[0]).toBe(revision);
  });
});
