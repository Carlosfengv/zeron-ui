"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import ChatGLMColor from "@lobehub/icons/es/ChatGLM/components/Color";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import github from "@thesvg/icons/github";
import postgresql from "@thesvg/icons/postgresql";
import slack from "@thesvg/icons/slack";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@zeron/ui/chart";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DetailList, DetailListItem, DetailListLabel, DetailListValue } from "@zeron/ui/detail-list";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { DataTable, DataTableColumnHeader, DataTablePagination, DataTableToolbar, useDataTable } from "@zeron/ui/data-table";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { MenuItem } from "@zeron/ui/menu-item";
import { MetricCard } from "@zeron/ui/metric-card";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageLayout, PageSidebar } from "@zeron/ui/page-layout";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Separator } from "@zeron/ui/separator";
import { SidebarIdentityAvatar } from "@zeron/ui/sidebar-identity-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { TimeRangeHistogram, type TimeRangeHistogramRange, type TimeRangeHistogramSeries } from "@zeron/ui/time-range-histogram";
import { TopNav, TopNavActions, TopNavBrand } from "@zeron/ui/top-nav";
import { Switch } from "@zeron/ui/switch";
import { type IconComponent, useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { personalSettingsDemoData } from "./personal-settings-demo-data";
import type {
  PersonalSettingsActions,
  PersonalSettingsApiKey,
  PersonalSettingsCallLogsData,
  PersonalSettingsCallLogRecord,
  PersonalSettingsCallLogRun,
  PersonalSettingsCredential,
  PersonalSettingsData,
  PersonalSettingsLabels,
  PersonalSettingsLoadingState,
  PersonalSettingsModelService,
  PersonalSettingsModelUsageData,
  PersonalSettingsModelUsageRecord,
  PersonalSettingsOperationState,
  PersonalSettingsPreferences,
  PersonalSettingsProfileAction,
  PersonalSettingsProfile,
  PersonalSettingsStatus,
  PersonalSettingsUsageData,
  PersonalSettingsUsagePeriod,
  PersonalSettingsUsageRank,
  PersonalSettingsView,
} from "./personal-settings-types";

type SettingsView = PersonalSettingsView;
type ServiceStatus = PersonalSettingsStatus;
type ActivityView = "tokens" | "messages";
type UsagePeriod = PersonalSettingsUsagePeriod;
type ModelUsageRange = "day" | "week" | "month";
type CallLogRange = ModelUsageRange | "custom";
type CallLogView = "calls" | "runs";
type CallLogKind = "model" | "mcp";
type CallLogStatus = "success" | "degraded" | "failed";

type UsageRankRowData = PersonalSettingsUsageRank;

const accountBalance = "¥2,840.00";

const credentialBrandIcons = { github, postgresql, slack } as const;

const viewCopy: Record<SettingsView, { title: string; description: string; search?: string }> = {
  models: { title: "模型服务", description: "模型服务为您提供统一、可靠的 AI 模型调用入口。使用一个访问地址和 API 令牌，即可按权限调用可用的对话、文本生成、Embedding、图像生成等模型能力。", search: "搜索模型服务" },
  keys: { title: "API keys", description: "创建、轮换和撤销用于调用 Zentrix API 的访问密钥。" },
  credentials: { title: "凭证管理", description: "管理被模型服务和自动化流程引用的第三方凭证。" },
  profile: { title: "账户", description: "管理你的个人资料、登录信息与已登录设备。" },
  preferences: { title: "偏好设置", description: "配置外观、输入方式、语言与时间格式。" },
  usage: { title: "使用情况", description: "查看当前计费周期内的模型调用、令牌与额度使用情况。" },
  modelUsage: { title: "模型用量", description: "查看通过 API Key 发起的模型调用、消费金额与计费归属。" },
  callLogs: { title: "调用日志", description: "逐次核对模型和 MCP 调用，并按回答查看完整执行链路。" },
};

const usagePeriodOptions: readonly { label: string; value: UsagePeriod }[] = [
  { label: "一小时", value: "hour" },
  { label: "一天", value: "day" },
  { label: "一周", value: "week" },
  { label: "一个月", value: "month" },
];

const usageMetrics: Record<UsagePeriod, readonly { label: string; value: string; change: string; detail: string; positive?: boolean }[]> = {
  hour: [
    { label: "模型调用次数", value: "182", change: "+8%", detail: "较上一小时", positive: true },
    { label: "MCP 调用", value: "68", change: "+4.4%", detail: "较上一小时", positive: true },
    { label: "消息数", value: "6", change: "+20%", detail: "较上一小时", positive: true },
    { label: "累计 Token 数", value: "4.8 K", change: "4.8K", detail: "本小时", positive: undefined },
  ],
  day: [
    { label: "模型调用次数", value: "2,121", change: "+5.6%", detail: "较昨天", positive: true },
    { label: "MCP 调用", value: "734", change: "-1.8%", detail: "较昨天", positive: false },
    { label: "消息数", value: "33", change: "+10%", detail: "较昨天", positive: true },
    { label: "累计 Token 数", value: "56.2 K", change: "56.2K", detail: "今日", positive: undefined },
  ],
  week: [
    { label: "模型调用次数", value: "11,212", change: "+12%", detail: "周环比", positive: true },
    { label: "MCP 调用", value: "4,112", change: "-2.1%", detail: "上周", positive: false },
    { label: "消息数", value: "33", change: "-10%", detail: "上周", positive: false },
    { label: "累计 Token 数", value: "302.8 K", change: "302.8K", detail: "本周", positive: undefined },
  ],
  month: [
    { label: "模型调用次数", value: "47,380", change: "+18.7%", detail: "月环比", positive: true },
    { label: "MCP 调用", value: "16,824", change: "+6.2%", detail: "上月", positive: true },
    { label: "消息数", value: "141", change: "+8.5%", detail: "上月", positive: true },
    { label: "累计 Token 数", value: "1.28 M", change: "1.28M", detail: "本月", positive: undefined },
  ],
};

const usageMetricCardClass = "h-full self-stretch rounded-lg bg-surface-base [&_[data-slot=metric-card-label]]:text-label [&_[data-slot=metric-card-value-row]]:mt-1 [&_[data-slot=metric-card-value-row]>span:first-child]:text-title";

const usageRankData: Record<UsagePeriod, { models: readonly UsageRankRowData[]; mcp: readonly UsageRankRowData[]; topics: readonly UsageRankRowData[] }> = {
  hour: {
    models: [{ label: "DeepSeek", value: "2", fill: "100%", icon: "deepseek" }, { label: "gpt-4o-mini", value: "1", fill: "50%", icon: "openai" }, { label: "GLM-5-Turbo", value: "1", fill: "50%", icon: "glm" }, { label: "GPT-5", value: "1", fill: "50%", icon: "openai" }, { label: "DeepSeek-R1", value: "1", fill: "50%", icon: "deepseek" }],
    mcp: [{ label: "Jira", value: "1", fill: "100%", icon: "jira" }, { label: "GitHub", value: "1", fill: "100%", icon: "tool" }, { label: "Slack", value: "1", fill: "100%", icon: "tool" }, { label: "Postgres", value: "1", fill: "100%", icon: "tool" }, { label: "Notion", value: "1", fill: "100%", icon: "tool" }],
    topics: [{ label: "Onboarding", value: "4", fill: "100%", icon: "message" }, { label: "自我介绍", value: "1", fill: "25%", icon: "message" }, { label: "API 接入", value: "1", fill: "25%", icon: "message" }, { label: "发布检查", value: "1", fill: "25%", icon: "message" }, { label: "数据分析", value: "1", fill: "25%", icon: "message" }],
  },
  day: {
    models: [{ label: "DeepSeek", value: "7", fill: "100%", icon: "deepseek" }, { label: "gpt-4o-mini", value: "2", fill: "29%", icon: "openai" }, { label: "GLM-5-Turbo", value: "2", fill: "29%", icon: "glm" }, { label: "GPT-5", value: "1", fill: "14%", icon: "openai" }, { label: "DeepSeek-R1", value: "1", fill: "14%", icon: "deepseek" }],
    mcp: [{ label: "Jira", value: "3", fill: "100%", icon: "jira" }, { label: "GitHub", value: "2", fill: "67%", icon: "tool" }, { label: "Slack", value: "2", fill: "67%", icon: "tool" }, { label: "Postgres", value: "1", fill: "33%", icon: "tool" }, { label: "Notion", value: "1", fill: "33%", icon: "tool" }],
    topics: [{ label: "Onboarding", value: "15", fill: "100%", icon: "message" }, { label: "API 接入", value: "7", fill: "47%", icon: "message" }, { label: "发布检查", value: "5", fill: "33%", icon: "message" }, { label: "自我介绍", value: "4", fill: "27%", icon: "message" }, { label: "数据分析", value: "3", fill: "20%", icon: "message" }],
  },
  week: {
    models: [{ label: "DeepSeek", value: "11", fill: "100%", icon: "deepseek" }, { label: "GLM-5-Turbo", value: "5", fill: "45%", icon: "glm" }, { label: "gpt-4o-mini", value: "2", fill: "18%", icon: "openai" }, { label: "GPT-5", value: "2", fill: "18%", icon: "openai" }, { label: "DeepSeek-R1", value: "1", fill: "9%", icon: "deepseek" }],
    mcp: [{ label: "Jira", value: "2", fill: "100%", icon: "jira" }, { label: "GitHub", value: "2", fill: "100%", icon: "tool" }, { label: "Slack", value: "1", fill: "50%", icon: "tool" }, { label: "Postgres", value: "1", fill: "50%", icon: "tool" }, { label: "Notion", value: "1", fill: "50%", icon: "tool" }],
    topics: [{ label: "Onboarding", value: "24", fill: "100%", icon: "message" }, { label: "API 接入", value: "11", fill: "46%", icon: "message" }, { label: "发布检查", value: "7", fill: "29%", icon: "message" }, { label: "数据分析", value: "5", fill: "21%", icon: "message" }, { label: "自我介绍", value: "4", fill: "17%", icon: "message" }],
  },
  month: {
    models: [{ label: "DeepSeek", value: "42", fill: "100%", icon: "deepseek" }, { label: "GLM-5-Turbo", value: "19", fill: "45%", icon: "glm" }, { label: "GPT-5", value: "13", fill: "31%", icon: "openai" }, { label: "gpt-4o-mini", value: "10", fill: "24%", icon: "openai" }, { label: "DeepSeek-R1", value: "8", fill: "19%", icon: "deepseek" }],
    mcp: [{ label: "Jira", value: "8", fill: "100%", icon: "jira" }, { label: "GitHub", value: "7", fill: "88%", icon: "tool" }, { label: "Slack", value: "5", fill: "63%", icon: "tool" }, { label: "Postgres", value: "4", fill: "50%", icon: "tool" }, { label: "Notion", value: "3", fill: "38%", icon: "tool" }],
    topics: [{ label: "Onboarding", value: "93", fill: "100%", icon: "message" }, { label: "API 接入", value: "48", fill: "52%", icon: "message" }, { label: "发布检查", value: "31", fill: "33%", icon: "message" }, { label: "数据分析", value: "24", fill: "26%", icon: "message" }, { label: "自我介绍", value: "18", fill: "19%", icon: "message" }],
  },
};

const usageMonths = ["六月", "七月", "八月", "九月", "十月", "十一月", "十二月", "一月", "二月", "三月", "四月", "五月"] as const;
const tokenHeatmapActivity: Record<string, 1 | 2 | 3> = {
  "0-1-4": 1, "0-3-1": 2, "1-0-2": 1, "1-3-5": 1, "2-2-3": 3, "3-0-5": 1, "5-1-2": 2, "5-3-3": 1, "6-2-5": 1, "8-1-4": 1, "9-2-2": 2, "10-0-5": 1, "10-3-4": 2, "11-1-1": 1, "11-3-5": 3,
};

const messageHeatmapActivity: Record<string, 1 | 2 | 3> = {
  "0-0-2": 1, "0-2-5": 2, "1-1-3": 1, "1-3-0": 3, "2-0-4": 2, "3-2-1": 1, "4-1-5": 2, "5-0-3": 3, "6-2-4": 1, "7-3-2": 2, "8-0-5": 1, "9-1-0": 3, "10-2-3": 2, "11-0-1": 1, "11-3-4": 2,
};

const usageSummaries = [
  { value: "2,121", label: "LLM 调用次数" },
  { value: "17.4K", label: "今日 Token 消耗" },
  { value: "171.4 M", label: "当月 Token 消耗" },
  { value: "311.1 M", label: "总计" },
] as const;

const defaultUsageData: PersonalSettingsUsageData = {
  greeting: "👋 你好 Carlos，这是你与 Zentrix 一起记录协作的第 466 天",
  metricsByPeriod: usageMetrics,
  ranksByPeriod: usageRankData,
  months: usageMonths,
  tokenHeatmapActivity,
  messageHeatmapActivity,
  summaries: usageSummaries,
};

const modelUsageRangeOptions: readonly { label: string; value: ModelUsageRange }[] = [
  { label: "今天", value: "day" },
  { label: "最近 7 天", value: "week" },
  { label: "本月", value: "month" },
];

const spendChartConfig = {
  amount: { label: "消费金额", color: "var(--brand)" },
} satisfies ChartConfig;

const callLogTrendSeries = [
  { dataKey: "model", label: "模型", color: "light-dark(var(--brand-active), var(--brand))", inactiveColor: "light-dark(var(--surface-raised), var(--surface-base))" },
  { dataKey: "mcp", label: "MCP", color: "light-dark(var(--brand), var(--brand-active))", inactiveColor: "light-dark(var(--surface-base), var(--surface-raised))" },
] satisfies readonly TimeRangeHistogramSeries[];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CALL_LOG_TIMELINE_BUCKETS = 60;
const callLogLatestTimestamp = Date.parse("2026-08-21T10:32:18+08:00");
const callLogContextStart = callLogLatestTimestamp - CALL_LOG_TIMELINE_BUCKETS * DAY_IN_MS;
const callLogDateFormatter = new Intl.DateTimeFormat("zh-CN", { day: "numeric", month: "numeric", timeZone: "Asia/Shanghai" });
const callLogDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", { day: "numeric", hour: "2-digit", minute: "2-digit", month: "numeric", timeZone: "Asia/Shanghai" });

const attributionChartConfig = {
  amount: { label: "消费金额", color: "var(--brand)" },
} satisfies ChartConfig;

const attributionChartColors = ["var(--brand)", "var(--info-border)", "var(--success-border)", "var(--neutral)"] as const;

const modelUsageRecords = [
  { id: "usage-01", date: "2026-08-19", apiKey: "prod-••C4hA", service: "默认模型服务", model: "gpt-4.1", attribution: "产品研发部", calls: 3950, inputTokens: 11.2, cachedTokens: 2.1, outputTokens: 3.0, amount: 404.32 },
  { id: "usage-02", date: "2026-08-18", apiKey: "agent-••G5dT", service: "DeepSeek Production", model: "DeepSeek-v4-pro", attribution: "智能客服项目", calls: 2402, inputTokens: 8.9, cachedTokens: 1.4, outputTokens: 2.4, amount: 220.88 },
  { id: "usage-03", date: "2026-08-17", apiKey: "prod-••C4hA", service: "GLM 模型组", model: "GLM-5-Turbo", attribution: "产品研发部", calls: 1879, inputTokens: 5.4, cachedTokens: 0.8, outputTokens: 2.3, amount: 73.28 },
  { id: "usage-04", date: "2026-08-15", apiKey: "support-••S8pJ", service: "默认模型服务", model: "gpt-4.1", attribution: "智能客服项目", calls: 1456, inputTokens: 4.1, cachedTokens: 0.6, outputTokens: 1.2, amount: 147.64 },
  { id: "usage-05", date: "2026-08-11", apiKey: "staging-••R7vE", service: "DeepSeek Production", model: "DeepSeek-v4-flash", attribution: "平台工程部", calls: 1290, inputTokens: 3.8, cachedTokens: 0.4, outputTokens: 0.9, amount: 44.52 },
  { id: "usage-06", date: "2026-08-06", apiKey: "analytics-••A9kL", service: "默认模型服务", model: "gpt-4.1", attribution: "产品研发部", calls: 894, inputTokens: 2.7, cachedTokens: 0.3, outputTokens: 0.7, amount: 89.64 },
  { id: "usage-07", date: "2026-08-03", apiKey: "dev-••M2pQ", service: "GLM 模型组", model: "GLM-5-Turbo", attribution: "平台工程部", calls: 612, inputTokens: 1.9, cachedTokens: 0.1, outputTokens: 0.5, amount: 21.76 },
] as const;

const defaultModelUsageData: PersonalSettingsModelUsageData = {
  accountBalance,
  records: modelUsageRecords,
};

type ModelUsageRecord = PersonalSettingsModelUsageRecord;

type CallLogRecord = PersonalSettingsCallLogRecord;
type CallLogRun = PersonalSettingsCallLogRun;

const callLogTimeFormatter = new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit", month: "2-digit", second: "2-digit", timeZone: "Asia/Shanghai" });

function formatCallLogTime(timestamp: number) {
  const parts = Object.fromEntries(callLogTimeFormatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
  return `${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

const callLogMockScenarios = [
  { prompt: "根据销售数据生成日报并同步到项目群", planning: "理解销售分析目标并制定查询计划", tool: "postgres / query_sales", toolService: "Postgres Readonly", toolSummary: "查询当日销售汇总数据", operation: "只读" as const, final: "整合销售数据并生成日报", attribution: "产品研发部", apiKey: "prod-••C4hA", model: "GPT-5", modelService: "OpenAI Gateway" },
  { prompt: "检查发布分支状态并整理变更内容", planning: "拆解发布检查步骤并确定检索范围", tool: "github / search_code", toolService: "GitHub App", toolSummary: "检索发布分支中的变更文件", operation: "只读" as const, final: "归纳发布状态与关键变更", attribution: "智能客服项目", apiKey: "agent-••G5dT", model: "GPT-5", modelService: "OpenAI Gateway" },
  { prompt: "分析服务日志并定位异常原因", planning: "识别日志时间窗与异常分析维度", tool: "postgres / query_logs", toolService: "Analytics Warehouse", toolSummary: "读取服务错误日志与指标", operation: "只读" as const, final: "总结异常原因并给出处理建议", attribution: "平台工程部", apiKey: "staging-••R7vE", model: "DeepSeek-v4-pro", modelService: "DeepSeek Production" },
  { prompt: "生成客户分析摘要并发送给协作群", planning: "整理客户分析维度与输出结构", tool: "slack / send_message", toolService: "Slack workspace", toolSummary: "发送客户分析摘要", operation: "外部写入" as const, final: "确认摘要内容与发送结果", attribution: "市场项目", apiKey: "webhook-••W8sN", model: "gpt-4.1", modelService: "默认模型服务" },
] as const;

function buildCallLogMockData() {
  const records: CallLogRecord[] = [];
  const runs: CallLogRun[] = [];
  for (let dayIndex = 0; dayIndex < CALL_LOG_TIMELINE_BUCKETS; dayIndex += 1) {
    const runCount = dayIndex === CALL_LOG_TIMELINE_BUCKETS - 1 ? 3 : dayIndex % 4 === 0 ? 2 : 1;
    for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
      const scenario = callLogMockScenarios[(dayIndex + runIndex) % callLogMockScenarios.length];
      const status: CallLogStatus = dayIndex === CALL_LOG_TIMELINE_BUCKETS - 1 ? (["success", "degraded", "failed"] as const)[runIndex] : (dayIndex + runIndex * 7) % 19 === 0 ? "failed" : (dayIndex + runIndex * 5) % 11 === 0 ? "degraded" : "success";
      const runTimestamp = callLogContextStart + dayIndex * DAY_IN_MS + (14 + runIndex * 2) * 60 * 60 * 1000 + (dayIndex * 13 % 40) * 60 * 1000;
      const runId = `run_${String(dayIndex + 1).padStart(2, "0")}_${runIndex + 1}`;
      const requestedModel = status === "degraded" ? "GPT-5" : scenario.model;
      const actualModel = status === "degraded" ? "gpt-4.1" : scenario.model;
      const modelService = status === "degraded" ? "默认模型服务" : scenario.modelService;
      const callBlueprints = [
        { kind: "model" as const, timestamp: runTimestamp, status: status === "degraded" ? "degraded" as const : "success" as const, code: status === "degraded" ? "FALLBACK" : "200", requested: requestedModel, actual: actualModel, service: modelService, summary: scenario.planning, tokens: 3200 + dayIndex * 37 + runIndex * 211, durationMs: 2600 + dayIndex % 7 * 170, amount: 0.018 + (dayIndex % 6) * 0.003, detail: status === "degraded" ? "请求模型超时，重试后降级至 gpt-4.1" : "请求模型与实际模型一致" },
        { kind: "mcp" as const, timestamp: runTimestamp + 90_000, status: status === "failed" ? "failed" as const : "success" as const, code: status === "failed" ? "403" : "200", requested: scenario.tool, actual: scenario.tool, service: scenario.toolService, summary: scenario.toolSummary, durationMs: 900 + dayIndex % 5 * 210, operation: scenario.operation, detail: status === "failed" ? "MCP_PERMISSION_DENIED · 当前凭证无权执行该操作" : scenario.operation === "外部写入" ? "外部写入已完成" : `返回 ${12 + dayIndex % 24} 行结果` },
        { kind: "model" as const, timestamp: runTimestamp + 180_000, status: status === "failed" ? "failed" as const : "success" as const, code: status === "failed" ? "424" : "200", requested: actualModel, actual: actualModel, service: modelService, summary: scenario.final, tokens: 2100 + dayIndex * 29 + runIndex * 173, durationMs: 2100 + dayIndex % 6 * 190, amount: 0.012 + (dayIndex % 5) * 0.002, detail: status === "failed" ? "上游 MCP 调用失败，未生成最终回答" : "最终回答已生成" },
      ];
      const runRecords = callBlueprints.map((call, callIndex): CallLogRecord => ({
        ...call,
        id: `call-${call.kind}-${String(dayIndex + 1).padStart(2, "0")}-${runIndex + 1}-${callIndex + 1}`,
        time: formatCallLogTime(call.timestamp),
        attribution: scenario.attribution,
        apiKey: scenario.apiKey,
        firstTokenMs: call.kind === "model" ? 420 + dayIndex % 8 * 55 : undefined,
        runId,
        upstreamId: `${call.kind === "model" ? "req" : "mcp"}_${String(dayIndex + 1).padStart(2, "0")}_${runIndex + 1}_${callIndex + 1}`,
      }));
      records.push(...runRecords);
      runs.push({
        id: runId,
        timestamp: runTimestamp,
        time: formatCallLogTime(runTimestamp),
        status,
        prompt: scenario.prompt,
        modelCalls: runRecords.filter((record) => record.kind === "model").length,
        mcpCalls: runRecords.filter((record) => record.kind === "mcp").length,
        tokens: runRecords.reduce((total, record) => total + (record.tokens ?? 0), 0),
        durationMs: runRecords.reduce((total, record) => total + record.durationMs, 0),
        amount: runRecords.reduce((total, record) => total + (record.amount ?? 0), 0),
        detail: status === "failed" ? "MCP 调用失败，未生成最终回答" : status === "degraded" ? "发生 1 次模型降级，最终回答已完成" : "回答链路执行成功",
      });
    }
  }
  return {
    records: records.sort((a, b) => b.timestamp - a.timestamp),
    runs: runs.sort((a, b) => b.timestamp - a.timestamp),
  };
}

const callLogMockData = buildCallLogMockData();
const callLogRecords: readonly CallLogRecord[] = callLogMockData.records;
const callLogRuns: readonly CallLogRun[] = callLogMockData.runs;
const defaultCallLogsData: PersonalSettingsCallLogsData = { records: callLogRecords, runs: callLogRuns };
function aggregateCallLogTrend(records: readonly CallLogRecord[], contextStart: number) {
  return Array.from({ length: CALL_LOG_TIMELINE_BUCKETS }, (_, index) => {
    const start = contextStart + index * DAY_IN_MS;
    const end = start + DAY_IN_MS;
    const bucketRecords = records.filter((record) => record.timestamp >= start && record.timestamp < end);
    return {
      end,
      label: callLogDateFormatter.format(end),
      start,
      model: bucketRecords.filter((record) => record.kind === "model").length,
      mcp: bucketRecords.filter((record) => record.kind === "mcp").length,
    };
  });
}

function callLogQuickSelectionsFor(latestTimestamp: number): Record<ModelUsageRange, TimeRangeHistogramRange & { label: string }> {
  return {
    day: { end: latestTimestamp, label: "最近 24 小时", start: latestTimestamp - DAY_IN_MS },
    week: { end: latestTimestamp, label: "最近 7 天", start: latestTimestamp - 7 * DAY_IN_MS },
    month: { end: latestTimestamp, label: "最近 30 天", start: latestTimestamp - 30 * DAY_IN_MS },
  };
}

function isCallLogTimeInSelection(timestamp: number, selection: TimeRangeHistogramRange) {
  return timestamp <= selection.end && timestamp >= selection.start;
}

const callLogStatusCopy: Record<CallLogStatus, { label: string }> = {
  success: { label: "成功" },
  degraded: { label: "已降级" },
  failed: { label: "失败" },
};

export interface PersonalSettingsProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The first settings page rendered by the block. */
  defaultView?: SettingsView;
  /** Controlled settings destination. Pair with onViewChange. */
  view?: SettingsView;
  onViewChange?: (view: SettingsView) => void;
  /** Keeps all non-current sidebar destinations visible but unavailable. */
  lockedNavigation?: boolean;
  /** Destinations that remain available when navigation is locked. */
  enabledViews?: readonly SettingsView[];
  /** Replace the resource-management demo data with product data. */
  data?: PersonalSettingsData;
  /** Business operations. Controls without a corresponding handler are hidden. */
  actions?: PersonalSettingsActions;
  /** Pending and error state are owned by the product integration. */
  operationState?: PersonalSettingsOperationState;
  /** Loading states for externally fetched settings data. */
  loading?: PersonalSettingsLoadingState;
  /** Brand and account content can be supplied without coupling to an app shell. */
  brand?: ReactNode;
  account?: ReactNode;
  labels?: PersonalSettingsLabels;
}

function ProviderMark({ provider }: { provider: PersonalSettingsModelService["provider"] }) {
  const Icon = provider === "deepseek" ? DeepSeekColor : provider === "openai" ? OpenAIMono : ChatGLMColor;
  return <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-hover"><Icon size={24} /></span>;
}

function ModelLogo({ model, size = 14 }: { model: string; size?: number }) {
  const Icon = model.toLowerCase().startsWith("gpt") ? OpenAIMono : model.toLowerCase().startsWith("deepseek") ? DeepSeekColor : ChatGLMColor;
  return <Icon aria-hidden size={size} />;
}

function ModelBadge({ model }: { model: string }) {
  return <Badge color="gray" size="sm"><span className="flex items-center gap-1"><ModelLogo model={model} /><span>{model}</span></span></Badge>;
}

function CredentialName({ credential }: { credential: PersonalSettingsCredential }) {
  return <div className="flex min-w-0 items-center gap-2"><span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border bg-hover [&>svg]:block [&>svg]:size-5" dangerouslySetInnerHTML={{ __html: credentialBrandIcons[credential.brand].svg }} /><span className="truncate font-medium text-fg-default">{credential.name}</span></div>;
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const color = status === "正常" ? "blue" : status === "已用尽" ? "orange" : "red";
  return <Badge color={color} size="sm">{status}</Badge>;
}

function EmptyRows({ children }: { children: string }) {
  return <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border bg-surface-raised px-4 text-body text-fg-muted">{children}</div>;
}

function RowActions<Action extends string>({ items, label, onAction, pending = false }: { items: readonly Action[]; label: string; onAction?: (action: Action) => void; pending?: boolean }) {
  const MoreIcon = useIcon("ellipsis");
  if (!onAction) return null;
  return <DropdownMenu><DropdownTrigger render={<Button aria-label={`${label} 的操作`} disabled={pending} type="button" variant="ghost" iconOnly><MoreIcon aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-32">{items.map((item, index) => <MenuItem index={index} key={item} label={item} onSelect={() => onAction(item)} />)}</DropdownContent></DropdownMenu>;
}

/** Personal account settings with model services, API keys, credentials, profile, and usage pages. */
export function PersonalSettings({ account, actions, brand, className, data, defaultView = "keys", enabledViews, labels, loading, lockedNavigation = false, onViewChange, operationState, view: controlledView, ...props }: PersonalSettingsProps) {
  const SearchIcon = useIcon("search");
  const ChevronDown = useIcon("chevron-down");
  const PlusIcon = useIcon("plus");
  const CopyIcon = useIcon("copy");
  const BrainIcon = useIcon("brain");
  const LockIcon = useIcon("lock");
  const ShieldIcon = useIcon("shield");
  const UserIcon = useIcon("user");
  const SettingsIcon = useIcon("settings");
  const ClockIcon = useIcon("clock");
  const LibraryIcon = useIcon("square-library");
  const CallLogsIcon = useIcon("list");
  const [uncontrolledView, setUncontrolledView] = useState<SettingsView>(defaultView);
  const [query, setQuery] = useState("");
  const view = controlledView ?? uncontrolledView;
  const resourceData = {
    apiKeys: data?.apiKeys ?? personalSettingsDemoData.apiKeys,
    credentials: data?.credentials ?? personalSettingsDemoData.credentials,
    modelServices: data?.modelServices ?? personalSettingsDemoData.modelServices,
    profile: data?.profile ?? personalSettingsDemoData.profile,
  };
  const copy = { ...viewCopy[view], ...labels?.views?.[view] };
  const normalizedQuery = query.trim().toLowerCase();
  const services = useMemo(() => resourceData.modelServices.filter((service) => !normalizedQuery || `${service.name} ${service.endpoint} ${service.models.join(" ")}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, resourceData.modelServices]);
  const setSettingsView = (nextView: SettingsView) => {
    if (controlledView === undefined) setUncontrolledView(nextView);
    onViewChange?.(nextView);
    setQuery("");
  };

  return (
    <AppShell layout="stacked" className={cn("@container h-full min-h-[46rem] overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-base", className)} {...props}>
      <AppShellHeader className="static bg-surface-base">
          <TopNav navigationAlign="left">
          <TopNavBrand className="gap-3 text-fg-default">{brand ?? <><strong className="text-heading font-bold leading-none">Zentrix</strong><span className="text-body font-medium">个人设置</span></>}</TopNavBrand>
          <TopNavActions>{account ?? <Button type="button" variant="ghost" trailingIcon={ChevronDown}><span className="flex items-center gap-2"><SidebarIdentityAvatar>{resourceData.profile.avatarLabel ?? resourceData.profile.displayName.slice(0, 1)}</SidebarIdentityAvatar><span>{resourceData.profile.displayName}</span></span></Button>}</TopNavActions>
        </TopNav>
      </AppShellHeader>

      <AppShellMain landmark={false} className="min-h-0 overflow-hidden">
        <PageLayout size="full" className="h-full pt-0">
          <PageSidebar aria-label="个人设置导航" className="p-3">
            <SettingsNavGroup activeView={view} enabledViews={lockedNavigation ? enabledViews ?? [view] : undefined} disabledViews={lockedNavigation ? [] : ["models"]} label={labels?.resourceNavigation ?? "资源"} items={[{ value: "models", label: labels?.navigation?.models ?? "模型服务", icon: BrainIcon }, { value: "keys", label: labels?.navigation?.keys ?? "API keys", icon: LockIcon }, { value: "credentials", label: labels?.navigation?.credentials ?? "凭证管理", icon: ShieldIcon }]} onChange={setSettingsView} />
            <SettingsNavGroup activeView={view} className="mt-5" enabledViews={lockedNavigation ? enabledViews ?? [view] : undefined} disabledViews={lockedNavigation ? [] : ["usage", "modelUsage", "callLogs"]} label={labels?.personalNavigation ?? "个人设置"} items={[{ value: "profile", label: labels?.navigation?.profile ?? "个人资料", icon: UserIcon }, { value: "preferences", label: labels?.navigation?.preferences ?? "偏好设置", icon: SettingsIcon }, { value: "usage", label: labels?.navigation?.usage ?? "使用情况", icon: ClockIcon }, { value: "modelUsage", label: labels?.navigation?.modelUsage ?? "模型用量", icon: LibraryIcon }, { value: "callLogs", label: labels?.navigation?.callLogs ?? "调用日志", icon: CallLogsIcon }]} onChange={setSettingsView} />
          </PageSidebar>
          <PageContent className="overflow-y-auto overscroll-contain">
            <PageBody className="flex-none overflow-visible p-4 sm:p-6">
              <section className="mx-auto w-full max-w-[960px]">
                {operationState?.error && <InlineNotice className="mb-4" tone="danger" variant="emphasized"><InlineNoticeContent>{operationState.error}</InlineNoticeContent></InlineNotice>}
                {view === "callLogs" ? loading?.callLogs ? <EmptyRows>正在加载调用日志…</EmptyRows> : <CallLogsSettings data={data?.callLogs ?? defaultCallLogsData} /> : view === "modelUsage" ? loading?.modelUsage ? <EmptyRows>正在加载模型用量…</EmptyRows> : <ModelUsageSettings apiKeys={resourceData.apiKeys} data={data?.modelUsage ?? defaultModelUsageData} modelServices={resourceData.modelServices} /> : view === "usage" ? loading?.usage ? <EmptyRows>正在加载使用情况…</EmptyRows> : <UsageSettings data={data?.usage ?? defaultUsageData} /> : <><header className="max-w-3xl"><h1 className="text-title font-semibold text-fg-default">{copy.title}</h1><p className="mt-1 text-label leading-5 text-fg-muted">{copy.description}</p></header>
                <div className="mt-4">{view === "models" ? <div className="flex flex-col gap-2.5"><InputGroup className="w-full max-w-[450px] border-border hover:border-border" size="md"><InputGroupAddon className="pr-2"><SearchIcon aria-hidden size={16} strokeWidth={1.5} /></InputGroupAddon><InputGroupInput aria-label={copy.search} className="h-full min-h-0" onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} value={query} /></InputGroup>{loading?.models ? <EmptyRows>正在加载模型服务…</EmptyRows> : <ModelServicesTable actions={actions} pending={operationState?.pending} services={services} />}</div> : view === "keys" ? loading?.keys ? <EmptyRows>正在加载 API key…</EmptyRows> : <ApiKeysTable actions={actions} apiKeys={resourceData.apiKeys} copyIcon={CopyIcon} pending={operationState?.pending} plusIcon={PlusIcon} /> : view === "credentials" ? loading?.credentials ? <EmptyRows>正在加载凭证…</EmptyRows> : <CredentialsTable actions={actions} credentials={resourceData.credentials} pending={operationState?.pending} plusIcon={PlusIcon} /> : view === "preferences" ? loading?.preferences ? <EmptyRows>正在加载偏好设置…</EmptyRows> : <PreferencesSettings actions={actions} preferences={data?.preferences ?? defaultPreferences} /> : loading?.profile ? <EmptyRows>正在加载个人资料…</EmptyRows> : <ProfileSettings actions={actions} pending={operationState?.pending} profile={resourceData.profile} />}</div></>}
              </section>
            </PageBody>
          </PageContent>
        </PageLayout>
      </AppShellMain>
    </AppShell>
  );
}

