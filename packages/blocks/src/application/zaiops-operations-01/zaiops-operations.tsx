"use client";

import { OperationsWorkspaceShell, type OperationsWorkspaceOptions } from "../operations-workspace-shell-01";

import { type ReactNode } from "react";
import { type UserAccountProps } from "../user-account-01";
import { Badge } from "@zeron/ui/badge";
import { MetricCard } from "@zeron/ui/metric-card";
import { PageBody, PageContent } from "@zeron/ui/page-layout";
import { SidebarIdentityAvatar } from "@zeron/ui/sidebar-identity-row";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { useIcon } from "@zeron/ui/system/icon-context";
type Environment = { name: string; description: string; plan: string };

const environments: readonly Environment[] = [
  { name: "金融核心环境", description: "生产 · 核心支付业务", plan: "金融生产巡检v3.2" },
  { name: "金融核心环境2", description: "生产 · 订单与供应链", plan: "生产标准巡检v3.2" },
  { name: "金融核心环境3", description: "生产 · 订单与供应链", plan: "灾备巡检v2.1" },
];

function HealthSummary() {
  return <MetricCard className="border-info-border bg-info-surface [&_[data-slot=metric-card-value-row]>span:first-child]:text-fg-brand" footer="整体健康度 82 分" label="健康状态" value="一切正常" />;
}

function EnvironmentIcon() {
  const Layers = useIcon("doc-surfaces");
  return <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info-surface text-fg-brand"><Layers size={18} strokeWidth={1.5} /></span>;
}

function OperationsDashboard({ title, description, children }: Pick<ZaiopsOperationsProps, "title" | "description" | "children">) {
  const Check = useIcon("check");
  const Mail = useIcon("mail");
  const Clock = useIcon("clock");
  const User = useIcon("user");
  return <PageBody className="p-3"><div className="space-y-3">
    <header className="px-0.5 py-3"><h1 className="text-heading font-semibold text-fg-default">{title}</h1><p className="mt-1 text-body text-fg-muted">{description}</p></header>
    <section aria-label="环境概览" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><HealthSummary /><MetricCard footer="1 项正在处理" label="开放风险" value="0" /><MetricCard footer="全部环境已更新" label="数据新鲜度" value="12:32" /><MetricCard footer="方案 P-77 v1" label="待客户决定" value="0" /><MetricCard footer="Zstack 原厂 ｜ 华东渠道" label="服务方" value="2" /></section>
    <section aria-labelledby="manager-title" className="rounded-xl border-hairline border-border bg-surface-raised px-3 py-3"><h2 className="text-body text-fg-muted" id="manager-title">您的专属客户经理:</h2><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2"><div className="flex items-center gap-2"><SidebarIdentityAvatar className="rounded-lg" tone="brand">王</SidebarIdentityAvatar><span className="text-body font-medium text-fg-default">王敏</span><span className="text-body text-fg-muted">Zstack 售后工程师</span></div><span className="flex items-center gap-1.5 text-body text-fg-default"><User aria-hidden size={18} strokeWidth={1.5} />131 1111 1111 <span className="text-fg-muted">(09:00~16:00)</span></span><span className="flex items-center gap-1.5 text-body text-fg-default"><Mail aria-hidden size={18} strokeWidth={1.5} />username@example.com</span></div></section>
    <section aria-labelledby="environments-title" className="rounded-xl border-hairline border-border bg-surface-raised p-1"><div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5"><div className="flex flex-wrap items-center gap-3"><h2 className="text-body font-medium text-fg-default" id="environments-title">所有环境健康，未发现风险</h2><span aria-label="当前供 3 个环境" className="flex items-center gap-1"><span className="size-4 rounded bg-brand" /><span className="size-4 rounded bg-brand" /><span className="size-4 rounded bg-brand" /><span className="ml-1 text-label text-fg-muted">当前供 3 个环境</span></span></div><span className="flex items-center gap-1 text-label text-fg-subtle"><Clock aria-hidden size={14} strokeWidth={1.5} />数据更新于 3 分钟前</span></div>
      <div className="overflow-x-auto rounded-lg border-hairline border-border bg-surface-floating"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead scope="col">环境名称</TableHead><TableHead scope="col">状态</TableHead><TableHead scope="col">巡检方案</TableHead><TableHead scope="col">健康结论</TableHead><TableHead scope="col">P0 风险</TableHead><TableHead scope="col">P1 风险</TableHead><TableHead scope="col">数据状态</TableHead></TableRow></TableHeader><TableBody>{environments.map((environment, index) => <TableRow index={index} key={environment.name}><TableCell className="min-w-64"><div className="flex items-center gap-2"><EnvironmentIcon /><div className="min-w-0"><p className="truncate font-medium text-fg-default">{environment.name}</p><p className="truncate text-label text-fg-subtle">{environment.description}</p></div></div></TableCell><TableCell><Badge status="info" size="sm" variant="dot">已连接</Badge></TableCell><TableCell className="whitespace-nowrap">{environment.plan}</TableCell><TableCell><span className="flex items-center gap-1.5 whitespace-nowrap"><Badge color="blue" size="sm" variant="strong">86</Badge><span className="text-fg-default">健康</span></span></TableCell><TableCell className="tabular-nums text-fg-danger">0</TableCell><TableCell className="tabular-nums text-fg-danger">0</TableCell><TableCell className="whitespace-nowrap">3 分钟前</TableCell></TableRow>)}</TableBody></Table></div>
    </section>
    <section aria-labelledby="impact-title" className="rounded-xl border-hairline border-border bg-surface-raised p-1"><div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5"><h2 className="text-body font-medium text-fg-default" id="impact-title">业务影响范围</h2><span className="text-label text-fg-subtle">数据更新于 3 分钟前</span></div><div className="flex items-center gap-1.5 rounded-lg border-hairline border-border bg-surface-floating px-3 py-3 text-label text-fg-muted"><span className="flex size-4 items-center justify-center rounded-full bg-brand/15 text-fg-brand"><Check aria-hidden size={12} strokeWidth={2} /></span>没有影响到业务</div></section>
    {children && <div>{children}</div>}
  </div></PageBody>;
}

export interface ZaiopsOperationsProps {
  workspace?: OperationsWorkspaceOptions; title?: string; description?: string; children?: ReactNode; className?: string; account?: UserAccountProps | null; }

/** A responsive ZAIops operations homepage composed entirely from Zeron UI primitives. */
export function ZaiopsOperations({ workspace, title = "👋 中午好，您的环境一切正常,请继续保持", description = "XX 分钟前对刚完成对 XXX 环境的巡检,一切正常", children, className, account }: ZaiopsOperationsProps) {
  const Home = useIcon("home");
  return <OperationsWorkspaceShell workspace={{ ...workspace, account: account !== undefined ? account : workspace?.account ?? null }} activeNavigation="home" icon={Home} title="首页" className={className}><PageContent><OperationsDashboard children={children} description={description} title={title} /></PageContent></OperationsWorkspaceShell>;
}
