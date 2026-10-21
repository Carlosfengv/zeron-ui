// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CodeFile } from "@zeron/ui/code-block";
import { ArtifactCodePreview } from "@zeron/ui/artifact-panel/code-preview";
import { ArtifactContent } from "@zeron/ui/artifact-preview-panel/content";
import type { ArtifactResource } from "@zeron/ui/artifact-panel";
import type { ArtifactDocument } from "@zeron/ui/artifact-preview-panel";
import { ArtifactCodePreview as LegacyCodePreview } from "../packages/blocks/src/application/chat-workspace-01/artifact-code-preview";
import { ArtifactContent as LegacyContent } from "../packages/blocks/src/application/artifact-01/artifact-content";

const leaf = vi.hoisted(() => ({ code: vi.fn(), diff: vi.fn(), markdown: vi.fn() }));
vi.mock("@zeron/ui/code-block", () => ({
  CodeBlock: (props: { file: CodeFile; toolbar?: boolean }) => {
    leaf.code(props); return <pre data-testid="code">{props.file.contents}</pre>;
  },
  CodeDiff: (props: { oldFile: CodeFile; newFile: CodeFile; options: { diffStyle: string } }) => {
    leaf.diff(props); return <pre data-testid="diff">{props.oldFile.contents} → {props.newFile.contents}</pre>;
  },
}));
vi.mock("@zeron/ui/markdown", () => ({ Markdown: (props: { text: string }) => {
  leaf.markdown(props); return <article>{props.text}</article>;
} }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const resource: ArtifactResource = { id: "code", version: "2", kind: "code", name: "settings.ts", path: "src/settings.ts", previousPath: "src/config.ts", content: "export const ready = true;", previousContent: "" };
const artifact: ArtifactDocument = { id: "guide", title: "Guide", filename: "docs/README.md", kind: "markdown", revisions: [{ id: "v1", content: "" }, { id: "v2", content: "# Ready" }] };

describe("Artifact content rendering compatibility", () => {
  it("keeps both legacy block content exports and parameters", () => {
    expect(LegacyCodePreview).toBe(ArtifactCodePreview);
    expect(LegacyContent).toBe(ArtifactContent);
  });

  it("renders resource and revision Markdown with the same content width and spacing", () => {
    render(<><ArtifactCodePreview resource={{ ...resource, kind: "markdown" }} view="preview" split={false} />
      <ArtifactContent artifact={artifact} revision={artifact.revisions[1]} view="preview" /></>);
    expect(leaf.markdown.mock.calls.map(([props]) => props.text)).toEqual([resource.content, "# Ready"]);
    for (const article of screen.getAllByRole("article")) expect(article.parentElement?.className).toBe("mx-auto w-full max-w-3xl p-6");
    expect(leaf.code).not.toHaveBeenCalled();
    expect(leaf.diff).not.toHaveBeenCalled();
  });

  it.each([true, false])("preserves renamed paths and empty old content in resource diffs (split=%s)", (split) => {
    render(<ArtifactCodePreview resource={resource} view="diff" split={split} />);
    expect(leaf.diff).toHaveBeenCalledWith({ oldFile: { name: "src/config.ts", contents: "" }, newFile: { name: "src/settings.ts", contents: resource.content }, options: { diffStyle: split ? "split" : "unified" } });
    expect(screen.getByTestId("diff").parentElement?.className).toBe("min-w-0 p-3");
  });

  it.each(["path", "name"])("uses the resource %s when no rename path is supplied", (fallback) => {
    const file = { ...resource, previousPath: undefined, path: fallback === "path" ? resource.path : undefined };
    render(<ArtifactCodePreview resource={file} view="diff" split={false} />);
    const expected = fallback === "path" ? resource.path : resource.name;
    expect(leaf.diff.mock.calls[0][0].oldFile.name).toBe(expected);
    expect(leaf.diff.mock.calls[0][0].newFile.name).toBe(expected);
  });

  it("keeps the resource code toolbar and falls back to source when no diff is available", () => {
    render(<ArtifactCodePreview resource={{ ...resource, previousContent: undefined }} view="diff" split={true} />);
    expect(leaf.code).toHaveBeenCalledWith({ file: { name: resource.path, contents: resource.content }, toolbar: undefined });
    expect(screen.getByTestId("code").parentElement?.className).toBe("min-w-0 p-3");
    expect(leaf.diff).not.toHaveBeenCalled();
  });

  it("renders Markdown source and plain text as code", () => {
    render(<><ArtifactCodePreview resource={{ id: "md", version: "1", kind: "markdown", name: "README.md", content: "# Raw" }} view="source" split={false} />
      <ArtifactCodePreview resource={{ id: "text", version: "1", kind: "text", name: "notes.txt", content: "Plain text" }} view="preview" split={false} /></>);
    expect(leaf.code.mock.calls.map(([props]) => props.file)).toEqual([{ name: "README.md", contents: "# Raw" }, { name: "notes.txt", contents: "Plain text" }]);
    expect(leaf.markdown).not.toHaveBeenCalled();
  });

  it.each(["image", "url", "file"] as const)("leaves %s preview to the resource viewer", (kind) => {
    const { container } = render(<ArtifactCodePreview resource={{ id: kind, version: "1", kind, name: kind, url: "/asset" }} view="preview" split={false} />);
    expect(container.childElementCount).toBe(0);
    expect(leaf.code).not.toHaveBeenCalled();
    expect(leaf.markdown).not.toHaveBeenCalled();
  });

  it("compares the supplied previous revision in a unified diff, including empty content", () => {
    render(<ArtifactContent artifact={artifact} revision={artifact.revisions[1]} previous={artifact.revisions[0]} view="changes" />);
    expect(leaf.diff).toHaveBeenCalledWith({ oldFile: { name: artifact.filename, contents: "" }, newFile: { name: artifact.filename, contents: "# Ready" }, options: { diffStyle: "unified" } });
  });

  it.each(["code", "changes"] as const)("hides the revision code toolbar for %s without a previous revision", (view) => {
    render(<ArtifactContent artifact={artifact} revision={artifact.revisions[1]} view={view} />);
    expect(leaf.code).toHaveBeenCalledWith({ file: { name: artifact.filename, contents: "# Ready" }, toolbar: false });
    expect(leaf.diff).not.toHaveBeenCalled();
  });

  it.each(["html", "code"] as const)("does not execute %s in the revision content adapter", (kind) => {
    const revision = { id: "v1", content: "<script>window.host = true</script>" };
    const { container } = render(<ArtifactContent artifact={{ ...artifact, kind }} revision={revision} view="preview" />);
    expect(leaf.code.mock.calls[0][0].file.contents).toBe(revision.content);
    expect(container.querySelector("iframe, script")).toBeNull();
    expect(leaf.markdown).not.toHaveBeenCalled();
  });
});
