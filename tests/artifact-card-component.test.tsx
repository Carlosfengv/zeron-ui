// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtifactCard, type ArtifactCardItem } from "@zeron/ui/artifact-card";
import { ArtifactCard as LegacyCard, type ArtifactCardProps as LegacyProps, type ArtifactResource } from "@zeron/blocks/chat-workspace-01";

vi.mock("@zeron/ui/code-block", () => ({ CodeBlock: () => null, CodeDiff: () => null }));
afterEach(cleanup);

describe("standalone artifact cards and workspace compatibility", () => {
  it("uses display-only metadata and returns the original custom record", () => {
    const resource = { id: "page", name: "page.html", kind: "code" as const, description: "Generated page", review: "pending" as const, documentId: 42 };
    const open = vi.fn();
    render(<ArtifactCard resources={[resource]} onOpen={open} locale="zh-CN" data-testid="card" />);
    expect(screen.getByText("Generated page")).toBeTruthy();
    expect(screen.getByText("待审阅")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "预览: page.html" }));
    expect(open.mock.calls[0][0]).toBe(resource);
    expect(screen.getByTestId("card").getAttribute("data-slot")).toBe("artifact-card");
  });

  it("supports host adapters, zero-valued metadata and long labels", () => {
    const resources: ArtifactCardItem[] = [{ id: "zero", kind: "file", name: "A very long generated file name.txt", review: "pending" }];
    render(<ArtifactCard resources={resources} onOpen={vi.fn()} getDescription={() => 0} getReviewStatus={() => undefined} title="Downloads" />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.queryByText("Pending")).toBeNull();
    expect(screen.getByText("Downloads")).toBeTruthy();
  });

  it("preserves workspace byte sizes, URL filtering, review eligibility and full labels", () => {
    const resource: ArtifactResource = { id: "code", version: "v1", name: "hello.ts", kind: "code", content: "你好", review: "pending" };
    const web: ArtifactResource = { id: "web", version: "v1", name: "Unsafe web", kind: "url", url: "javascript:alert(1)" };
    const open = vi.fn();
    const props: LegacyProps = { resources: [resource, web], onOpen: open, labels: { panel: "Legacy label", unavailableUrl: "No valid URL" } };
    const { rerender } = render(<LegacyCard {...props} />);
    expect(screen.getByText("6 B")).toBeTruthy();
    expect(screen.getByText("No valid URL")).toBeTruthy();
    expect(screen.queryByText("Pending")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Preview: hello.ts" }));
    expect(open.mock.calls[0][0]).toBe(resource);
    rerender(<LegacyCard {...props} resources={[{ ...resource, previousContent: "old" }]} />);
    expect(screen.getByText("Pending")).toBeTruthy();
  });
});