function SettingsNavGroup({ activeView, className, disabledViews = [], enabledViews, items, label, onChange }: { activeView: SettingsView; className?: string; disabledViews?: readonly SettingsView[]; enabledViews?: readonly SettingsView[]; items: readonly { value: SettingsView; label: string; icon: IconComponent }[]; label: string; onChange: (view: SettingsView) => void }) {
  return <section className={className}><p className="px-2 text-label text-fg-subtle">{label}</p><NavMenu as="div" activeValue={activeView} aria-label={label} className="mt-1" keyboardNavigation="roving">{items.map((item) => <NavItem disabled={enabledViews ? !enabledViews.includes(item.value) : disabledViews.includes(item.value)} key={item.value} value={item.value}><NavItemTrigger href={`#${item.value}`} onClick={(event) => { event.preventDefault(); onChange(item.value); }}><NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><item.icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>)}</NavMenu></section>;
}

function isPending(pending: readonly string[] | undefined, key: string) {
  return pending?.includes(key) ?? false;
}

function ModelServicesTable({ actions, pending, services }: { actions?: PersonalSettingsActions; pending?: readonly string[]; services: readonly PersonalSettingsModelService[] }) {
  if (!services.length) return <EmptyRows>没有找到匹配的模型服务。</EmptyRows>;
  return <div className="overflow-x-auto rounded-lg border-[0.5px] border-border"><Table className="min-w-[840px]"><TableHeader><TableRow><TableHead className="w-[32%]">名称</TableHead><TableHead>可用模型</TableHead><TableHead className="w-28">状态</TableHead><TableHead className="w-28">用量&配额</TableHead>{actions?.onModelServiceAction && <TableHead className="w-16 text-right"><span className="sr-only">操作</span></TableHead>}</TableRow></TableHeader><TableBody>{services.map((service, index) => { const visibleModels = service.models.slice(0, 2); const hiddenModels = service.models.slice(2); return <TableRow index={index} key={service.id}><TableCell><div className="flex items-center gap-2.5"><ProviderMark provider={service.provider} /><div className="min-w-0"><p className="truncate font-medium text-fg-default">{service.name}</p><p className="truncate text-label text-fg-muted">{service.endpoint}</p></div></div></TableCell><TableCell><div className="flex flex-wrap items-center gap-1">{visibleModels.map((model) => <ModelBadge key={model} model={model} />)}{hiddenModels.length > 0 && <DropdownMenu><DropdownTrigger render={<Button type="button" size="sm" variant="ghost" className="h-6 px-1.5 text-label">+{hiddenModels.length}</Button>} /><DropdownContent align="start" className="w-56 p-1">{hiddenModels.map((model) => <div className="flex h-control-md items-center gap-2 rounded-lg px-2 text-body text-fg-default" key={model}><ModelLogo model={model} size={16} /><span>{model}</span></div>)}</DropdownContent></DropdownMenu>}</div></TableCell><TableCell><StatusBadge status={service.status} /></TableCell><TableCell className="tabular-nums text-fg-muted">{service.usage}</TableCell>{actions?.onModelServiceAction && <TableCell><div className="flex justify-end"><RowActions label={service.name} items={["edit", "remove"] as const} onAction={(action) => actions.onModelServiceAction?.(service, action)} pending={isPending(pending, `model-service:${service.id}`)} /></div></TableCell>}</TableRow>; })}</TableBody></Table></div>;
}

