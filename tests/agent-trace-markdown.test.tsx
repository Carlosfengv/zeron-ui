import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StreamMarkdown } from "../packages/blocks/src/application/agent-trace-01/markdown-content";

describe("AgentTrace streamed Markdown", () => {
  it("renders common Markdown and GFM structures", () => {
    const html = renderToStaticMarkup(<StreamMarkdown streaming={false} text={`## Implementation

**Entry point** with \`inline code\`:

- Light
- Dark

| Mode | Value |
| --- | --- |
| System | Default |`} />);

    expect(html).toContain("<h2");
    expect(html).toContain("<strong");
    expect(html).toContain("<code");
    expect(html).toContain("<ul");
    expect(html).toContain("<table");
    expect(html).toContain("whitespace-normal");
    expect(html).not.toContain("## Implementation");
    expect(html).not.toContain("**Entry point**");
  });

  it("keeps rendering incomplete Markdown while the response is streaming", () => {
    const html = renderToStaticMarkup(<StreamMarkdown streaming text={"### Result\n\n- **still arriving"} />);

    expect(html).toContain("<h3");
    expect(html).toContain("<ul");
    expect(html).toContain("still arriving");
    expect(html).toContain('aria-label="Streaming response"');
  });

  it("does not render raw HTML from assistant output", () => {
    const html = renderToStaticMarkup(<StreamMarkdown streaming={false} text={'Safe <img src=x onerror="alert(1)"> text'} />);

    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
