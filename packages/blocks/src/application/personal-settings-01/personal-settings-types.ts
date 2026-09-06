export type PersonalSettingsView = "models" | "keys" | "credentials" | "profile" | "preferences" | "usage" | "modelUsage" | "callLogs";
export type PersonalSettingsStatus = "正常" | "已用尽" | "需要重新获取";

export interface PersonalSettingsModelService {
  id: string;
  name: string;
  endpoint: string;
  provider: "glm" | "openai" | "deepseek";
  models: readonly string[];
  status: PersonalSettingsStatus;
  usage: string;
}

export interface PersonalSettingsApiKey {
  id: string;
  name: string;
  value: string;
  createdAt?: string;
  lastUsed: string;
  status: PersonalSettingsStatus;
}

export interface PersonalSettingsCredential {
  id: string;
  name: string;
  value: string;
  brand: "github" | "postgresql" | "slack";
  status: PersonalSettingsStatus;
}

export interface PersonalSettingsDevice {
  id: string;
  name: string;
  lastActive: string;
  location: string;
  current?: boolean;
}

export interface PersonalSettingsProfile {
  displayName: string;
  email: string;
  avatarLabel?: string;
  devices?: readonly PersonalSettingsDevice[];
}

export type PersonalSettingsUsagePeriod = "hour" | "day" | "week" | "month";
export type PersonalSettingsUsageRankIcon = "deepseek" | "openai" | "glm" | "jira" | "tool" | "message";

export interface PersonalSettingsUsageMetric {
  label: string;
  value: string;
  change: string;
  detail: string;
  positive?: boolean;
}

export interface PersonalSettingsUsageRank {
  label: string;
  value: string;
  fill: string;
  icon: PersonalSettingsUsageRankIcon;
}

export interface PersonalSettingsUsageData {
  greeting?: string;
  metricsByPeriod: Record<PersonalSettingsUsagePeriod, readonly PersonalSettingsUsageMetric[]>;
  ranksByPeriod: Record<PersonalSettingsUsagePeriod, {
    models: readonly PersonalSettingsUsageRank[];
    mcp: readonly PersonalSettingsUsageRank[];
    topics: readonly PersonalSettingsUsageRank[];
  }>;
  months: readonly string[];
  tokenHeatmapActivity: Readonly<Record<string, 1 | 2 | 3>>;
  messageHeatmapActivity: Readonly<Record<string, 1 | 2 | 3>>;
  summaries: readonly { value: string; label: string }[];
}

export interface PersonalSettingsModelUsageRecord {
  id: string;
  date: string;
  apiKey: string;
  service: string;
  model: string;
  attribution: string;
  calls: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  amount: number;
}

export interface PersonalSettingsModelUsageData {
  accountBalance: string;
  records: readonly PersonalSettingsModelUsageRecord[];
}

export type PersonalSettingsCallLogKind = "model" | "mcp";
export type PersonalSettingsCallLogStatus = "success" | "degraded" | "failed";

export interface PersonalSettingsCallLogRecord {
  id: string;
  timestamp: number;
  time: string;
  kind: PersonalSettingsCallLogKind;
  status: PersonalSettingsCallLogStatus;
  code: string;
  requested: string;
  actual: string;
  service: string;
  attribution: string;
  apiKey: string;
  tokens?: number;
  firstTokenMs?: number;
  durationMs: number;
  amount?: number;
  runId: string;
  summary: string;
  operation?: "只读" | "外部写入";
  upstreamId?: string;
  detail?: string;
}

export interface PersonalSettingsCallLogRun {
  id: string;
  timestamp: number;
  time: string;
  status: PersonalSettingsCallLogStatus;
  prompt: string;
  modelCalls: number;
  mcpCalls: number;
  tokens: number;
  durationMs: number;
  amount: number;
  detail: string;
}

export interface PersonalSettingsCallLogsData {
  records: readonly PersonalSettingsCallLogRecord[];
  runs: readonly PersonalSettingsCallLogRun[];
}

export interface PersonalSettingsPreferences {
  theme: string;
  highContrast: string;
  enterAddsLine: boolean;
  language: string;
  numberFormat: string;
  textDirectionControls: boolean;
  startWeekOnMonday: boolean;
  dateFormat: string;
  automaticTimeZone: boolean;
  timeZone: string;
}

/** Data supplied by a product integration. Omitted values use the Block demo data. */
export interface PersonalSettingsData {
  modelServices?: readonly PersonalSettingsModelService[];
  apiKeys?: readonly PersonalSettingsApiKey[];
  credentials?: readonly PersonalSettingsCredential[];
  profile?: PersonalSettingsProfile;
  usage?: PersonalSettingsUsageData;
  modelUsage?: PersonalSettingsModelUsageData;
  callLogs?: PersonalSettingsCallLogsData;
  preferences?: PersonalSettingsPreferences;
}

export interface PersonalSettingsActions {
  onCreateApiKey?: () => void | Promise<void>;
  onCreateCredential?: () => void | Promise<void>;
  onCopyApiKey?: (apiKey: PersonalSettingsApiKey) => void | Promise<void>;
  onModelServiceAction?: (service: PersonalSettingsModelService, action: "edit" | "remove") => void | Promise<void>;
  onApiKeyAction?: (apiKey: PersonalSettingsApiKey, action: "rotate" | "revoke") => void | Promise<void>;
  onCredentialAction?: (credential: PersonalSettingsCredential, action: "edit" | "remove") => void | Promise<void>;
  /** Security-sensitive profile actions are delegated to the host application. */
  onProfileAction?: (action: PersonalSettingsProfileAction, input: PersonalSettingsProfileActionInput) => void | Promise<void>;
  /** Persist a complete replacement for the supplied preferences data. */
  onPreferencesChange?: (preferences: PersonalSettingsPreferences) => void | Promise<void>;
}

export type PersonalSettingsProfileAction = "save-profile" | "email" | "password" | "verification" | "passkey" | "delete" | "logout-all" | "logout-device";

export interface PersonalSettingsProfileActionInput {
  preferredName?: string;
  email?: string;
  deviceId?: string;
}

export interface PersonalSettingsOperationState {
  /** Resource/action keys currently pending, e.g. `api-key:key-live:revoke`. */
  pending?: readonly string[];
  /** A server-provided operation failure. No local success state is inferred. */
  error?: string | null;
}

export type PersonalSettingsLoadingState = Partial<Record<PersonalSettingsView, boolean>>;

export interface PersonalSettingsLabels {
  resourceNavigation?: string;
  personalNavigation?: string;
  /** Per-view heading and search copy supplied by the host product. */
  views?: Partial<Record<PersonalSettingsView, {
    title?: string;
    description?: string;
    search?: string;
  }>>;
  /** Sidebar destination labels. Values omitted here retain the component defaults. */
  navigation?: Partial<Record<PersonalSettingsView, string>>;
}