function ApiKeysTable({ actions, apiKeys, copyIcon: CopyIcon, pending, plusIcon: PlusIcon }: { actions?: PersonalSettingsActions; apiKeys: readonly PersonalSettingsApiKey[]; copyIcon: ReturnType<typeof useIcon>; pending?: readonly string[]; plusIcon: ReturnType<typeof useIcon> }) {
  // TanStack Table uses the data reference to detect source updates. Clone
  // only when the integration supplies a new list, not on every render.
  const data = useMemo(() => [...apiKeys], [apiKeys]);
  const columns = useMemo<ColumnDef<PersonalSettingsApiKey, unknown>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="名称" />, meta: { label: "名称", placeholder: "搜索 API key", variant: "text" }, cell: ({ row }) => <span className="font-medium text-fg-default">{row.original.name}</span> },
    { accessorKey: "value", header: ({ column }) => <DataTableColumnHeader column={column} label="Key" />, cell: ({ row }) => <div className="flex items-center gap-1.5 font-mono text-label text-fg-muted"><span>{row.original.value}</span>{actions?.onCopyApiKey && <Button aria-label={`复制 ${row.original.name}`} disabled={isPending(pending, `api-key:${row.original.id}:copy`)} onClick={() => actions.onCopyApiKey?.(row.original)} type="button" size="sm" variant="ghost" iconOnly><CopyIcon size={14} /></Button>}</div> },
    { accessorKey: "lastUsed", header: ({ column }) => <DataTableColumnHeader column={column} label="最后使用" />, cell: ({ row }) => <span className="text-fg-muted">{row.original.lastUsed}</span> },
    { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} label="状态" />, cell: ({ row }) => <StatusBadge status={row.original.status} />, filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)), meta: { label: "状态", options: [{ label: "正常", value: "正常" }, { label: "需要重新获取", value: "需要重新获取" }], variant: "multiSelect" } },
    ...(actions?.onApiKeyAction ? [{ id: "actions", header: () => <span className="sr-only">操作</span>, cell: ({ row }: { row: { original: PersonalSettingsApiKey } }) => <div className="flex justify-end"><RowActions label={row.original.name} items={["rotate", "revoke"] as const} onAction={(action) => actions.onApiKeyAction?.(row.original, action)} pending={isPending(pending, `api-key:${row.original.id}`)} /></div>, enableHiding: false, enableSorting: false, size: 56 }] : []),
  ], [CopyIcon, actions, pending]);
  const { table } = useDataTable({ columns, data, getRowId: (key) => key.id, initialState: { columnPinning: { left: ["name"], right: ["actions"] }, pagination: { pageIndex: 0, pageSize: 10 } } });

  return <DataTable className="gap-2.5 [&_[data-slot=data-table-pagination]]:px-2" emptyMessage="没有找到匹配的 API key。" table={table}><DataTableToolbar showViewOptions={false} table={table}>{actions?.onCreateApiKey && <Button disabled={isPending(pending, "api-key:create")} onClick={() => actions.onCreateApiKey?.()} type="button" variant="tertiary" leadingIcon={PlusIcon}>创建 key</Button>}</DataTableToolbar></DataTable>;
}

