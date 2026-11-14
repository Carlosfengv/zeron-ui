import type { AgentRunNode, AgentRunSnapshot, AgentRunStatus, AgentRunTool } from "@zeron/blocks/agent-run-01";

const claude = { opus: "Claude Opus", sonnet: "Claude Sonnet", haiku: "Claude Haiku" };
const github = { id: "github", label: "GitHub", icon: "square-library" } satisfies AgentRunTool;
const linear = { id: "linear", label: "Linear", icon: "list-checks" } satisfies AgentRunTool;
const notion = { id: "notion", label: "Notion", icon: "file-text" } satisfies AgentRunTool;
const vercel = { id: "vercel", label: "Vercel", icon: "rocket" } satisfies AgentRunTool;

export function createAgentRunDemos(zh: boolean) {
  const t = (en: string, cn: string) => zh ? cn : en;
  const idle = t("Waiting for work", "等待分派");
  const makeNode = (id: string, name: string, model: string, tokens: number, limit: number, options?: Partial<AgentRunNode>): AgentRunNode => ({
    id, name, model, status: "idle", summary: idle, usage: { tokens, limit }, ...options,
  });
  const tool = (id: string, name: string, tokens: number, limit: number, icon: AgentRunNode["icon"], assignment: string) =>
    makeNode(id, name, claude.haiku, tokens, limit, { kind: "tool", icon, assignment, summary: t("Idle", "待命") });

  const checkout: AgentRunSnapshot = {
    id: "checkout", title: t("Fix the checkout crash", "修复结账崩溃"),
    root: makeNode("lead", t("Lead", "负责人"), claude.opus, 36000, 200000, {
      status: "working", summary: t("Planning the fix", "制定修复计划"), elapsedSeconds: 3, costUsd: 0.54,
      assignment: t("Fix the checkout crash on empty carts, get it reviewed and merged", "修复空购物车触发的结账崩溃，完成审查并合并"),
      tools: [linear, github], controllable: true, children: [
        makeNode("researcher", t("Researcher", "调查员"), claude.sonnet, 8000, 200000, { colorIndex: 5, tools: [linear, notion],
          assignment: t("Find where the empty cart crashes checkout", "定位空购物车导致结账崩溃的原因"), children: [
            tool("search", t("Web search", "网页搜索"), 1000, 64000, "globe", t("Find matching crash reports", "查找相同的崩溃报告")),
          ],
        }),
        makeNode("coder", t("Coder", "开发者"), claude.sonnet, 12000, 200000, { colorIndex: 2, tools: [github, vercel],
          assignment: t("Patch the checkout crash and open a PR", "修复结账崩溃并提交 PR"), children: [
            tool("lint", t("Linter", "代码检查"), 960, 32000, "list-checks", t("Lint the changed files", "检查变更文件")),
            tool("tests", t("Test runner", "测试执行器"), 3000, 64000, "check-square", t("Run checkout regression tests", "运行结账回归测试")),
          ],
        }),
        makeNode("reviewer", t("Reviewer", "审查员"), claude.opus, 6000, 200000, { colorIndex: 4, tools: [github],
          assignment: t("Review the patch before merge", "合并前审查补丁"), children: [
            tool("docs", t("Docs writer", "文档撰写"), 6000, 128000, "file-text", t("Document the checkout fix", "记录结账修复")),
          ],
        }),
      ],
    }),
  };

  const launch: AgentRunSnapshot = {
    id: "launch", title: t("Write the launch post", "撰写发布文章"),
    root: makeNode("editor", t("Editor", "编辑"), claude.opus, 24000, 200000, {
      status: "working", summary: t("Outlining the post", "拟定文章大纲"), tools: [notion, linear], controllable: true,
      assignment: t("Prepare the launch announcement for publication", "准备发布公告并完成定稿"), children: [
        makeNode("researcher", t("Researcher", "调研员"), claude.sonnet, 8000, 200000, { colorIndex: 5, tools: [linear, github] }),
        makeNode("writer", t("Writer", "撰稿人"), claude.sonnet, 8000, 200000, { colorIndex: 2, tools: [notion], children: [
          tool("facts", t("Fact checker", "事实核查"), 1000, 64000, "check-square", t("Verify product claims in the draft", "核对草稿中的产品描述")),
          tool("seo", "SEO", 640, 32000, "search", t("Review title and metadata", "检查标题与元数据")),
        ] }),
      ],
    }),
  };

  const migration: AgentRunSnapshot = {
    id: "migration", title: t("Migrate to Postgres 17", "迁移到 Postgres 17"),
    root: makeNode("lead", t("Lead", "负责人"), claude.opus, 32000, 200000, {
      status: "working", summary: t("Planning the migration", "制定迁移计划"), tools: [github, vercel], controllable: true,
      assignment: t("Migrate the database with backup and verification", "备份、迁移并验证数据库"), children: [
        makeNode("planner", t("Planner", "计划员"), claude.sonnet, 8000, 200000, { colorIndex: 5, tools: [linear] }),
        makeNode("migrator", t("Migrator", "迁移执行器"), claude.sonnet, 40000, 200000, { colorIndex: 2, tools: [github, vercel], children: [
          tool("backup", t("Backup", "备份"), 3000, 32000, "file-archive", t("Create the database snapshot", "创建数据库快照")),
          tool("verify", t("Verifier", "验证器"), 1000, 64000, "check-square", t("Verify the migrated database", "验证迁移后的数据库")),
        ] }),
        makeNode("monitor", t("Monitor", "监控员"), claude.haiku, 8000, 64000, { colorIndex: 4, tools: [vercel] }),
      ],
    }),
  };

  type Update = readonly [id: string, status: AgentRunStatus, summary: string, tokens: number, seconds: number, cost: number, handoff?: AgentRunNode["handoff"]];
  function timeline(run: AgentRunSnapshot, steps: readonly Update[][]) {
    return steps.reduce<AgentRunSnapshot[]>((frames, updates) => {
      const previous = frames[frames.length - 1];
      function update(node: AgentRunNode): AgentRunNode {
        const entry = updates.find(([id]) => node.id === id);
        const next = { ...node, children: node.children?.map(update) };
        if (entry) {
          const [, status, summary, tokens, elapsedSeconds, costUsd, handoff] = entry;
          Object.assign(next, { status, summary, elapsedSeconds, costUsd, handoff: handoff ?? node.handoff });
          if (node.usage) next.usage = { ...node.usage, tokens };
        }
        return next;
      }
      frames.push({ ...run, root: previous.root && update(previous.root) });
      return frames;
    }, [run]);
  }

  return [
    timeline(checkout, [
      [["lead", "working", t("Delegating", "分派任务"), 44000, 10, 0.66],
        ["researcher", "working", t("Tracing cart.ts", "排查 cart.ts"), 62000, 6, 0.18, { from: t("Lead", "负责人"), summary: t("Trace the empty cart", "排查空购物车") }],
        ["search", "working", t("Searching docs", "搜索文档"), 14000, 2, 0.01]],
      [["search", "done", t("Found 3 matches", "找到 3 条匹配结果"), 26000, 4, 0.02],
        ["researcher", "done", t("Found the cause", "已定位原因"), 104000, 11, 0.31, { from: t("Web search", "网页搜索"), summary: t("3 matching reports", "3 条匹配报告") }],
        ["lead", "working", t("Watching the patch", "跟进补丁"), 58000, 14, 0.87, { from: t("Researcher", "调查员"), summary: t("Root cause confirmed", "已确认根因") }],
        ["coder", "working", t("Writing the patch", "编写补丁"), 87000, 4, 0.26], ["lint", "working", t("Checking 3 files", "检查 3 个文件"), 9800, 1, 0.01]],
      [["lint", "done", t("All clean", "检查通过"), 15000, 2, 0.01], ["tests", "working", t("Running regression tests", "运行回归测试"), 35000, 3, 0.04],
        ["coder", "working", t("Waiting for tests", "等待测试结果"), 132000, 9, 0.4]],
      [["tests", "done", t("All 214 pass", "214 项测试全部通过"), 47000, 6, 0.05],
        ["coder", "done", t("Opened PR #482", "已创建 PR #482"), 172000, 12, 0.52, { from: t("Test runner", "测试执行器"), summary: t("214/214 pass", "214/214 项通过") }],
        ["reviewer", "working", t("Reading the diff", "审查代码差异"), 68000, 4, 1.02, { from: t("Coder", "开发者"), summary: t("Review PR #482", "审查 PR #482") }]],
      [["reviewer", "done", t("Approved PR #482", "已批准 PR #482"), 86000, 9, 1.29],
        ["docs", "working", t("Updating release notes", "更新发布说明"), 20000, 2, 0.02]],
      [["docs", "done", t("Release notes updated", "已更新发布说明"), 28000, 4, 0.03],
        ["lead", "done", t("Merged PR #482", "已合并 PR #482"), 73000, 28, 1.1, { from: t("Reviewer", "审查员"), summary: t("Approved to merge", "已批准合并") }]],
    ]),
    timeline(launch, [
      [["researcher", "working", t("Collecting launch notes", "收集发布资料"), 22000, 4, 0.07]],
      [["researcher", "done", t("Verified the launch brief", "已核对发布简报"), 64000, 8, 0.19],
        ["writer", "working", t("Drafting the announcement", "撰写公告草稿"), 48000, 5, 0.14]],
      [["facts", "working", t("Checking product claims", "核实产品描述"), 13000, 3, 0.02],
        ["seo", "working", t("Reviewing the headline", "检查文章标题"), 12000, 3, 0.02]],
      [["facts", "done", t("Claims verified", "产品描述已核实"), 20000, 5, 0.02], ["seo", "done", t("Metadata ready", "元数据就绪"), 17000, 5, 0.02],
        ["writer", "done", t("Draft submitted", "已提交草稿"), 71000, 14, 0.21], ["editor", "done", t("Post ready to publish", "文章已可发布"), 46000, 21, 0.69]],
    ]),
    timeline(migration, [
      [["planner", "done", t("Plan with 7 steps", "已制定 7 步计划"), 76000, 6, 0.23], ["lead", "working", t("Watching the copy", "跟进数据复制"), 46000, 8, 0.69],
        ["migrator", "working", t("Preparing the copy", "准备复制数据"), 52000, 5, 0.16, { from: t("Lead", "负责人"), summary: t("Start with the backup", "先进行备份") }],
        ["monitor", "working", "p95 · 84 ms", 10000, 4, 0.01], ["backup", "working", t("Snapshot 38%", "快照已完成 38%"), 7000, 3, 0.01]],
      [["backup", "done", t("Snapshot saved", "已保存快照"), 20000, 7, 0.02],
        ["migrator", "working", t("Copying rows", "复制数据行"), 95000, 12, 0.29]],
      [["migrator", "done", t("Copy complete", "数据复制完成"), 124000, 18, 0.37], ["verify", "working", t("Comparing row counts", "核对数据行数"), 36000, 5, 0.04]],
      [["verify", "done", t("All checks passed", "验证全部通过"), 48000, 8, 0.05], ["monitor", "done", t("Latency stable", "延迟稳定"), 18000, 22, 0.02],
        ["lead", "done", t("Migration complete", "迁移完成"), 65000, 27, 0.98]],
    ]),
  ];
}
