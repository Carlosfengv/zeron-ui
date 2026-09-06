import type { PersonalSettingsData } from "./personal-settings-types";

/**
 * Documentation-only defaults. Product integrations should pass `data` to
 * PersonalSettings instead of importing or mutating these records.
 */
export const personalSettingsDemoData: Required<Pick<PersonalSettingsData, "apiKeys" | "credentials" | "modelServices" | "profile">> = {
  modelServices: [
    { id: "default", name: "默认模型服务", endpoint: "https://api.zentrix.dev/v1", provider: "glm", models: ["gpt-4.1", "DeepSeek-v4-pro", "DeepSeek-v4-flash", "GLM-5-Turbo"], status: "正常", usage: "400 M" },
    { id: "glm", name: "GLM 模型组", endpoint: "https://open.bigmodel.cn/api/paas/v4", provider: "glm", models: ["GLM-5-Turbo", "GLM-4.6"], status: "已用尽", usage: "800.2 M" },
    { id: "deepseek", name: "DeepSeek Production", endpoint: "https://api.deepseek.com", provider: "deepseek", models: ["DeepSeek-v4-pro", "DeepSeek-v4-flash"], status: "需要重新获取", usage: "—" },
  ],
  apiKeys: [
    { id: "key-live", name: "Production automation", value: "zx_live_••••••••C4hA", createdAt: "2026-08-10", lastUsed: "2 分钟前", status: "正常" },
    { id: "key-dev", name: "Local development", value: "zx_dev_••••••••M2pQ", createdAt: "2026-07-26", lastUsed: "昨天", status: "正常" },
    { id: "key-old", name: "Legacy integration", value: "zx_live_••••••••K9rD", createdAt: "2026-06-12", lastUsed: "30 天前", status: "需要重新获取" },
    { id: "key-staging", name: "Staging gateway", value: "zx_test_••••••••R7vE", createdAt: "2026-08-05", lastUsed: "3 小时前", status: "正常" },
    { id: "key-analytics", name: "Usage analytics", value: "zx_live_••••••••A9kL", createdAt: "2026-07-18", lastUsed: "4 天前", status: "正常" },
    { id: "key-webhook", name: "Webhook delivery", value: "zx_live_••••••••W8sN", createdAt: "2026-07-11", lastUsed: "1 小时前", status: "正常" },
    { id: "key-playground", name: "Team playground", value: "zx_dev_••••••••P6xQ", createdAt: "2026-07-02", lastUsed: "6 天前", status: "正常" },
    { id: "key-embed", name: "Embed service", value: "zx_live_••••••••E2mB", createdAt: "2026-06-28", lastUsed: "昨天", status: "正常" },
    { id: "key-agent", name: "Agent runtime", value: "zx_live_••••••••G5dT", createdAt: "2026-06-21", lastUsed: "刚刚", status: "正常" },
    { id: "key-notebook", name: "Research notebook", value: "zx_dev_••••••••N1rC", createdAt: "2026-06-14", lastUsed: "12 天前", status: "正常" },
    { id: "key-migration", name: "Migration worker", value: "zx_live_••••••••M3uF", createdAt: "2026-06-06", lastUsed: "45 天前", status: "需要重新获取" },
    { id: "key-support", name: "Support console", value: "zx_live_••••••••S8pJ", createdAt: "2026-05-29", lastUsed: "2 天前", status: "正常" },
    { id: "key-evaluation", name: "Evaluation suite", value: "zx_dev_••••••••V4hD", createdAt: "2026-05-17", lastUsed: "20 天前", status: "正常" },
    { id: "key-archive", name: "Archive importer", value: "zx_live_••••••••H7qR", createdAt: "2026-04-30", lastUsed: "90 天前", status: "需要重新获取" },
  ],
  credentials: [
    { id: "postgres", name: "Postgres Readonly", value: "DSN URL", brand: "postgresql", status: "正常" },
    { id: "github", name: "GitHub App", value: "App token", brand: "github", status: "正常" },
    { id: "slack", name: "Slack workspace", value: "Bot token", brand: "slack", status: "需要重新获取" },
    { id: "postgres-primary", name: "Postgres Primary", value: "DSN URL", brand: "postgresql", status: "正常" },
    { id: "github-deploy", name: "GitHub Deploy Bot", value: "Fine-grained token", brand: "github", status: "正常" },
    { id: "slack-alerts", name: "Slack Alerts", value: "Webhook URL", brand: "slack", status: "正常" },
    { id: "postgres-analytics", name: "Analytics Warehouse", value: "Connection string", brand: "postgresql", status: "正常" },
    { id: "github-issues", name: "GitHub Issues Sync", value: "App token", brand: "github", status: "正常" },
    { id: "slack-research", name: "Research Workspace", value: "Bot token", brand: "slack", status: "正常" },
    { id: "postgres-staging", name: "Postgres Staging", value: "DSN URL", brand: "postgresql", status: "正常" },
    { id: "github-actions", name: "GitHub Actions", value: "Installation token", brand: "github", status: "需要重新获取" },
    { id: "slack-ops", name: "Operations Slack", value: "Webhook URL", brand: "slack", status: "正常" },
    { id: "postgres-backup", name: "Backup Database", value: "Connection string", brand: "postgresql", status: "正常" },
    { id: "github-docs", name: "GitHub Docs Sync", value: "Fine-grained token", brand: "github", status: "正常" },
    { id: "slack-legacy", name: "Legacy Slack Bot", value: "Bot token", brand: "slack", status: "需要重新获取" },
  ],
  profile: {
    displayName: "Carlos",
    email: "carlos@zentrix.dev",
    avatarLabel: "C",
    devices: [
      { id: "current", name: "macOS", lastActive: "现在", location: "中国上海", current: true },
      { id: "office", name: "macOS", lastActive: "今天 17:51", location: "中国上海" },
      { id: "travel", name: "macOS", lastActive: "7 月 16 日 12:57", location: "日本东京" },
    ],
  },
};