function CredentialsTable({ actions, credentials, pending, plusIcon: PlusIcon }: { actions?: PersonalSettingsActions; credentials: readonly PersonalSettingsCredential[]; pending?: readonly string[]; plusIcon: ReturnType<typeof useIcon> }) {
  // Match API keys: retain the supplied list until the integration replaces it.
  const data = useMemo(() => [...credentials], [credentials]);
  const columns = useMemo<ColumnDef<PersonalSettingsCredential, unknown>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="名称" />, meta: { label: "名称", placeholder: "搜索凭证", variant: "text" }, cell: ({ row }) => <CredentialName credential={row.original} /> },
    { accessorKey: "value", header: ({ column }) => <DataTableColumnHeader column={column} label="类型" />, cell: ({ row }) => <span className="text-fg-muted">{row.original.value}</span> },
    { accessorKey: "status", header: ({ column }) => <DataTableColumnHeader column={column} label="状态" />, cell: ({ row }) => <StatusBadge status={row.original.status} />, filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)), meta: { label: "状态", options: [{ label: "正常", value: "正常" }, { label: "需要重新获取", value: "需要重新获取" }], variant: "multiSelect" } },
    ...(actions?.onCredentialAction ? [{ id: "actions", header: () => <span className="sr-only">操作</span>, cell: ({ row }: { row: { original: PersonalSettingsCredential } }) => <div className="flex justify-end"><RowActions label={row.original.name} items={["edit", "remove"] as const} onAction={(action) => actions.onCredentialAction?.(row.original, action)} pending={isPending(pending, `credential:${row.original.id}`)} /></div>, enableHiding: false, enableSorting: false, size: 56 }] : []),
  ], [actions, pending]);
  const { table } = useDataTable({ columns, data, getRowId: (credential) => credential.id, initialState: { columnPinning: { left: ["name"], right: ["actions"] }, pagination: { pageIndex: 0, pageSize: 10 } } });

  return <DataTable className="gap-2.5 [&_[data-slot=data-table-pagination]]:px-2" emptyMessage="没有找到匹配的凭证。" table={table}><DataTableToolbar showViewOptions={false} table={table}>{actions?.onCreateCredential && <Button disabled={isPending(pending, "credential:create")} onClick={() => actions.onCreateCredential?.()} type="button" variant="tertiary" leadingIcon={PlusIcon}>添加凭证</Button>}</DataTableToolbar></DataTable>;
}

type AccountAction = Exclude<PersonalSettingsProfileAction, "save-profile">;

const defaultPreferences: PersonalSettingsPreferences = {
  theme: "light",
  highContrast: "system",
  enterAddsLine: false,
  language: "zh-CN",
  numberFormat: "default",
  textDirectionControls: false,
  startWeekOnMonday: true,
  dateFormat: "relative",
  automaticTimeZone: true,
  timeZone: "asia-shanghai",
};

function PreferencesSettings({ actions, preferences }: { actions?: PersonalSettingsActions; preferences: PersonalSettingsPreferences }) {
  const update = <Key extends keyof PersonalSettingsPreferences>(key: Key, value: PersonalSettingsPreferences[Key]) => {
    actions?.onPreferencesChange?.({ ...preferences, [key]: value });
  };
  const disabled = !actions?.onPreferencesChange;
  const { automaticTimeZone, dateFormat, enterAddsLine, highContrast, language, numberFormat, startWeekOnMonday, textDirectionControls, theme, timeZone } = preferences;
  const setTheme = (value: string) => update("theme", value);
  const setHighContrast = (value: string) => update("highContrast", value);
  const setEnterAddsLine = (value: boolean) => update("enterAddsLine", value);
  const setLanguage = (value: string) => update("language", value);
  const setNumberFormat = (value: string) => update("numberFormat", value);
  const setTextDirectionControls = (value: boolean) => update("textDirectionControls", value);
  const setStartWeekOnMonday = (value: boolean) => update("startWeekOnMonday", value);
  const setDateFormat = (value: string) => update("dateFormat", value);
  const setAutomaticTimeZone = (value: boolean) => update("automaticTimeZone", value);
  const setTimeZone = (value: string) => update("timeZone", value);

  return <div className="w-full space-y-9">
    <SettingsSection title="外观">
      <InfoItemGroup>
        <PreferenceInfoItem description="选择此设备上的 Zentrix 外观主题。" title="主题"><PreferenceSelect ariaLabel="主题" disabled={disabled} onChange={setTheme} options={[{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }, { value: "system", label: "跟随系统" }]} value={theme} /></PreferenceInfoItem>
        <PreferenceInfoItem badge="Beta" description="提高界面对比度，增强信息可见性。" title="高对比度"><PreferenceSelect ariaLabel="高对比度" disabled={disabled} onChange={setHighContrast} options={[{ value: "system", label: "跟随系统" }, { value: "on", label: "开启" }, { value: "off", label: "关闭" }]} value={highContrast} /></PreferenceInfoItem>
      </InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="输入选项">
      <InfoItemGroup><PreferenceInfoItem description="适用于聊天、评论和其他输入框。按 Cmd/Ctrl + Enter 发送内容。" title="使用 Enter 换行"><Switch checked={enterAddsLine} disabled={disabled} label={<span className="sr-only">使用 Enter 换行</span>} onCheckedChange={setEnterAddsLine} /></PreferenceInfoItem></InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="语言与时间">
      <InfoItemGroup>
        <PreferenceInfoItem description="选择 Zentrix 的显示语言。" title="语言"><PreferenceSelect ariaLabel="语言" disabled={disabled} onChange={setLanguage} options={[{ value: "zh-CN", label: "简体中文" }, { value: "en-US", label: "English (US)" }, { value: "ja-JP", label: "日本語" }]} value={language} /></PreferenceInfoItem>
        <PreferenceInfoItem description="选择数字和货币的显示方式；默认会使用语言设置。" title="数字格式"><PreferenceSelect ariaLabel="数字格式" disabled={disabled} onChange={setNumberFormat} options={[{ value: "default", label: "默认" }, { value: "zh-CN", label: "1,234.56" }, { value: "de-DE", label: "1.234,56" }]} value={numberFormat} /></PreferenceInfoItem>
        <PreferenceInfoItem description="始终在编辑器中显示从左到右或从右到左的文字方向切换。" title="始终显示文字方向控制"><Switch checked={textDirectionControls} disabled={disabled} label={<span className="sr-only">始终显示文字方向控制</span>} onCheckedChange={setTextDirectionControls} /></PreferenceInfoItem>
        <PreferenceInfoItem description="这会影响日历中一周的第一天。" title="每周从星期一开始"><Switch checked={startWeekOnMonday} disabled={disabled} label={<span className="sr-only">每周从星期一开始</span>} onCheckedChange={setStartWeekOnMonday} /></PreferenceInfoItem>
        <PreferenceInfoItem description="设置新建 @日期 提及的默认显示格式。" title="日期格式"><PreferenceSelect ariaLabel="日期格式" disabled={disabled} onChange={setDateFormat} options={[{ value: "relative", label: "相对日期" }, { value: "standard", label: "2026-08-16" }, { value: "long", label: "2026 年 8 月 16 日" }]} value={dateFormat} /></PreferenceInfoItem>
        <PreferenceInfoItem description="提醒、通知和邮件会根据你的当前时区送达。" title="根据位置自动设置时区"><Switch checked={automaticTimeZone} disabled={disabled} label={<span className="sr-only">根据位置自动设置时区</span>} onCheckedChange={setAutomaticTimeZone} /></PreferenceInfoItem>
        <PreferenceInfoItem description="选择你所在的时区。" title="时区"><PreferenceSelect ariaLabel="时区" disabled={disabled || automaticTimeZone} onChange={setTimeZone} options={[{ value: "asia-shanghai", label: "GMT+8 · 上海" }, { value: "asia-tokyo", label: "GMT+9 · 东京" }, { value: "america-los-angeles", label: "GMT-7 · 洛杉矶" }]} value={timeZone} /></PreferenceInfoItem>
      </InfoItemGroup>
    </SettingsSection>
  </div>;
}

const accountActionCopy: Record<AccountAction, { title: string; description: string; confirm: string }> = {
  email: { title: "管理邮箱", description: "更新用于登录和接收账户通知的邮箱地址。", confirm: "保存邮箱" },
  password: { title: "设置密码", description: "设置密码后，你可以使用邮箱和密码登录账户。", confirm: "设置密码" },
  verification: { title: "开启两步验证", description: "使用验证器应用为账户增加一层安全保护。", confirm: "开启验证" },
  passkey: { title: "添加通行密钥", description: "使用本设备的生物识别或屏幕锁定方式安全登录。", confirm: "添加通行密钥" },
  delete: { title: "删除账户", description: "此操作将永久删除你的账户和个人数据，且无法撤销。", confirm: "删除账户" },
  "logout-all": { title: "退出其他设备", description: "这会退出除当前设备外的全部登录会话。", confirm: "退出其他设备" },
  "logout-device": { title: "退出此设备", description: "该设备将需要重新验证身份后才能继续访问。", confirm: "退出设备" },
};

