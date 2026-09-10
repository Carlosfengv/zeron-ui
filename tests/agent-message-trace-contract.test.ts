import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../packages/blocks/src/application/agent-message-trace-01/agent-message-trace.tsx", import.meta.url),
  "utf8"
);
const inspectorSource = readFileSync(
  new URL("../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-inspector.tsx", import.meta.url),
  "utf8"
);
const workspaceSource = readFileSync(
  new URL("../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-workspace.tsx", import.meta.url),
  "utf8"
);
const typesSource = readFileSync(
  new URL("../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-types.ts", import.meta.url),
  "utf8"
);
const indexSource = readFileSync(
  new URL("../packages/blocks/src/application/agent-message-trace-01/index.ts", import.meta.url),
  "utf8"
);
const combinedSource = `${source}\n${inspectorSource}\n${workspaceSource}`;

describe("AgentMessageTrace block contract", () => {
  it("uses project-owned components, icons, and virtual rendering", () => {
    expect(source).toContain('from "@zeron/ui/button"');
    expect(source).toContain('from "@zeron/ui/system/icon-context"');
    expect(source).toContain('from "@tanstack/react-virtual"');
    expect(source).toContain('role="treegrid"');
    expect(source).toContain('data-block="agent-message-trace-01"');
  });

  it("does not introduce a local color or style-variable system", () => {
    expect(combinedSource).not.toMatch(/#[\da-f]{3,8}\b/i);
    expect(combinedSource).not.toMatch(/\brgba?\(/i);
    expect(combinedSource).not.toContain("--trace-");
    expect(source).toContain("badgeColors.violet");
    expect(source).toContain("border-border-subtle");
    expect(source).toContain("var(--brand)");
  });

  it("fills its parent and distributes every column across the available width", () => {
    expect(source).toContain('"flex h-full min-h-0 w-full flex-col text-fg-default"');
    expect(source).toContain('const GRID_BASE_CLASS = "grid w-full"');
    expect(source).toContain("viewportWidth < 640");
    expect(source).not.toContain("min-w-[720px]");
    expect(source).not.toContain("grid-cols-[240px_120px_");
    expect(source).toContain("ResizeObserver");
  });

  it("positions virtual rows from the treegrid origin so the header offset is applied once", () => {
    expect(source).toContain('paddingStart: HEADER_HEIGHT');
    expect(source).toContain('<div className="absolute inset-0" role="rowgroup">');
  });

  it("composes a responsive resizable workspace with a 400px inspector", () => {
    expect(workspaceSource).toContain('from "@zeron/ui/resizable"');
    expect(workspaceSource).toContain('inspectorDefaultSize = "400px"');
    expect(workspaceSource).toContain('inspectorMinSize = "320px"');
    expect(workspaceSource).toContain("HORIZONTAL_BREAKPOINT = 900");
    expect(workspaceSource).toContain("preserve-pixel-size");
    expect(workspaceSource).toContain('className="gap-2"');
    expect(workspaceSource.match(/className="overflow-hidden rounded-xl border-\[0\.5px\] border-border bg-surface-floating"/g)).toHaveLength(2);
  });

  it("uses project detail, tabs, scrolling, and copy components for the inspector", () => {
    expect(inspectorSource).toContain('from "@zeron/ui/detail-list"');
    expect(inspectorSource).toContain('from "@zeron/ui/input-copy"');
    expect(inspectorSource).toContain('from "@zeron/ui/button"');
    expect(inspectorSource).toContain('from "@zeron/ui/scroll-area"');
    expect(inspectorSource).toContain('from "@zeron/ui/tabs"');
    expect(inspectorSource).toContain('from "@zeron/ui/switch"');
    expect(inspectorSource).toContain('checked={payloadMode === "json"}');
    expect(inspectorSource).toContain('onCheckedChange={(checked) => setPayloadMode(checked ? "json" : "pretty")}');
    expect(inspectorSource).not.toContain('variant="segment"');
    expect(inspectorSource).not.toMatch(/<TabItem[^>]*className="[^"]*(?:px-|pl-|pr-|gap-)/);
    expect(inspectorSource).not.toMatch(/<DetailList(?:Item|Label|Value)\s+className=/);
    expect(inspectorSource).not.toContain("dangerouslySetInnerHTML");
    expect(inspectorSource).toContain("<PayloadCopyButton");
    expect(inspectorSource).toContain("<MessageRecord");
    expect(inspectorSource).toContain('system: "settings"');
    expect(inspectorSource).toContain('user: "user"');
    expect(inspectorSource).toContain('assistant: "brain"');
    expect(inspectorSource).toContain("className={traceRecordClassName}");
    expect(inspectorSource).not.toContain('className="w-28 shrink-0"');
    expect(inspectorSource).not.toContain('viewportClassName="bg-surface-floating"');
    expect(inspectorSource).not.toContain('sticky top-0 z-action bg-surface-floating');
  });

  it("publishes a data-only integration contract", () => {
    expect(typesSource).toContain("export interface AgentMessageTraceData");
    expect(typesSource).toContain("export interface AgentMessageTraceSpan");
    expect(typesSource).toContain("export interface AgentMessageTraceMessage");
    expect(indexSource).toContain("type AgentMessageTraceData");
    expect(indexSource).toContain("type AgentMessageTraceSpan");
    expect(indexSource).toContain("type AgentMessageTraceMessage");
  });

  it("does not re-seed an intentionally collapsed tree", () => {
    expect(source).toContain("seededExpansionRef");
    expect(source).not.toContain("valid.length === 0 ? defaultExpandedIds : valid");
  });
});
