import type { SecurityOverviewCounts, SecurityOverviewFinding, SecurityOverviewRange, SecurityOverviewSnapshot } from "./security-overview-types";

const asOf = Date.UTC(2026, 9, 5, 4, 0);
const day = 86_400_000;
const assetNames = ["api.northwind.example", "auth.northwind.example", "console.northwind.example", "data.northwind.example", "worker.northwind.example", "cdn.northwind.example"];
const findingSeeds = [
  ["路径遍历可能读取任意文件", "critical", 9.6, 0],
  ["会话接口接受未签名令牌", "critical", 9.3, 1],
  ["搜索页存在反射型脚本注入", "high", 7.2, 2],
  ["接口速率限制未启用", "high", 7.1, 0],
  ["密钥轮换策略未配置", "high", 7, 3],
  ["过期依赖包含已知风险", "high", 6.9, 4],
  ["管理入口缺少二次验证", "high", 6.8, 1],
  ["安全响应头不完整", "medium", 5.6, 2],
  ["存储访问策略过于宽泛", "medium", 5.4, 3],
  ["跨域访问策略需要收紧", "medium", 5.1, 0],
  ["缓存策略暴露内部信息", "medium", 4.7, 5],
  ["服务版本信息可公开读取", "low", 2.2, 0],
  ["错误页面包含调试标识", "low", 1.8, 2],
] as const;

/** Fixed demonstration data; no security scanner, random values or external requests. */
export function createSecurityOverviewDemoData(range: SecurityOverviewRange = "30d", afterScan = false): SecurityOverviewSnapshot {
  const findings: SecurityOverviewFinding[] = findingSeeds.map(([title, severity, score, asset], index) => ({ id: `finding-${index}`, title, severity, score, assetId: `asset-${asset}`, assetName: assetNames[asset], detectedAt: asOf - (index + 1) * day }));
  if (afterScan) findings.push({ id: "finding-new", title: "导出接口缺少访问范围校验", severity: "high", score: 7.8, assetId: "asset-0", assetName: assetNames[0], detectedAt: asOf + 300_000 });
  const count = (items: SecurityOverviewFinding[]): SecurityOverviewCounts => ({ critical: items.filter((item) => item.severity === "critical").length, high: items.filter((item) => item.severity === "high").length, medium: items.filter((item) => item.severity === "medium").length, low: items.filter((item) => item.severity === "low").length });
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const updatedAt = asOf + (afterScan ? 300_000 : 0);
  const current = count(findings);
  return {
    id: `northwind-scan-${afterScan ? 2 : 1}`, scopeId: "northwind", range, asOf: updatedAt,
    window: { start: updatedAt - days * day, end: updatedAt, comparisonAt: updatedAt - days * day },
    score: afterScan ? 75 : 77, grade: "B", scoreTone: "success", previousScore: range === "7d" ? 71 : range === "30d" ? 64 : 58,
    openBySeverity: current, resolvedInWindow: range === "7d" ? 3 : range === "30d" ? 21 : 58,
    scannedAssetCount: 26, newAssetsInWindow: range === "7d" ? 0 : range === "30d" ? 2 : 8,
    affectedAssetCount: 6, medianFixTimeHours: range === "7d" ? 38.4 : range === "30d" ? 57.6 : 72,
    lastScanAt: afterScan ? updatedAt : asOf - 14 * 60_000,
    trend: Array.from({ length: days + 1 }, (_, index) => {
      const remaining = days - index;
      return { at: updatedAt - remaining * day, counts: { critical: current.critical + Math.floor(remaining / 14), high: current.high + Math.floor(remaining / 9), medium: current.medium + Math.floor(remaining / 7), low: current.low + Math.floor(remaining / 16) } };
    }),
    posture: [
      { id: "auth", label: "身份验证", score: 62, previousScore: 54 },
      { id: "api", label: "API", score: 70, previousScore: 61 },
      { id: "web", label: "Web 应用", score: 74, previousScore: 77 },
      { id: "data", label: "数据与密钥", score: 76, previousScore: 63 },
      { id: "deps", label: "依赖", score: 88, previousScore: 84 },
      { id: "infra", label: "基础设施", score: 84, previousScore: 79 },
    ].map((area) => ({ ...area, previousScore: range === "7d" ? Math.round((area.previousScore + area.score) / 2) : range === "90d" ? area.previousScore - 6 : area.previousScore })),
    findings,
    assets: assetNames.map((name, index) => ({ id: `asset-${index}`, name, kind: "主机", lastScannedAt: afterScan ? updatedAt : asOf - 14 * 60_000, findings: count(findings.filter((finding) => finding.assetId === `asset-${index}`)) })),
  };
}

export const securityOverviewDemoData = createSecurityOverviewDemoData();