function ProfileSettings({ actions, pending, profile }: { actions?: PersonalSettingsActions; pending?: readonly string[]; profile: PersonalSettingsProfile }) {
  const [preferredName, setPreferredName] = useState(profile.displayName);
  const email = profile.email;
  const [emailDraft, setEmailDraft] = useState(email);
  const [accountAction, setAccountAction] = useState<AccountAction | null>(null);
  const [deviceToLogout, setDeviceToLogout] = useState<string | null>(null);
  const devices = profile.devices ?? [];
  const actionCopy = accountAction ? accountActionCopy[accountAction] : accountActionCopy.email;
  const profileAction = actions?.onProfileAction;

  useEffect(() => {
    setPreferredName(profile.displayName);
    setEmailDraft(profile.email);
  }, [profile.displayName, profile.email]);

  const openAccountAction = (action: AccountAction, deviceId?: string) => {
    if (!profileAction) return;
    if (action === "email") setEmailDraft(email);
    setDeviceToLogout(deviceId ?? null);
    setAccountAction(action);
  };

  const confirmAccountAction = async () => {
    if (!accountAction || !profileAction) return;
    try {
      await profileAction(accountAction, {
        ...(accountAction === "email" ? { email: emailDraft } : {}),
        ...(accountAction === "logout-device" ? { deviceId: deviceToLogout ?? undefined } : {}),
      });
      setDeviceToLogout(null);
      setAccountAction(null);
    } catch {
      // The host owns the failure message through operationState.error.
    }
  };

  return <div className="w-full space-y-9">
    <SettingsSection title="个人资料">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SidebarIdentityAvatar className="size-[60px] text-title" tone="brand">{profile.avatarLabel ?? profile.displayName.slice(0, 1)}</SidebarIdentityAvatar>
        <div className="w-full max-w-md"><label className="text-body font-medium text-fg-default" htmlFor="preferred-name">显示名称</label><InputGroup className="mt-2"><InputGroupInput id="preferred-name" onChange={(event) => setPreferredName(event.target.value)} value={preferredName} /></InputGroup></div>
        {profileAction && <Button disabled={isPending(pending, "profile:save-profile")} onClick={() => profileAction("save-profile", { preferredName })} type="button" variant="tertiary">保存</Button>}
      </div>
      <p className="mt-3 text-label text-fg-muted">此名称会显示在你的协作记录与公开资料中。</p>
    </SettingsSection>

    <SettingsSection title="账户安全">
      <InfoItemGroup>
        <AccountInfoItem action="管理邮箱" description={email} grouped onAction={profileAction ? () => openAccountAction("email") : undefined} title="邮箱" />
        <AccountInfoItem action="添加密码" description="为账户设置密码。" grouped onAction={profileAction ? () => openAccountAction("password") : undefined} title="密码" />
        <AccountInfoItem action="添加验证方式" description="为账户增加一层安全保护。" grouped onAction={profileAction ? () => openAccountAction("verification") : undefined} title="两步验证" />
        <AccountInfoItem action="添加通行密钥" description="使用设备生物识别或屏幕锁定方式登录。" grouped onAction={profileAction ? () => openAccountAction("passkey") : undefined} title="通行密钥" />
      </InfoItemGroup>
    </SettingsSection>

    <SettingsSection title="支持">
      <InfoItemGroup><InfoItem className="min-h-[86px] px-4 py-3.5"><InfoItemContent><InfoItemTitle>支持访问</InfoItemTitle><InfoItemDescription>授权 Zentrix 支持团队临时访问你的账户，以协助排查问题或恢复内容；实际权限状态由宿主应用提供。</InfoItemDescription></InfoItemContent></InfoItem></InfoItemGroup>
      <div className="mt-3"><AccountInfoItem action="删除账户" destructive description="永久删除账户后，你将无法再访问所属工作区与个人数据。" onAction={profileAction ? () => openAccountAction("delete") : undefined} title="删除我的账户" /></div>
    </SettingsSection>

    <SettingsSection title="设备">
      <div className="mb-3"><AccountInfoItem action="退出其他设备" destructive description="退出除当前设备以外的全部活跃会话。" onAction={profileAction ? () => openAccountAction("logout-all") : undefined} title="退出其他设备" /></div>
      <div className="overflow-x-auto"><Table className="min-w-[620px]"><TableHeader><TableRow><TableHead>设备名称</TableHead><TableHead>最近活跃</TableHead><TableHead>位置</TableHead>{profileAction && <TableHead className="w-24 text-right"><span className="sr-only">操作</span></TableHead>}</TableRow></TableHeader><TableBody>{devices.map((device, index) => <TableRow index={index} key={device.id}><TableCell className="font-medium text-fg-default">{device.name}{device.current && <span className="ml-2 text-label font-normal text-fg-brand">当前设备</span>}</TableCell><TableCell className="text-fg-muted">{device.lastActive}</TableCell><TableCell className="text-fg-muted">{device.location}</TableCell>{profileAction && <TableCell><div className="flex justify-end">{!device.current && <Button disabled={isPending(pending, `profile:logout-device:${device.id}`)} onClick={() => openAccountAction("logout-device", device.id)} size="md" type="button" variant="tertiary">退出</Button>}</div></TableCell>}</TableRow>)}</TableBody></Table></div>
    </SettingsSection>

    <Dialog onOpenChange={(open) => { if (!open) { setAccountAction(null); setDeviceToLogout(null); } }} open={accountAction !== null}><DialogContent size="sm"><DialogHeader><DialogTitle>{actionCopy.title}</DialogTitle><DialogDescription>{actionCopy.description}</DialogDescription></DialogHeader>{accountAction === "email" && <div><label className="text-body font-medium text-fg-default" htmlFor="account-email">邮箱地址</label><InputGroup className="mt-2"><InputGroupInput id="account-email" onChange={(event) => setEmailDraft(event.target.value)} type="email" value={emailDraft} /></InputGroup></div>}{accountAction === "password" && <div><label className="text-body font-medium text-fg-default" htmlFor="account-password">新密码</label><InputGroup className="mt-2"><InputGroupInput id="account-password" placeholder="至少 8 位字符" type="password" /></InputGroup></div>}<DialogFooter><DialogClose render={<Button type="button" variant="ghost">取消</Button>} /><Button onClick={confirmAccountAction} type="button" variant={accountAction === "delete" || accountAction === "logout-all" || accountAction === "logout-device" ? "destructive" : "primary"}>{actionCopy.confirm}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return <section aria-labelledby={`${title}-title`}><h2 className="border-b border-border pb-3 text-title font-semibold text-fg-default" id={`${title}-title`}>{title}</h2><div className="pt-4">{children}</div></section>;
}

function PreferenceInfoItem({ badge, children, description, title }: { badge?: string; children: ReactNode; description: string; title: string }) {
  return <InfoItem className="min-h-[76px] px-4 py-3.5"><InfoItemContent><InfoItemTitle className="flex items-center gap-1.5">{title}{badge && <Badge color="gray" size="sm">{badge}</Badge>}</InfoItemTitle><InfoItemDescription>{description}</InfoItemDescription></InfoItemContent><InfoItemTrailing>{children}</InfoItemTrailing></InfoItem>;
}

function PreferenceSelect({ ariaLabel, disabled = false, onChange, options, value }: { ariaLabel: string; disabled?: boolean; onChange: (value: string) => void; options: readonly { label: string; value: string }[]; value: string }) {
  return <Select disabled={disabled} onValueChange={onChange} size="md" value={value}><SelectTrigger aria-label={ariaLabel} className="min-w-32 max-w-56" /> <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

function AccountInfoItem({ action, description, destructive = false, disabled = false, grouped = false, onAction, title }: { action: string; description: string; destructive?: boolean; disabled?: boolean; grouped?: boolean; onAction?: () => void; title: string }) {
  return <InfoItem className={cn("min-h-[76px] px-4 py-3.5", !grouped && "rounded-lg border-[0.5px] border-border")}><InfoItemContent><InfoItemTitle>{title}</InfoItemTitle><InfoItemDescription>{description}</InfoItemDescription></InfoItemContent>{onAction && <InfoItemTrailing><Button disabled={disabled} onClick={onAction} size="md" type="button" variant={destructive ? "destructive" : "tertiary"}>{action}</Button></InfoItemTrailing>}</InfoItem>;
}

function formatCallDuration(durationMs: number) {
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 1 : 2)}s`;
}

function formatCallTokens(tokens: number) {
  return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}K` : tokens.toLocaleString("zh-CN");
}

function CallLogStatusBadge({ status }: { status: CallLogStatus }) {
  const presentation = callLogStatusCopy[status];
  if (status === "failed") return <Badge color="red" size="sm" variant="strong">{presentation.label}</Badge>;
  if (status === "degraded") return <Badge color="amber" size="sm" variant="strong">{presentation.label}</Badge>;
  return <Badge color="green" size="sm">{presentation.label}</Badge>;
}

function CallLogKindBadge({ kind }: { kind: CallLogKind }) {
  return <Badge color={kind === "model" ? "blue" : "amber"} size="sm">{kind === "model" ? "模型" : "MCP"}</Badge>;
}

function formatCallLogSelection(selection: TimeRangeHistogramRange) {
  return `${callLogDateTimeFormatter.format(selection.start)} – ${callLogDateTimeFormatter.format(selection.end)}`;
}

