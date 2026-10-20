import type { ToolCallStatus, ToolCallsPart } from "./tool-calls-types";

const hook = `import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
`;
const before = `import { useState } from "react";
import { useResults } from "@/lib/search";

export function Search() {
  const [query, setQuery] = useState("");
  const results = useResults(query);
  return <SearchResults query={query} onQueryChange={setQuery} results={results} />;
}
`;
const after = before.replace('import { useResults }', 'import { useDebouncedValue } from "@/hooks/use-debounced-value";\nimport { useResults }')
  .replace("  const results = useResults(query);", "  const debounced = useDebouncedValue(query, 250);\n  const results = useResults(debounced);");

/** Local fixture only. phase 0–4 investigates, 5 requests approval, 6 runs, 7 finishes. */
export function createToolCallsDemoParts(locale = "en-US", phase = 5, terminal: ToolCallStatus = "completed"): ToolCallsPart[] {
  const zh = locale.startsWith("zh");
  const parts: ToolCallsPart[] = [{ id: "intro", kind: "text", streaming: phase < 2, text: zh ? "我先检查搜索的调用方式。" : "I’ll look at how search runs first." }];
  if (phase < 1) return parts;
  parts.push({ id: "investigation", kind: "tools", summary: zh ? "搜索 1 次，读取 2 个文件" : "Searched once, read 2 files", items: [
    { id: "search", kind: "search", label: zh ? "搜索 useResults" : "Searched for useResults", query: "useResults", status: "completed", durationMs: 900,
      matches: [{ id: "match-1", path: "components/search.tsx", line: 6, preview: "const results = useResults(query);" }, { id: "match-2", path: "lib/search.ts", line: 3, preview: "export function useResults(query: string) {" }] },
    { id: "read-search", kind: "read", label: zh ? "读取 components/search.tsx" : "Read components/search.tsx", status: "completed", durationMs: 700, file: { name: "components/search.tsx", contents: before } },
    { id: "read-hook", kind: "read", label: zh ? "读取 lib/search.ts" : "Read lib/search.ts", status: "completed", durationMs: 600,
      file: { name: "lib/search.ts", contents: 'export function useResults(query: string) {\n  return useQuery({\n    queryKey: ["search", query],\n    queryFn: ({ signal }) => search(query, { signal }),\n    enabled: query.trim().length > 0,\n  });\n}' } },
  ] });
  if (phase < 2) return parts;
  parts.push({ id: "analysis", kind: "text", streaming: phase < 5, text: zh ? "每次输入都会立即触发 useResults 请求。我会对查询值添加 250 ms 防抖，让输入保持流畅，再执行搜索。" : "Every keystroke calls useResults, which fetches right away. I’ll debounce the value by 250 ms so typing stays responsive." });
  if (phase < 3) return parts;
  const items: Extract<ToolCallsPart, { kind: "tools" }>["items"][number][] = [
    { id: "create-hook", kind: "write", label: zh ? "创建 hooks/use-debounced-value.ts" : "Created hooks/use-debounced-value.ts", status: "completed", durationMs: 1300, file: { name: "hooks/use-debounced-value.ts", contents: hook } },
  ];
  if (phase >= 4) items.push({ id: "edit-search", kind: "edit", label: zh ? "修改 components/search.tsx" : "Edited components/search.tsx", status: "completed", durationMs: 1400,
    oldFile: { name: "components/search.tsx", contents: before }, newFile: { name: "components/search.tsx", contents: after } });
  if (phase >= 5) {
    const status = phase === 5 ? "approval-required" : phase === 6 ? "running" : terminal;
    items.push({ id: "test-search", kind: "command", label: zh ? "运行 pnpm test search" : "Run pnpm test search", command: "pnpm test search", cwd: "~/workspace/search-app", status,
      description: zh ? "运行搜索测试，验证防抖、计时器清理与空查询行为。" : "Run the search tests to verify debouncing, timer cleanup and empty queries.",
      durationMs: phase >= 7 && (status === "completed" || status === "failed") ? 1240 : undefined,
      output: phase >= 7 && status === "completed" ? "✓ debounces search requests\n✓ clears the timer on unmount\n✓ skips empty queries\n\n3 tests passed · 1.24 s"
        : phase >= 7 && status === "failed" ? "FAIL search.test.tsx\nExpected 1 request, received 2." : phase === 6 ? "Running search.test.tsx…" : undefined,
      error: status === "failed" ? (zh ? "搜索测试未通过，可重试此工具。" : "Search tests failed. You can retry this tool.") : undefined,
      exitCode: phase >= 7 && (status === "completed" || status === "failed") ? status === "completed" ? 0 : 1 : undefined });
  }
  parts.push({ id: "changes", kind: "tools", defaultExpandedIds: ["test-search"], items });
  if (phase >= 7) parts.push({ id: "result", kind: "text", text: terminal === "completed"
    ? zh ? "已为查询值添加 **250 ms 防抖**，输入更新仍然即时。三个搜索测试均已通过。" : "Added a **250 ms debounce** while keeping input updates immediate. All three search tests pass."
    : terminal === "failed" ? zh ? "文件变更已保留，但测试失败。请展开命令输出查看详情，或重试。" : "The file changes are retained, but tests failed. Inspect the command output or retry."
    : zh ? "已停止命令，本次没有执行测试。文件变更记录仍可查看。" : "The command was stopped without running tests. The file changes remain available to inspect." });
  return parts;
}
