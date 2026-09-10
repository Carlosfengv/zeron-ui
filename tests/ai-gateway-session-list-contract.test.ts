import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatSessionLastActive } from "../packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list";
import {
  aiGatewaySessionListDemoQuery,
  createAiGatewaySessionListDemoData,
} from "../packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-demo-data";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list.tsx",
  ),
  "utf8",
);
const types = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-types.ts",
  ),
  "utf8",
);
const demo = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-demo-data.ts",
  ),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"),
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"),
);
const dataTable = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8",
);

describe("AI Gateway Session List 01 contract", () => {
  it("is exported and registered as a React data block", () => {
    expect(packageJson.exports["./ai-gateway-session-list-01"]).toBe(
      "./src/application/ai-gateway-session-list-01/index.ts",
    );
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "ai-gateway-session-list-01",
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["@tanstack/react-table", "tw-animate-css", "@lobehub/icons"],
      registryDependencies: [
        "badge",
        "button",
        "checkbox",
        "data-table",
        "empty",
        "icon-context",
        "inline-notice",
        "input-group",
        "nav-item",
        "nav-menu",
        "page-layout",
        "sidebar",
        "sidebar-identity-row",
        "utils",
      ],
    });
    expect(item.files).toHaveLength(6);
  });

  it("uses PageLayout, the shared AI Gateway sidebar, and the shared DataTable", () => {
    expect(source).toContain("<PageLayout");
    expect(source).toContain("<PageHeader");
    expect(source).toContain("<PageContent>");
    expect(source).toContain('<PageBody className="max-w-none p-3">');
    expect(source).toContain("<DataTable<AiGatewaySessionItem>");
    expect(source).toContain('className="gap-2.5"');
    expect(source).not.toContain("[&_[data-slot=data-table-pagination]]");
    expect(source).toContain(
      'className="flex min-h-control-md min-w-0 flex-wrap items-center justify-between gap-2"',
    );
    expect(source).toContain(
      'className="w-full max-w-md border-border hover:border-border"',
    );
    expect(source.match(/<DataTableFacetedFilter/g)).toHaveLength(3);
    expect(source).toContain("<AiGatewayWorkspaceSidebar");
    expect(source).toContain('resolveAiGatewaySidebarConfig(sidebarProp, "sessions")');
    expect(source).toContain('<SidebarProvider breakpointBehavior="drawer">');
    expect(source).not.toContain("<PageTitle");
    expect(source).not.toContain("<PageDescription");
    expect(source).not.toContain("<AppShell");
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps search, facets, error filtering, pagination, and opening caller-owned", () => {
    expect(types).toContain("query: AiGatewaySessionListQuery");
    expect(types).toContain("onQueryChange?:");
    expect(types).toContain("onSessionOpen?:");
    expect(source).toContain("query.errorsOnly");
    expect(source).toContain("pageIndex: 0");
    expect(source).toContain("actions?.onQueryChange?.");
    expect(source).toContain("manualFiltering: true");
    expect(source).toContain("onColumnFiltersChange:");
    expect(source).toContain("rowCount: total");
    expect(source).toContain("paginationProps={{");
    expect(source).toContain("disabled: !canInteract");
    expect(source).toContain("onPaginationChange: canInteract");
    expect(source).not.toContain("<SessionPagination");
    expect(source).not.toContain("pagination={");
    expect(dataTable).toContain(
      "<DataTablePagination {...paginationProps} table={table} />",
    );
  });

  it("keeps usage values raw and extends the screenshot records with agent sessions", () => {
    expect(types).toContain("inputTokens: number");
    expect(types).toContain("outputTokens: number");
    expect(types).toContain("costMicros: number");
    expect(types).toContain("lastActiveAt: string");
    expect(types).toContain("createdAt: string");
    const dataContract = types.match(
      /export interface AiGatewaySessionListData \{([\s\S]*?)\n\}/,
    )?.[1];
    expect(dataContract).not.toContain("pageIndex: number");
    expect(dataContract).not.toContain("pageSize: number");
    expect(demo.match(/id: "session-ria-/g)).toHaveLength(6);
    expect(demo.match(/id: "session-(workbuddy|codex|claudecode)-/g)).toHaveLength(6);
    expect(demo).toContain('id: "ria-smoke-session-537945"');
    expect(demo).toContain('label: "WorkBuddy"');
    expect(demo).toContain('label: "Codex"');
    expect(demo).toContain('label: "Claude Code"');
    expect(demo).toContain("costMicros: 6_600");
    expect(demo).toContain("inputTokens: 205_300");
    expect(source).toContain("item.inputTokens + item.outputTokens");
    expect(source).toContain("costMicros / 1_000_000");
  });

  it("places last activity under the session and reserves the final column for creation time", () => {
    expect(source).toContain("{formatSessionLastActive(");
    expect(source).toContain("title={absoluteLastActive}");
    expect(source).not.toContain("labels.lastActive");
    expect(source).toContain("const sevenDaysInSeconds = 7 * 24 * 60 * 60");
    expect(source).toContain("seconds < -sevenDaysInSeconds");
    expect(source).toContain('accessorKey: "createdAt"');
    expect(source).toContain("{labels.createdAt}");
    expect(source).not.toContain('accessorKey: "lastActiveAt"');
    expect(demo.match(/createdAt: "/g)).toHaveLength(13);
  });

  it("renders the session identity as plain table text instead of a badge", () => {
    expect(source.match(/<Badge/g)).toHaveLength(1);
    expect(source).toContain('"size-1.5 shrink-0 rounded-full"');
    expect(source).toContain('"bg-fg-danger" : "bg-fg-success"');
    expect(source).toContain('className="min-w-0 truncate font-medium"');
  });

  it("formats recent activity by minute, hour, or day and switches after seven days", () => {
    const reference = "2026-09-10T10:00:00.000Z";
    const format = (value: string) =>
      formatSessionLastActive(value, "en-US", reference, "UTC", "—");

    expect(format("2026-09-10T09:55:00.000Z")).toContain("5 min");
    expect(format("2026-09-10T08:00:00.000Z")).toContain("2 hr");
    expect(format("2026-09-07T10:00:00.000Z")).toContain("3 days");
    expect(format("2026-09-03T10:00:00.000Z")).toContain("7 days");
    expect(format("2026-09-03T09:59:59.000Z")).toBe(
      "2026年 9月3日 09:59:59",
    );
    expect(format(reference)).toBe("now");
    expect(
      formatSessionLastActive(
        "2026-09-01T09:45:00.000Z",
        "en-US",
        reference,
        "UTC",
        "—",
        () => "custom absolute time",
      ),
    ).toBe("custom absolute time");
  });

  it.each(["workbuddy", "codex", "claudecode"])(
    "provides four filterable %s demo sessions",
    (agentId) => {
      const result = createAiGatewaySessionListDemoData({
        ...aiGatewaySessionListDemoQuery,
        agentId,
      });

      expect(result.total).toBe(4);
      expect(result.items).toHaveLength(4);
      expect(result.items.every((item) => item.agent?.id === agentId)).toBe(true);
    },
  );

  it("paginates the demo data with a caller-controlled page size", () => {
    const firstPage = createAiGatewaySessionListDemoData({
      ...aiGatewaySessionListDemoQuery,
      pageSize: 10,
    });
    const secondPage = createAiGatewaySessionListDemoData({
      ...aiGatewaySessionListDemoQuery,
      pageIndex: 1,
      pageSize: 10,
    });

    expect(firstPage.total).toBe(13);
    expect(firstPage.items).toHaveLength(10);
    expect(secondPage.items).toHaveLength(3);
  });

  it("represents missing models without inventing a model entity", () => {
    expect(demo).toContain("model: null");
    expect(source).toContain("model={row.original.model}");
    expect(source).toContain("model?.label ?? noModelCall");
    expect(types).toContain("model: AiGatewaySessionModel | null");
  });

  it("shows a model brand logo before the model label", () => {
    expect(source).toContain(
      'import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color"',
    );
    expect(source).toContain("<DeepSeekColor aria-hidden size={14} />");
    expect(source).toContain('<span className="flex min-w-0 items-center gap-1">');
    expect(source).toContain('const GenericModelIcon = useIcon("brain")');
    expect(source).toContain("renderModelLogo(model)");
    expect(demo).toContain('provider: "deepseek"');
  });

  it("preserves authoritative facet counts and localizes interaction copy", () => {
    expect(source).toContain("count: option.count");
    expect(source).toContain("labels.filteredEmptyTitle");
    expect(source).toContain("labels.loadingMessage");
    expect(source).toContain("labels.sidebarTriggerLabel");
    expect(source).toContain("labels.currentLocationAriaLabel");
    expect(source).toContain('<h1 className="sr-only">{labels.title}</h1>');
    expect(source).toContain("const referenceTime = now ?? data?.generatedAt");
  });
});