function CallLogDataTable({ onOpen, records }: { onOpen: (record: CallLogRecord) => void; records: readonly CallLogRecord[] }) {
  const ArrowRightIcon = useIcon("arrow-right");
  const columns = useMemo<ColumnDef<CallLogRecord>[]>(() => [{ accessorKey: "id" }], []);
  const data = useMemo(() => [...records], [records]);
  const { table } = useDataTable({ columns, data, getRowId: (record) => record.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  useEffect(() => table.setPageIndex(0), [records, table]);
  const pagination = table.getState().pagination;
  const pageOffset = pagination.pageIndex * pagination.pageSize;
  const pageRecords = table.getRowModel().rows.map((row) => row.original);

  return <div className="space-y-2"><div className="overflow-hidden rounded-xl border border-border bg-surface-floating"><div className="overflow-x-auto"><Table className="min-w-[1160px] text-label"><TableHeader className="[&_th]:whitespace-nowrap"><TableRow><TableHead className="sticky left-0 z-content w-36 min-w-36 max-w-36 bg-surface-floating">时间</TableHead><TableHead className="sticky left-36 z-content w-24 min-w-24 max-w-24 border-r border-border bg-surface-floating">事件类型</TableHead><TableHead className="w-52 min-w-52 max-w-52">目标</TableHead><TableHead className="w-52 min-w-52 max-w-52">内容</TableHead><TableHead className="w-24">状态</TableHead><TableHead className="w-40">Request ID</TableHead><TableHead className="w-20">Code</TableHead><TableHead className="w-20 text-right">Token</TableHead><TableHead className="w-20 text-right">耗时</TableHead><TableHead className="w-14"><span className="sr-only">查看</span></TableHead><TableHead className="sticky right-0 z-content w-24 min-w-24 max-w-24 border-l border-border bg-surface-floating text-right">费用</TableHead></TableRow></TableHeader><TableBody>{pageRecords.length ? pageRecords.map((record, index) => <TableRow index={pageOffset + index} key={record.id}><TableCell className="sticky left-0 z-content w-36 min-w-36 max-w-36 whitespace-nowrap bg-surface-floating font-mono tabular-nums text-fg-muted group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]">{record.time}</TableCell><TableCell className="sticky left-36 z-content w-24 min-w-24 max-w-24 border-r border-border bg-surface-floating group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]"><CallLogKindBadge kind={record.kind} /></TableCell><TableCell className="w-52 min-w-52 max-w-52"><div className="min-w-0"><div className="flex min-w-0 items-center gap-1.5 font-medium text-fg-default">{record.kind === "model" && <span className="shrink-0"><ModelLogo model={record.actual} /></span>}<span className="truncate">{record.requested}{record.requested !== record.actual && <><span className="mx-1 text-fg-subtle">→</span>{record.actual}</>}</span></div><p className="mt-0.5 truncate text-fg-muted">{record.service}</p></div></TableCell><TableCell className="w-52 min-w-52 max-w-52"><p className="truncate text-fg-muted" title={record.summary}>{record.summary}</p></TableCell><TableCell><CallLogStatusBadge status={record.status} /></TableCell><TableCell className="max-w-40 truncate font-mono text-fg-muted" title={record.id}>{record.id}</TableCell><TableCell className={cn("font-mono", record.status === "failed" ? "text-fg-danger" : record.status === "degraded" ? "text-fg-warning" : "text-fg-muted")}>{record.code}</TableCell><TableCell className="text-right tabular-nums">{record.tokens ? formatCallTokens(record.tokens) : "—"}</TableCell><TableCell className="text-right tabular-nums">{formatCallDuration(record.durationMs)}</TableCell><TableCell><Button aria-label={`检查 ${record.id}`} iconOnly onClick={() => onOpen(record)} size="sm" type="button" variant="ghost"><ArrowRightIcon aria-hidden size={16} strokeWidth={1.5} /></Button></TableCell><TableCell className="sticky right-0 z-content w-24 min-w-24 max-w-24 border-l border-border bg-surface-floating text-right font-medium tabular-nums group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]">{record.amount === undefined ? "—" : `¥${record.amount.toFixed(3)}`}</TableCell></TableRow>) : <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={11}>没有找到匹配的调用日志。</TableCell></TableRow>}</TableBody></Table></div></div>{records.length > 0 && <DataTablePagination className="px-2" pageSizeOptions={[10, 20, 50]} table={table} />}</div>;
}

function CallRunDataTable({ onOpen, runs }: { onOpen: (run: CallLogRun) => void; runs: readonly CallLogRun[] }) {
  const ArrowRightIcon = useIcon("arrow-right");
  const columns = useMemo<ColumnDef<CallLogRun>[]>(() => [{ accessorKey: "id" }], []);
  const data = useMemo(() => [...runs], [runs]);
  const { table } = useDataTable({ columns, data, getRowId: (run) => run.id, initialState: { pagination: { pageIndex: 0, pageSize: 10 } } });
  useEffect(() => table.setPageIndex(0), [runs, table]);
  const pagination = table.getState().pagination;
  const pageOffset = pagination.pageIndex * pagination.pageSize;
  const pageRuns = table.getRowModel().rows.map((row) => row.original);

  return <div className="space-y-2"><div className="overflow-hidden rounded-xl border border-border bg-surface-floating"><div className="overflow-x-auto"><Table className="min-w-[1300px] text-label"><TableHeader className="[&_th]:whitespace-nowrap"><TableRow><TableHead className="sticky left-0 z-content w-36 min-w-36 max-w-36 bg-surface-floating">开始时间</TableHead><TableHead className="w-32">Run ID</TableHead><TableHead className="w-24">状态</TableHead><TableHead className="w-52 min-w-52 max-w-52">输入消息</TableHead><TableHead className="w-52 min-w-52 max-w-52">回答结果</TableHead><TableHead className="w-52 min-w-52 max-w-52">调用</TableHead><TableHead className="w-20 text-right">Token</TableHead><TableHead className="w-20 text-right">耗时</TableHead><TableHead className="w-14"><span className="sr-only">查看</span></TableHead><TableHead className="sticky right-0 z-content w-20 min-w-20 max-w-20 border-l border-border bg-surface-floating text-right">费用</TableHead></TableRow></TableHeader><TableBody>{pageRuns.length ? pageRuns.map((run, index) => <TableRow index={pageOffset + index} key={run.id}><TableCell className="sticky left-0 z-content w-36 min-w-36 max-w-36 whitespace-nowrap bg-surface-floating font-mono tabular-nums text-fg-muted group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]">{run.time}</TableCell><TableCell className="font-mono text-fg-muted">{run.id}</TableCell><TableCell><CallLogStatusBadge status={run.status} /></TableCell><TableCell className="w-52 min-w-52 max-w-52"><p className="truncate font-medium text-fg-default" title={run.prompt}>{run.prompt}</p></TableCell><TableCell className="w-52 min-w-52 max-w-52"><p className="truncate text-fg-muted" title={run.detail}>{run.detail}</p></TableCell><TableCell className="w-52 min-w-52 max-w-52 truncate"><span>MODEL {run.modelCalls}</span><span className="mx-1 text-fg-subtle">/</span><span>MCP {run.mcpCalls}</span></TableCell><TableCell className="text-right tabular-nums">{formatCallTokens(run.tokens)}</TableCell><TableCell className="text-right tabular-nums">{formatCallDuration(run.durationMs)}</TableCell><TableCell><Button aria-label={`检查 ${run.id}`} iconOnly onClick={() => onOpen(run)} size="sm" type="button" variant="ghost"><ArrowRightIcon aria-hidden size={16} strokeWidth={1.5} /></Button></TableCell><TableCell className="sticky right-0 z-content w-20 min-w-20 max-w-20 border-l border-border bg-surface-floating text-right font-medium tabular-nums group-[.is-active]/row:[background-image:linear-gradient(var(--hover),var(--hover))]">¥{run.amount.toFixed(3)}</TableCell></TableRow>) : <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={10}>没有找到匹配的回答日志。</TableCell></TableRow>}</TableBody></Table></div></div>{runs.length > 0 && <DataTablePagination className="px-2" pageSizeOptions={[10, 20, 50]} table={table} />}</div>;
}

function CallLogsSettings({ data }: { data: PersonalSettingsCallLogsData }) {
  const SearchIcon = useIcon("search");
  const callLogRecords = data.records;
  const callLogRuns = data.runs;
  const latestTimestamp = useMemo(() => {
    const timestamps = [
      ...callLogRecords.map((record) => record.timestamp),
      ...callLogRuns.map((run) => run.timestamp),
    ];

    return timestamps.length ? Math.max(...timestamps) : callLogLatestTimestamp;
  }, [callLogRecords, callLogRuns]);
  const contextStart = latestTimestamp - CALL_LOG_TIMELINE_BUCKETS * DAY_IN_MS;
  const quickSelections = useMemo(() => callLogQuickSelectionsFor(latestTimestamp), [latestTimestamp]);
  const attributionOptions = useMemo(() => [...new Set(callLogRecords.map((record) => record.attribution))].map((value) => ({ label: value, value })), [callLogRecords]);
  const [view, setView] = useState<CallLogView>("calls");
  const [range, setRange] = useState<CallLogRange>("day");
  const [timeSelection, setTimeSelection] = useState<TimeRangeHistogramRange>(() => quickSelections.day);
  const [kind, setKind] = useState<"all" | CallLogKind>("all");
  const [status, setStatus] = useState<"all" | CallLogStatus>("all");
  const [attribution, setAttribution] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedCallId, setSelectedCallId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  useEffect(() => {
    setRange("day");
    setTimeSelection(quickSelections.day);
  }, [quickSelections]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCalls = useMemo(() => callLogRecords.filter((record) => {
    const matchesQuery = !normalizedQuery || `${record.id} ${record.runId} ${record.requested} ${record.actual} ${record.service} ${record.attribution} ${record.apiKey} ${record.summary} ${record.upstreamId ?? ""}`.toLowerCase().includes(normalizedQuery);
    return isCallLogTimeInSelection(record.timestamp, timeSelection) && matchesQuery && (kind === "all" || record.kind === kind) && (status === "all" || record.status === status) && (attribution === "all" || record.attribution === attribution);
  }), [attribution, kind, normalizedQuery, status, timeSelection]);
  const filteredRuns = useMemo(() => callLogRuns.filter((run) => {
    const matchesQuery = !normalizedQuery || `${run.id} ${run.prompt} ${run.detail}`.toLowerCase().includes(normalizedQuery);
    const matchesAttribution = attribution === "all" || callLogRecords.some((record) => record.runId === run.id && record.attribution === attribution);
    return isCallLogTimeInSelection(run.timestamp, timeSelection) && matchesQuery && matchesAttribution && (status === "all" || run.status === status);
  }), [attribution, normalizedQuery, status, timeSelection]);
  const filteredTrendCalls = useMemo(() => {
    if (view === "calls") return callLogRecords.filter((record) => {
      const matchesQuery = !normalizedQuery || `${record.id} ${record.runId} ${record.requested} ${record.actual} ${record.service} ${record.attribution} ${record.apiKey} ${record.summary} ${record.upstreamId ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (kind === "all" || record.kind === kind) && (status === "all" || record.status === status) && (attribution === "all" || record.attribution === attribution);
    });
    const visibleRunIds = new Set(callLogRuns.filter((run) => {
      const matchesQuery = !normalizedQuery || `${run.id} ${run.prompt} ${run.detail}`.toLowerCase().includes(normalizedQuery);
      const matchesAttribution = attribution === "all" || callLogRecords.some((record) => record.runId === run.id && record.attribution === attribution);
      return matchesQuery && matchesAttribution && (status === "all" || run.status === status);
    }).map((run) => run.id));
    return callLogRecords.filter((record) => visibleRunIds.has(record.runId));
  }, [attribution, kind, normalizedQuery, status, view]);
  const trendPoints = useMemo(() => aggregateCallLogTrend(filteredTrendCalls, contextStart), [contextStart, filteredTrendCalls]);
  const selectedRangeLabel = range === "custom" ? formatCallLogSelection(timeSelection) : quickSelections[range].label;
  const applyQuickRange = (nextRange: ModelUsageRange) => {
    setRange(nextRange);
    setTimeSelection(quickSelections[nextRange]);
  };
  const applyTimelineSelection = (nextSelection: TimeRangeHistogramRange) => {
    setTimeSelection(nextSelection);
    const matchingRange = (Object.keys(quickSelections) as ModelUsageRange[]).find((key) => {
      const quickSelection = quickSelections[key];
      return quickSelection.start === nextSelection.start && quickSelection.end === nextSelection.end;
    });
    setRange(matchingRange ?? "custom");
  };
  const selectedCall = callLogRecords.find((record) => record.id === selectedCallId);
  const selectedRun = callLogRuns.find((run) => run.id === selectedRunId);
  const openCall = (record: CallLogRecord) => { setSelectedCallId(record.id); setSelectedRunId(""); setDetailOpen(true); };
  const openRun = (run: CallLogRun) => { setSelectedRunId(run.id); setSelectedCallId(""); setDetailOpen(true); };

  return <div className="space-y-4 py-1">
    <header className="border-b border-border pb-5"><h1 className="text-heading font-semibold text-fg-default">调用日志</h1><p className="mt-1 text-label leading-5 text-fg-muted">逐次核对模型和 MCP 调用，并按回答查看完整执行链路。</p></header>

    <Tabs aria-label="调用日志视角" color="neutral" onValueChange={(value) => setView(value as CallLogView)} value={view} variant="segment"><TabsList><TabItem label="按调用" value="calls" /><TabItem label="按回答" value="runs" /></TabsList></Tabs>

    <section aria-label="调用日志筛选" className={cn("grid gap-3 sm:grid-cols-2", view === "calls" ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
      <UsageFilter label="时间范围" value={range} onChange={(value) => { if (value !== "custom") applyQuickRange(value as ModelUsageRange); }} options={[{ label: "最近 24 小时", value: "day" }, { label: "最近 7 天", value: "week" }, { label: "最近 30 天", value: "month" }, ...(range === "custom" ? [{ label: "自定义范围", value: "custom" }] : [])]} />
      {view === "calls" && <UsageFilter label="调用类型" value={kind} onChange={(value) => setKind(value as "all" | CallLogKind)} options={[{ label: "全部类型", value: "all" }, { label: "模型", value: "model" }, { label: "MCP", value: "mcp" }]} />}
      <UsageFilter label="状态" value={status} onChange={(value) => setStatus(value as "all" | CallLogStatus)} options={[{ label: "全部状态", value: "all" }, { label: "成功", value: "success" }, { label: "已降级", value: "degraded" }, { label: "失败", value: "failed" }]} />
      <UsageFilter label="计费归属" value={attribution} onChange={setAttribution} options={[{ label: "全部计费归属", value: "all" }, ...attributionOptions]} />
      <InputGroup className="w-full border-border hover:border-border" size="md"><InputGroupAddon className="pr-2"><SearchIcon aria-hidden size={16} strokeWidth={1.5} /></InputGroupAddon><InputGroupInput aria-label="搜索调用日志" className="h-full min-h-0" onChange={(event) => setQuery(event.target.value)} placeholder={view === "calls" ? "搜索调用、Run ID 或模型" : "搜索问题或 Run ID"} value={query} /></InputGroup>
    </section>

    <Container><ContainerHeader className="gap-4 overflow-x-auto px-4 py-2"><h2 className="shrink-0 text-body font-medium text-fg-default" id="call-trend-title">调用趋势</h2><div className="flex shrink-0 items-center gap-3 whitespace-nowrap text-label text-fg-subtle"><span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: "light-dark(var(--brand-active), var(--brand))" }} />模型</span><span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: "light-dark(var(--brand), var(--brand-active))" }} />MCP</span><span className="text-fg-muted">当前：{selectedRangeLabel}</span></div></ContainerHeader><ContainerBody className="p-3"><TimeRangeHistogram ariaLabel="调用趋势时间范围" aria-labelledby="call-trend-title" data={trendPoints} formatRange={formatCallLogSelection} formatValue={(value) => `${value.toLocaleString("zh-CN")} 次`} instruction="拖动选区可整体移动" onValueChange={applyTimelineSelection} rangeEndLabel={callLogDateFormatter.format(latestTimestamp)} rangeStartLabel={callLogDateFormatter.format(contextStart)} series={callLogTrendSeries} value={timeSelection} /></ContainerBody></Container>

    {view === "calls" ? <>
      <div className="flex flex-wrap items-center gap-2 text-label text-fg-muted"><span className="mr-2">显示 {filteredCalls.length.toLocaleString("zh-CN")} 条</span><Badge color="red" size="sm" variant="strong">错误 {filteredCalls.filter((record) => record.status === "failed").length}</Badge><Badge color="amber" size="sm" variant="strong">降级 {filteredCalls.filter((record) => record.status === "degraded").length}</Badge><span className="ml-2 text-fg-subtle">按时间倒序</span></div>
      <CallLogDataTable onOpen={openCall} records={filteredCalls} />
    </> : <>
      <div className="flex flex-wrap items-center gap-2 text-label text-fg-muted"><span className="mr-2">显示 {filteredRuns.length.toLocaleString("zh-CN")} 条</span><Badge color="red" size="sm" variant="strong">错误 {filteredRuns.filter((run) => run.status === "failed").length}</Badge><Badge color="amber" size="sm" variant="strong">降级 {filteredRuns.filter((run) => run.status === "degraded").length}</Badge><span className="ml-2 text-fg-subtle">按 Run 聚合</span></div>
      <CallRunDataTable onOpen={openRun} runs={filteredRuns} />
    </>}
    <Dialog onOpenChange={setDetailOpen} open={detailOpen}><DialogContent className="max-h-[min(80svh,760px)] max-w-[760px] overflow-y-auto" size="lg">{selectedCall ? <CallLogDetail record={selectedCall} /> : selectedRun ? <CallRunDetail run={selectedRun} /> : null}</DialogContent></Dialog>
  </div>;
}

function CallLogDetail({ record }: { record: CallLogRecord }) {
  return <><DialogHeader><div className="flex flex-wrap items-center gap-2"><DialogTitle>调用检查</DialogTitle><CallLogKindBadge kind={record.kind} /><CallLogStatusBadge status={record.status} /></div><DialogDescription className="font-mono">{record.time} · {record.id}</DialogDescription></DialogHeader><div className="space-y-3">
    {record.status !== "success" && <InlineNotice tone={record.status === "failed" ? "danger" : "warning"} variant="emphasized"><InlineNoticeContent>{record.detail}</InlineNoticeContent></InlineNotice>}
    <div className="grid gap-3 sm:grid-cols-2"><DetailList><DetailListItem><DetailListLabel>{record.kind === "model" ? "请求模型" : "MCP 工具"}</DetailListLabel><DetailListValue>{record.requested}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>{record.kind === "model" ? "实际模型" : "操作类型"}</DetailListLabel><DetailListValue>{record.kind === "model" ? record.actual : record.operation}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>状态码</DetailListLabel><DetailListValue className="font-mono">{record.code}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>服务</DetailListLabel><DetailListValue>{record.service}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>Run ID</DetailListLabel><DetailListValue className="font-mono text-label">{record.runId}</DetailListValue></DetailListItem></DetailList><DetailList><DetailListItem><DetailListLabel>计费归属</DetailListLabel><DetailListValue>{record.attribution}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>API Key</DetailListLabel><DetailListValue className="font-mono text-label">{record.apiKey}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>总耗时</DetailListLabel><DetailListValue>{formatCallDuration(record.durationMs)}</DetailListValue></DetailListItem>{record.firstTokenMs !== undefined && <DetailListItem><DetailListLabel>首 Token 延迟</DetailListLabel><DetailListValue>{record.firstTokenMs}ms</DetailListValue></DetailListItem>}<DetailListItem><DetailListLabel>Token / 金额</DetailListLabel><DetailListValue>{record.tokens ? record.tokens.toLocaleString("zh-CN") : "—"} / {record.amount === undefined ? "—" : `¥${record.amount.toFixed(3)}`}</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>上游 Request ID</DetailListLabel><DetailListValue className="font-mono text-label break-all">{record.upstreamId ?? "—"}</DetailListValue></DetailListItem></DetailList></div>
    {record.status === "success" && <InlineNotice><InlineNoticeContent>{record.detail}</InlineNoticeContent></InlineNotice>}
    <div className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2"><p className="text-label text-fg-subtle">事件摘要</p><p className="mt-1 text-body text-fg-default">{record.summary}</p></div>
  </div></>;
}

function CallRunDetail({ run }: { run: CallLogRun }) {
  const calls = callLogRecords.filter((record) => record.runId === run.id).sort((a, b) => a.timestamp - b.timestamp);
  return <><DialogHeader><div className="flex flex-wrap items-center gap-2"><DialogTitle>回答链路</DialogTitle><CallLogStatusBadge status={run.status} /></div><DialogDescription className="font-mono">{run.time} · {run.id}</DialogDescription></DialogHeader><p className="mb-4 text-body text-fg-default">{run.prompt}</p><div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-muted"><span>MODEL {run.modelCalls}</span><span>MCP {run.mcpCalls}</span><span>{formatCallTokens(run.tokens)} Token</span><span>{formatCallDuration(run.durationMs)}</span><span>¥{run.amount.toFixed(3)}</span></div><div className="overflow-x-auto border-y border-border-subtle"><Table className="min-w-[760px] text-label"><TableHeader><TableRow><TableHead className="w-14">#</TableHead><TableHead className="w-20">事件</TableHead><TableHead className="w-44">调用目标</TableHead><TableHead>事件摘要</TableHead><TableHead className="w-24">状态</TableHead><TableHead className="w-20">Code</TableHead><TableHead className="w-20 text-right">耗时</TableHead><TableHead className="w-20 text-right">费用</TableHead></TableRow></TableHeader><TableBody>{calls.map((record, index) => <TableRow index={index} key={record.id}><TableCell className="font-mono tabular-nums text-fg-muted">{String(index + 1).padStart(2, "0")}</TableCell><TableCell><CallLogKindBadge kind={record.kind} /></TableCell><TableCell><p className="font-medium text-fg-default">{record.requested}{record.requested !== record.actual ? ` → ${record.actual}` : ""}</p><p className="mt-0.5 text-fg-muted">{record.service}</p></TableCell><TableCell className="text-fg-muted">{record.summary}</TableCell><TableCell><CallLogStatusBadge status={record.status} /></TableCell><TableCell className="font-mono text-fg-muted">{record.code}</TableCell><TableCell className="text-right tabular-nums">{formatCallDuration(record.durationMs)}</TableCell><TableCell className="text-right tabular-nums">{record.amount === undefined ? "—" : `¥${record.amount.toFixed(3)}`}</TableCell></TableRow>)}</TableBody></Table></div></>;
}

function ModelUsageSettings({ apiKeys: availableApiKeys, data, modelServices }: { apiKeys: readonly PersonalSettingsApiKey[]; data: PersonalSettingsModelUsageData; modelServices: readonly PersonalSettingsModelService[] }) {
  const [range, setRange] = useState<ModelUsageRange>("month");
  const [service, setService] = useState("all");
  const [attribution, setAttribution] = useState("all");
  const [model, setModel] = useState("all");
  const [apiKey, setApiKey] = useState("all");
  const records = data.records;
  const services = [...new Set(records.map((record) => record.service))];
  const attributions = [...new Set(records.map((record) => record.attribution))];
  const models = [...new Set(records.map((record) => record.model))];
  const apiKeys = [...new Set(records.map((record) => record.apiKey))];
  const filteredRecords = useMemo(() => records.filter((record) => {
    const withinRange = range === "month" ? true : range === "week" ? record.date >= "2026-08-13" : record.date === "2026-08-19";
    return withinRange && (service === "all" || record.service === service) && (attribution === "all" || record.attribution === attribution) && (model === "all" || record.model === model) && (apiKey === "all" || record.apiKey === apiKey);
  }), [apiKey, attribution, model, range, records, service]);
  const totals = useMemo(() => filteredRecords.reduce((summary, record) => ({ amount: summary.amount + record.amount, calls: summary.calls + record.calls, inputTokens: summary.inputTokens + record.inputTokens, cachedTokens: summary.cachedTokens + record.cachedTokens, outputTokens: summary.outputTokens + record.outputTokens }), { amount: 0, calls: 0, inputTokens: 0, cachedTokens: 0, outputTokens: 0 }), [filteredRecords]);
  const attributionRows = useMemo(() => Array.from(filteredRecords.reduce((rows, record) => rows.set(record.attribution, (rows.get(record.attribution) ?? 0) + record.amount), new Map<string, number>())).sort(([, left], [, right]) => right - left), [filteredRecords]);
  const attributionChartData = useMemo(() => attributionRows.map(([label, amount], index) => ({ label, amount, fill: attributionChartColors[index % attributionChartColors.length] })), [attributionRows]);
  const modelShareRows = useMemo(() => Array.from(filteredRecords.reduce((rows, record) => rows.set(record.model, (rows.get(record.model) ?? 0) + record.amount), new Map<string, number>())).sort(([, left], [, right]) => right - left), [filteredRecords]);
  const trendPoints = useMemo(() => {
    const [startDay, dayCount] = range === "month" ? [1, 30] : range === "week" ? [13, 7] : [19, 1];
    return Array.from({ length: dayCount }, (_, index) => {
      const date = `2026-08-${String(startDay + index).padStart(2, "0")}`;
      const amount = filteredRecords.filter((record) => record.date === date).reduce((sum, record) => sum + record.amount, 0);
      return { date, amount };
    });
  }, [filteredRecords, range]);

  return <div className="space-y-4 py-1">
    <header className="border-b border-border pb-5"><h1 className="text-heading font-semibold text-fg-default">模型用量</h1><p className="mt-1 text-label leading-5 text-fg-muted">按调用时的 API Key、模型服务授权与计费归属统计消费。</p></header>

    <section aria-label="账户资源概览" className="grid items-stretch gap-3 sm:grid-cols-3"><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">可用于模型调用</span>} label="账户余额" value={data.accountBalance} /><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">当前已授权且可调用</span>} label="可用模型服务" value={`${modelServices.filter((service) => service.status === "正常").length} 个`} /><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">状态正常的调用 Key</span>} label="可用 API Key" value={`${availableApiKeys.filter((key) => key.status === "正常").length} 个`} /></section>

    <Separator />

    <section aria-label="模型用量筛选"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><UsageFilter label="时间范围" value={range} onChange={(value) => setRange(value as ModelUsageRange)} options={modelUsageRangeOptions} /><UsageFilter label="模型服务" value={service} onChange={setService} options={[{ label: "全部模型服务", value: "all" }, ...services.map((item) => ({ label: item, value: item }))]} /><UsageFilter label="计费归属" value={attribution} onChange={setAttribution} options={[{ label: "全部部门 / 项目", value: "all" }, ...attributions.map((item) => ({ label: item, value: item }))]} /><UsageFilter label="模型" value={model} onChange={setModel} options={[{ label: "全部模型", value: "all" }, ...models.map((item) => ({ label: item, value: item }))]} /><UsageFilter label="API Key" value={apiKey} onChange={setApiKey} options={[{ label: "全部 API Key", value: "all" }, ...apiKeys.map((item) => ({ label: item, value: item }))]} /></div></section>

    <section aria-label="核心用量指标" className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">按调用时单价计算</span>} label="消费金额" value={`¥${totals.amount.toFixed(2)}`} /><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-brand">成功率 99.2%</span>} label="模型调用次数" value={totals.calls.toLocaleString("zh-CN")} /><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">输入 {totals.inputTokens.toFixed(1)}M · 输出 {totals.outputTokens.toFixed(1)}M</span>} label="总 Token" value={`${(totals.inputTokens + totals.cachedTokens + totals.outputTokens).toFixed(1)} M`} /><MetricCard className={usageMetricCardClass} footer={<span className="text-fg-subtle">每次调用的平均成本</span>} label="平均单次成本" value={totals.calls ? `¥${(totals.amount / totals.calls).toFixed(3)}` : "—"} /></section>

    <div className="flex flex-col gap-4"><Container><ContainerHeader className="px-4 py-2"><div><h2 className="text-body font-medium text-fg-default" id="spend-trend-title">消费趋势</h2></div><span className="text-label text-fg-subtle">单位：¥</span></ContainerHeader><ContainerBody className="px-2 pb-4 pt-0 sm:px-6"><section aria-labelledby="spend-trend-title"><ChartContainer className="aspect-auto h-[250px] w-full" config={spendChartConfig}><BarChart accessibilityLayer data={trendPoints} margin={{ left: 12, right: 12 }}><CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} /><XAxis axisLine={false} dataKey="date" minTickGap={32} tickFormatter={(value: string) => new Date(value).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} tickLine={false} tickMargin={8} /><ChartTooltip content={<ChartTooltipContent className="w-[150px]" labelFormatter={(value) => new Date(String(value)).toLocaleDateString("zh-CN", { month: "short", day: "numeric", year: "numeric" })} valueFormatter={(value) => `¥${Number(value).toFixed(2)}`} />} cursor={{ fill: "var(--surface-raised)" }} /><Bar dataKey="amount" fill="var(--color-amount)" /></BarChart></ChartContainer></section></ContainerBody></Container>
      <div className="grid gap-4 lg:grid-cols-2"><Container><ContainerHeader className="px-4 py-2"><h2 className="text-body font-medium text-fg-default" id="spend-breakdown-title">计费归属</h2><span className="text-label text-fg-subtle">按金额</span></ContainerHeader><ContainerBody className="flex items-center px-4 pb-4 pt-0"><section aria-labelledby="spend-breakdown-title" className="w-full">{attributionChartData.length ? <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center"><div className="relative shrink-0"><ChartContainer className="aspect-square h-52 min-h-0 w-52" config={attributionChartConfig}><PieChart><ChartTooltip content={<ChartTooltipContent hideIndicator labelFormatter={(label) => String(label)} valueFormatter={(value) => `¥${Number(value).toFixed(2)}`} />} cursor={false} /><Pie data={attributionChartData} dataKey="amount" innerRadius={58} nameKey="label" outerRadius={84} paddingAngle={2} stroke="var(--surface-raised)" strokeWidth={3}>{attributionChartData.map((item) => <Cell fill={item.fill} key={item.label} />)}</Pie></PieChart></ChartContainer><div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center"><span className="text-title font-semibold tabular-nums text-fg-default">¥{totals.amount.toFixed(0)}</span><span className="mt-0.5 text-label text-fg-muted">总消费</span></div></div><div className="w-full min-w-0 space-y-3">{attributionChartData.map((item) => <div className="flex items-center justify-between gap-3" key={item.label}><div className="flex min-w-0 items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} /><span className="truncate text-body text-fg-default">{item.label}</span></div><div className="shrink-0 text-right"><p className="text-body font-medium tabular-nums text-fg-default">¥{item.amount.toFixed(2)}</p><p className="mt-0.5 text-label tabular-nums text-fg-muted">{totals.amount ? `${(item.amount / totals.amount * 100).toFixed(1)}%` : "—"}</p></div></div>)}</div></div> : <div className="flex h-48 items-center justify-center text-body text-fg-muted">当前筛选条件下没有计费归属。</div>}</section></ContainerBody></Container><Container><ContainerHeader className="px-4 py-2"><h2 className="text-body font-medium text-fg-default" id="model-share-title">模型占比</h2><span className="text-label text-fg-subtle">按金额</span></ContainerHeader><ContainerBody className="flex items-center px-2 pb-4 pt-0"><section aria-labelledby="model-share-title" className="w-full space-y-2.5">{modelShareRows.length ? modelShareRows.map(([label, amount]) => <div className="relative flex h-10 overflow-hidden rounded-lg bg-hover px-2.5" key={label}><span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-brand/15" style={{ width: `${totals.amount ? amount / totals.amount * 100 : 0}%` }} /><div className="relative flex w-full items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-label text-fg-default"><span className="flex size-5 shrink-0 items-center justify-center text-fg-muted"><ModelLogo model={label} size={16} /></span><span className="truncate">{label}</span></div><div className="shrink-0 text-right"><span className="block text-label font-medium tabular-nums text-fg-default">¥{amount.toFixed(2)}</span><span className="block text-label tabular-nums text-fg-muted">{totals.amount ? `${(amount / totals.amount * 100).toFixed(1)}%` : "—"}</span></div></div></div>) : <div className="flex h-48 items-center justify-center text-body text-fg-muted">当前筛选条件下没有模型调用。</div>}</section></ContainerBody></Container></div></div>

    <section aria-labelledby="model-usage-details-title"><div className="flex items-baseline justify-between gap-3"><div><h2 className="text-body font-medium text-fg-default" id="model-usage-details-title">消费明细</h2><p className="mt-1 text-label text-fg-muted">按 API Key、模型服务和模型汇总；计费归属取调用发生时的快照。</p></div><span className="shrink-0 text-label text-fg-subtle">{totals.calls.toLocaleString("zh-CN")} 次调用</span></div><ModelUsageDetailsTable records={filteredRecords} /></section>
  </div>;
}

function UsageFilter({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: readonly { label: string; value: string }[]; value: string }) {
  return <div className="min-w-0"><Select onValueChange={onChange} size="md" value={value}><SelectTrigger aria-label={label} className="w-full" prefix={<><span>{label}</span><span aria-hidden className="h-4 w-px bg-border" /></>} /><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
}

function ModelUsageDetailsTable({ records }: { records: readonly ModelUsageRecord[] }) {
  const data = useMemo(() => [...records], [records]);
  const filterOptions = useMemo(() => ({
    attributions: [...new Set(records.map((record) => record.attribution))].map((value) => ({ label: value, value })),
    models: [...new Set(records.map((record) => record.model))].map((value) => ({ label: value, value })),
    services: [...new Set(records.map((record) => record.service))].map((value) => ({ label: value, value })),
  }), [records]);
  const columns = useMemo<ColumnDef<ModelUsageRecord, unknown>[]>(() => [
    { accessorKey: "date", header: ({ column }) => <DataTableColumnHeader column={column} label="日期" />, cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.date.slice(5).replace("-", "/")}</span> },
    { accessorKey: "apiKey", header: ({ column }) => <DataTableColumnHeader column={column} label="API Key" />, meta: { label: "API Key", placeholder: "搜索 API Key", variant: "text" }, cell: ({ row }) => <span className="font-mono text-label text-fg-muted">{row.original.apiKey}</span> },
    { accessorKey: "service", header: ({ column }) => <DataTableColumnHeader column={column} label="模型服务" />, filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))), meta: { label: "模型服务", options: filterOptions.services, variant: "multiSelect" }, cell: ({ row }) => <span className="font-medium text-fg-default">{row.original.service}</span> },
    { accessorKey: "model", header: ({ column }) => <DataTableColumnHeader column={column} label="模型" />, filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))), meta: { label: "模型", options: filterOptions.models, variant: "multiSelect" }, cell: ({ row }) => <span className="flex items-center gap-1.5"><ModelLogo model={row.original.model} /><span>{row.original.model}</span></span> },
    { accessorKey: "attribution", header: ({ column }) => <DataTableColumnHeader column={column} label="计费归属" />, filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id))), meta: { label: "计费归属", options: filterOptions.attributions, variant: "multiSelect" }, cell: ({ row }) => <span>{row.original.attribution}</span> },
    { accessorKey: "calls", header: ({ column }) => <DataTableColumnHeader className="justify-end" column={column} label="调用次数" />, cell: ({ row }) => <span className="block text-right tabular-nums">{row.original.calls.toLocaleString("zh-CN")}</span> },
    { id: "tokens", accessorFn: (row) => row.inputTokens + row.cachedTokens + row.outputTokens, header: ({ column }) => <DataTableColumnHeader className="justify-end" column={column} label="Token" />, cell: ({ row }) => <span className="block text-right tabular-nums text-fg-muted">{(row.original.inputTokens + row.original.cachedTokens + row.original.outputTokens).toFixed(1)}M</span> },
    { accessorKey: "amount", header: ({ column }) => <DataTableColumnHeader className="justify-end" column={column} label="金额" />, cell: ({ row }) => <span className="block text-right font-medium tabular-nums text-fg-default">¥{row.original.amount.toFixed(2)}</span> },
  ], [filterOptions]);
  const { table } = useDataTable({ columns, data, getRowId: (record) => record.id, initialState: { pagination: { pageIndex: 0, pageSize: 5 }, sorting: [{ id: "date", desc: true }] } });

  return <DataTable className="mt-4 gap-2.5 [&_[data-slot=data-table-pagination]]:px-2" emptyMessage="当前筛选条件下没有模型调用。" table={table}><DataTableToolbar showViewOptions={false} table={table} /></DataTable>;
}

function UsageSettings({ data }: { data: PersonalSettingsUsageData }) {
  const MessageIcon = useIcon("message-circle");
  const ToolIcon = useIcon("settings");
  const [activityView, setActivityView] = useState<ActivityView>("tokens");
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>("week");
  const heatmapColor = ["bg-hover", "bg-brand/30", "bg-brand/60", "bg-brand"] as const;
  const heatmapActivity = activityView === "tokens" ? data.tokenHeatmapActivity : data.messageHeatmapActivity;
  const selectedUsagePeriod = usagePeriodOptions.find((option) => option.value === usagePeriod)!;
  const rankRows = (rows: readonly UsageRankRowData[]) => rows.slice(0, 5).map((row) => ({ ...row, icon: row.icon === "deepseek" ? <DeepSeekColor size={16} /> : row.icon === "openai" ? <OpenAIMono size={15} /> : row.icon === "glm" ? <ChatGLMColor size={16} /> : row.icon === "jira" ? <span className="flex size-4 items-center justify-center rounded-sm bg-brand text-label font-bold text-fg-on-brand">J</span> : row.icon === "tool" ? <ToolIcon size={16} strokeWidth={1.5} /> : <MessageIcon size={16} strokeWidth={1.5} /> }));

  return <div className="space-y-5 py-1">
    <header><h1 className="text-heading font-semibold text-fg-default">{data.greeting}</h1></header>

    <section aria-labelledby="usage-period-title"><div className="flex items-center"><div aria-label={`最近${selectedUsagePeriod.label}使用情况`} className="flex items-center text-body font-medium text-fg-default" id="usage-period-title" role="heading" aria-level={2}><span>最近</span><Select onValueChange={(value) => setUsagePeriod(value as UsagePeriod)} size="sm" value={usagePeriod}><SelectTrigger aria-label="使用情况周期" className="h-auto min-w-0 !border-0 rounded-md bg-surface-base px-1.5 py-1 text-body font-medium hover:bg-surface-base" variant="borderless" wrapperClassName="mx-1" /><SelectContent align="start">{usagePeriodOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><span>使用情况</span></div></div><div className="mt-3 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.metricsByPeriod[usagePeriod].map((metric) => <MetricCard className={usageMetricCardClass} footer={<span className={cn(metric.positive === true ? "text-fg-brand" : metric.positive === false ? "text-fg-muted" : "text-fg-subtle")}><span className="font-medium">{metric.change}</span> {metric.detail}</span>} key={metric.label} label={metric.label} value={metric.value} />)}</div></section>

    <div className="grid gap-5 lg:grid-cols-3"><UsageRank title="模型使用率" subtitle={`模型 / ${selectedUsagePeriod.label}消息数`} rows={rankRows(data.ranksByPeriod[usagePeriod].models)} /><UsageRank title="MCP 使用率" subtitle={`助手 / ${selectedUsagePeriod.label}话题数`} rows={rankRows(data.ranksByPeriod[usagePeriod].mcp)} /><UsageRank title="话题内容量" subtitle={`话题 / ${selectedUsagePeriod.label}消息数`} rows={rankRows(data.ranksByPeriod[usagePeriod].topics)} /></div>

    <Separator />

    <Container>
      <ContainerHeader className="px-4 py-0">
        <h2 className="text-body font-medium text-fg-default" id="yearly-activity-title">最近一年活跃度</h2>
        <Tabs aria-label="最近一年活跃度视角" color="neutral" onValueChange={(value) => setActivityView(value as ActivityView)} value={activityView} variant="segment">
          <TabsList className="my-0">
            <TabItem label="Token" value="tokens" />
            <TabItem label="消息数" value="messages" />
          </TabsList>
        </Tabs>
      </ContainerHeader>
      <ContainerBody className="p-3 sm:p-4">
        <section aria-labelledby="yearly-activity-title"><div className="overflow-x-auto pb-1"><div className="min-w-[720px]"><div className="grid grid-cols-12 gap-2">{data.months.map((month, monthIndex) => <div key={month}><p className="text-label text-fg-subtle">{month}</p><div className="mt-2 grid grid-flow-col grid-rows-7 gap-1">{Array.from({ length: 28 }, (_, index) => { const week = Math.floor(index / 7); const day = index % 7; const level = heatmapActivity[`${monthIndex}-${week}-${day}`] ?? 0; return <span aria-hidden className={cn("aspect-square rounded-[2px]", heatmapColor[level])} key={index} />; })}</div></div>)}</div></div></div><div className="mt-3 flex items-center justify-end gap-1.5 text-label text-fg-subtle"><span>较少</span>{heatmapColor.map((color, index) => <span aria-hidden className={cn("size-3 rounded-[2px]", color)} key={index} />)}<span>较多</span></div></section>
      </ContainerBody>
      <ContainerFooter className="grid grid-cols-2 items-start justify-stretch gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-4">{data.summaries.map((summary) => <div key={summary.label}><p className="text-body font-semibold tabular-nums text-fg-default">{summary.value}</p><p className="mt-0.5 text-label text-fg-muted">{summary.label}</p></div>)}</ContainerFooter>
    </Container>
  </div>;
}

function UsageRank({ rows, subtitle, title }: { rows: readonly { label: string; value: string; fill: string; icon: ReactNode }[]; subtitle: string; title: string }) {
  return <section aria-label={title}><div className="flex items-baseline justify-between"><h2 className="text-body font-medium text-fg-default">{title}</h2><span className="text-label text-fg-subtle">{subtitle}</span></div><div className="mt-3 space-y-2.5">{rows.map((row) => <div className="relative overflow-hidden rounded-lg bg-hover px-2.5 py-2" key={row.label}><span aria-hidden className="absolute inset-y-0 left-0 rounded-lg bg-brand/15" style={{ width: row.fill }} /><div className="relative flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-label text-fg-default"><span className="flex size-5 shrink-0 items-center justify-center text-fg-muted">{row.icon}</span><span className="truncate">{row.label}</span></div><span className="shrink-0 text-label font-medium tabular-nums text-fg-default">{row.value}</span></div></div>)}</div></section>;
}
