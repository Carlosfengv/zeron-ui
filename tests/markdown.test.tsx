// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Markdown } from "@zeron/ui/markdown";

vi.mock("#components/code-block", () => ({
  CodeBlock: ({ file, messages }: { file: { name: string; contents: string; lang?: string }; messages?: { copy?: string } }) => (
    <pre data-testid="code-block" data-filename={file.name} data-language={file.lang} aria-label={messages?.copy}>{file.contents}</pre>
  ),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("shared chat Markdown", () => {
  it("preserves numbered starts, nested lists and read-only GFM tasks", () => {
    const text = ["4. Fourth", "5. Fifth", "   - Nested", "", "- [x] Complete", "- [ ] Pending"].join("\n");
    const { container } = render(<Markdown text={text} codeVariant="plain" />);
    expect(container.querySelector("ol")?.start).toBe(4);
    expect(container.querySelector("ol li ul")?.textContent).toContain("Nested");
    const tasks = screen.getAllByRole("checkbox");
    expect(tasks.map((task) => [task.getAttribute("aria-checked"), task.getAttribute("aria-readonly")])).toEqual([["true", "true"], ["false", "true"]]);
    expect(screen.getByRole("checkbox", { name: "Complete" })).not.toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Pending" }));
    expect(screen.getByRole("checkbox", { name: "Pending" }).getAttribute("aria-checked")).toBe("false");
    expect(tasks[0].closest("ul")?.className).toContain("list-none");
  });

  it("keeps each response's footnotes and return links within that response across updates", () => {
    const text = "First reference.[^note]\n\n[^note]: Supporting detail.";
    const { container, rerender } = render(<><Markdown text={text} /><Markdown text={text} /></>);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const roots = container.querySelectorAll('[data-slot="markdown"]');
    for (const root of roots) {
      for (const link of root.querySelectorAll('a[href^="#"]')) {
        const target = document.getElementById(link.getAttribute("href")!.slice(1));
        expect(target).not.toBeNull();
        expect(root.contains(target)).toBe(true);
      }
      const reference = root.querySelector("[data-footnote-ref]");
      expect(root.contains(document.getElementById(reference!.getAttribute("aria-describedby")!))).toBe(true);
    }
    rerender(<><Markdown text={text + "\n\nMore text."} /><Markdown text={text} /></>);
    expect([...container.querySelectorAll("[id]")].map((node) => node.id)).toEqual(ids);
  });

  it("preserves table alignment and complete heading semantics", () => {
    const text = ["# One", "## Two", "### Three", "#### Four", "##### Five", "###### Six", "", "| Left | Right |", "| :--- | ---: |", "| A | 12 |"].join("\n");
    const { container } = render(<Markdown text={text} />);
    expect(screen.getAllByRole("heading").map((heading) => heading.tagName)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6"]);
    expect(screen.getAllByRole("columnheader").map((cell) => cell.style.textAlign)).toEqual(["left", "right"]);
    expect(container.querySelector('[data-slot="table-container"]')).not.toBeNull();
  });

  it("filters unsafe URLs and escapes raw HTML while retaining accessible content images", () => {
    const { container } = render(<Markdown text={'[unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n![Architecture](https://example.com/diagram.png)'} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).not.toMatch(/^javascript:/);
    const image = screen.getByRole("img", { name: "Architecture" });
    expect(image.className).toContain("max-w-full");
    expect(image.getAttribute("loading")).toBe("lazy");
  });

  it("reuses CodeBlock with fence filenames and localized toolbar messages", () => {
    const fence = String.fromCharCode(96).repeat(3);
    render(<Markdown text={[fence + 'ts filename="hooks/example.ts"', 'export const answer = 42;', fence].join("\n")} codeMessages={{ copy: "复制代码" }} />);
    expect(screen.getByTestId("code-block").getAttribute("data-filename")).toBe("hooks/example.ts");
    expect(screen.getByTestId("code-block").getAttribute("aria-label")).toBe("复制代码");
    expect(screen.getByTestId("code-block").textContent).toBe("export const answer = 42;");
  });

  it.each(["python", "c++", "c#"])("keeps the %s fence language independent of a display filename", (language) => {
    const fence = String.fromCharCode(96).repeat(3);
    render(<Markdown text={[fence + language + ' filename="example.txt"', "example", fence].join("\n")} />);
    expect(screen.getByTestId("code-block").getAttribute("data-language")).toBe(language);
    expect(screen.getByTestId("code-block").getAttribute("data-filename")).toBe("example.txt");
  });

  it.each(["txt", "text", "plain", "plaintext"])("renders %s fences as plain text", (language) => {
    const fence = String.fromCharCode(96).repeat(3);
    render(<Markdown text={[fence + language, "unhighlighted text", fence].join("\n")} />);
    expect(screen.getByTestId("code-block").getAttribute("data-language")).toBe("text");
  });

  it("keeps incomplete streaming content visible and localizes footnotes", () => {
    render(<Markdown text={"Partial.[^n]\n\n[^n]: Detail.\n\n- **still arriving"} streaming streamingLabel="正在生成" footnoteLabel="脚注" footnoteBackLabel="返回正文" />);
    expect(screen.getByLabelText("正在生成")).not.toBeNull();
    expect(screen.getByText(/still arriving/)).not.toBeNull();
    expect(screen.getByRole("heading", { name: "脚注" })).not.toBeNull();
    expect(screen.getByLabelText("返回正文")).not.toBeNull();
  });
});

