import type {
  AiGatewaySessionItem,
  AiGatewaySessionListData,
  AiGatewaySessionListQuery,
} from "./ai-gateway-session-list-types";

export const aiGatewaySessionListDemoQuery = {
  search: "",
  agentId: null,
  userId: null,
  modelId: null,
  errorsOnly: false,
  pageIndex: 0,
  pageSize: 20,
} as const satisfies AiGatewaySessionListQuery;

const deepseekV4Pro = {
  id: "deepseek-v4-pro",
  label: "deepseek-v4-pro",
  provider: "deepseek",
} as const;

const workbuddyAgent = {
  id: "workbuddy",
  label: "WorkBuddy",
} as const;

const codexAgent = {
  id: "codex",
  label: "Codex",
} as const;

const claudeCodeAgent = {
  id: "claudecode",
  label: "Claude Code",
} as const;

const unsortedDemoItems: readonly AiGatewaySessionItem[] = [
  {
    id: "session-ria-001",
    traceName:
      "你是 Ria，一个桌面 AI 助手。你可以帮助用户完成信息整理、知识检索、文档处理、方案分析，以及在桌面应用中执行任务。",
    outcome: "succeeded",
    agent: workbuddyAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 39_410,
    outputTokens: 1_990,
    costMicros: 10_000,
    lastActiveAt: "2026-09-08T09:42:00.000Z",
    createdAt: "2026-09-08T09:40:00.000Z",
  },
  {
    id: "session-ria-002",
    traceName:
      "你是 Ria，一个桌面 AI 助手。你可以帮助用户完成信息整理、知识检索、文档处理、方案分析，以及在桌面应用中执行任务。",
    outcome: "failed",
    agent: codexAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 205_300,
    outputTokens: 8_600,
    costMicros: 30_000,
    lastActiveAt: "2026-09-08T09:31:00.000Z",
    createdAt: "2026-09-08T09:20:00.000Z",
  },
  {
    id: "session-ria-003",
    traceName:
      "你是 Ria，一个桌面 AI 助手。你可以帮助用户完成信息整理、知识检索、文档处理、方案分析，以及在桌面应用中执行任务。",
    outcome: "succeeded",
    agent: claudeCodeAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 15_200,
    outputTokens: 900,
    costMicros: 6_600,
    lastActiveAt: "2026-09-08T09:18:00.000Z",
    createdAt: "2026-09-08T09:10:00.000Z",
  },
  {
    id: "session-ria-004",
    traceName: "我的桌面上有哪些内容",
    outcome: "succeeded",
    agent: workbuddyAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 35_000,
    outputTokens: 1_400,
    costMicros: 8_500,
    lastActiveAt: "2026-09-08T08:54:00.000Z",
    createdAt: "2026-09-08T08:45:00.000Z",
  },
  {
    id: "session-ria-005",
    traceName:
      "哎呀妈呀，你这干劲儿挺足啊！“整起来”这三个字一出来，我这手里的活儿都带劲了！不过，你这性格可真够急的。",
    outcome: "failed",
    agent: codexAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 14_800,
    outputTokens: 700,
    costMicros: 3_000,
    lastActiveAt: "2026-09-08T08:37:00.000Z",
    createdAt: "2026-09-08T08:30:00.000Z",
  },
  {
    id: "session-ria-006",
    traceName: "你都可以做什么",
    outcome: "succeeded",
    agent: claudeCodeAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 1,
    inputTokens: 14_720,
    outputTokens: 780,
    costMicros: 3_500,
    lastActiveAt: "2026-09-08T08:14:00.000Z",
    createdAt: "2026-09-08T08:00:00.000Z",
  },
  {
    id: "ria-smoke-session-537945",
    traceName: null,
    outcome: "succeeded",
    agent: null,
    user: null,
    model: null,
    customer: null,
    turnCount: 1,
    inputTokens: 2,
    outputTokens: 0,
    costMicros: 0,
    lastActiveAt: "2026-09-08T07:56:00.000Z",
    createdAt: "2026-09-08T07:55:00.000Z",
  },
  {
    id: "session-workbuddy-007",
    traceName: "整理今天的会议纪要并生成待办事项",
    outcome: "succeeded",
    agent: workbuddyAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 4,
    inputTokens: 12_480,
    outputTokens: 1_620,
    costMicros: 4_200,
    lastActiveAt: "2026-09-10T09:55:00.000Z",
    createdAt: "2026-09-10T09:30:00.000Z",
  },
  {
    id: "session-codex-008",
    traceName: "修复 API 网关请求超时并补充回归测试",
    outcome: "succeeded",
    agent: codexAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 8,
    inputTokens: 82_400,
    outputTokens: 6_320,
    costMicros: 18_700,
    lastActiveAt: "2026-09-10T08:00:00.000Z",
    createdAt: "2026-09-10T07:25:00.000Z",
  },
  {
    id: "session-claudecode-009",
    traceName: "分析仓库依赖并输出重构建议",
    outcome: "succeeded",
    agent: claudeCodeAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 6,
    inputTokens: 54_200,
    outputTokens: 4_860,
    costMicros: 12_300,
    lastActiveAt: "2026-09-09T10:00:00.000Z",
    createdAt: "2026-09-09T09:15:00.000Z",
  },
  {
    id: "session-workbuddy-010",
    traceName: "同步日历与邮件中的本周安排",
    outcome: "failed",
    agent: workbuddyAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 3,
    inputTokens: 9_650,
    outputTokens: 420,
    costMicros: 2_100,
    lastActiveAt: "2026-09-07T10:00:00.000Z",
    createdAt: "2026-09-07T09:40:00.000Z",
  },
  {
    id: "session-codex-011",
    traceName: "为 Session 列表补充分页和筛选测试",
    outcome: "succeeded",
    agent: codexAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 5,
    inputTokens: 28_720,
    outputTokens: 3_180,
    costMicros: 7_600,
    lastActiveAt: "2026-09-03T10:00:00.000Z",
    createdAt: "2026-09-03T08:50:00.000Z",
  },
  {
    id: "session-claudecode-012",
    traceName: "审查鉴权中间件的权限边界",
    outcome: "succeeded",
    agent: claudeCodeAgent,
    user: null,
    model: deepseekV4Pro,
    customer: null,
    turnCount: 7,
    inputTokens: 47_900,
    outputTokens: 5_240,
    costMicros: 11_900,
    lastActiveAt: "2026-09-01T09:45:00.000Z",
    createdAt: "2026-09-01T08:30:00.000Z",
  },
];

