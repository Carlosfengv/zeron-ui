import type { ProjectMonitorData } from "./project-monitor-types";

export const projectMonitorDemoData: ProjectMonitorData = {
  project: {
    id: "solstice", name: "Solstice", region: "US-EAST-1", endpoint: "solstice.example.com",
    health: "healthy",
    facts: [
      { id: "compute", label: "计算规格", value: "Nano", icon: "monitor" },
      { id: "repository", label: "代码仓库", value: "novaform-labs/solstice", icon: "square-library" },
      { id: "branch", label: "最近分支", value: "暂无分支", icon: "corner-down-right" },
      { id: "migration", label: "最近迁移", value: "invoice_retry_backfill", icon: "list-checks" },
      { id: "backup", label: "最近备份", value: "今天 10:00", icon: "file-archive" },
    ],
  },
  metrics: [
    { id: "cpu", label: "处理器", value: 16, capacity: 100, unit: "%" },
    { id: "memory", label: "内存", value: 62, capacity: 100, unit: "%" },
    { id: "disk", label: "磁盘", value: 18, capacity: 100, unit: "%" },
    { id: "connections", label: "连接数", value: 19, capacity: 60, unit: "个" },
    { id: "bandwidth", label: "带宽", value: 4.7, unit: "MB/s" },
  ],
  storage: {
    capacityBytes: 8e9,
    categories: [
      { id: "images", label: "图片", bytes: 1.12e9, color: "orange" },
      { id: "documents", label: "文档", bytes: .64e9, color: "blue" },
      { id: "backups", label: "备份", bytes: .41e9, color: "green" },
      { id: "other", label: "其他", bytes: .24e9, color: "gray" },
    ],
    buckets: [
      { id: "avatars", name: "avatars", access: "public", files: 1284, bytes: 412e6, updatedAt: Date.UTC(2026, 9, 5, 3, 10) },
      { id: "uploads", name: "uploads", access: "private", files: 8931, bytes: 1292e6, updatedAt: Date.UTC(2026, 9, 5, 2, 58) },
      { id: "exports", name: "exports", access: "private", files: 212, bytes: 296e6, updatedAt: Date.UTC(2026, 9, 5, 2, 12) },
      { id: "backups", name: "backups", access: "private", files: 38, bytes: 410e6, updatedAt: Date.UTC(2026, 9, 4, 3, 12) },
    ],
  },
  windows: [60, 360, 1440].map((minutes, rangeIndex) => ({
    id: `${minutes}m`, label: minutes === 60 ? "最近 60 分钟" : minutes === 360 ? "最近 6 小时" : "最近 24 小时",
    start: Date.UTC(2026, 9, 5, 3, 12) - minutes * 60000, end: Date.UTC(2026, 9, 5, 3, 12),
    services: ([
      { id: "gateway", name: "Gateway", color: "blue" },
      { id: "auth", name: "Auth", color: "orange" },
      { id: "functions", name: "Function", color: "green" },
      { id: "storage", name: "Storage", color: "purple" },
    ] as const).map((service, serviceIndex) => ({ ...service,
      buckets: Array.from({ length: 60 }, (_, index) => ({
        success: (index * 7 + serviceIndex * 3) % (serviceIndex + 4) === 0 ? 0 : Math.max(0, Math.round((2 + Math.sin(index * .7 + serviceIndex) * 2) * (4 - serviceIndex) * (rangeIndex + 1))),
        warning: (index + serviceIndex * 5) % 23 === 0 ? rangeIndex + 1 : 0,
        errors: serviceIndex === 3 && index === 17 ? rangeIndex + 1 : 0,
      })),
    })),
    latency: { p50: 84 + rangeIndex * 8, p95: 312 + rangeIndex * 31, p99: 890 + rangeIndex * 45 }, latencyScaleMs: 1000,
  })),
  updatedAt: Date.UTC(2026, 9, 5, 3, 12),
};