export const aiGatewaySessionListDemoItems: readonly AiGatewaySessionItem[] = [
  ...unsortedDemoItems,
].sort((left, right) => right.lastActiveAt.localeCompare(left.lastActiveAt));

export const aiGatewaySessionListDemoData = {
  items: aiGatewaySessionListDemoItems,
  total: aiGatewaySessionListDemoItems.length,
  currency: "USD",
  generatedAt: "2026-09-10T10:00:00.000Z",
  facets: {
    agents: [
      {
        ...workbuddyAgent,
        count: 4,
      },
      {
        ...codexAgent,
        count: 4,
      },
      {
        ...claudeCodeAgent,
        count: 4,
      },
    ],
    users: [],
    models: [
      {
        ...deepseekV4Pro,
        count: 12,
      },
    ],
  },
} as const satisfies AiGatewaySessionListData;

export function createAiGatewaySessionListDemoData(
  query: AiGatewaySessionListQuery = aiGatewaySessionListDemoQuery,
): AiGatewaySessionListData {
  const normalizedSearch = query.search.trim().toLocaleLowerCase();
  const filteredItems = aiGatewaySessionListDemoItems.filter((item) => {
    if (
      normalizedSearch &&
      !`${item.id} ${item.traceName ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedSearch)
    ) {
      return false;
    }
    if (query.agentId && item.agent?.id !== query.agentId) return false;
    if (query.userId && item.user?.id !== query.userId) return false;
    if (query.modelId && item.model?.id !== query.modelId) return false;
    if (query.errorsOnly && item.outcome !== "failed") return false;
    return true;
  });
  const start = query.pageIndex * query.pageSize;

  return {
    ...aiGatewaySessionListDemoData,
    items: filteredItems.slice(start, start + query.pageSize),
    total: filteredItems.length,
  };
}
