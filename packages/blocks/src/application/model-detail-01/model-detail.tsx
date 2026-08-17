"use client";

import { useEffect, useMemo, useState, type ComponentPropsWithoutRef } from "react";
import { Badge } from "@zeron/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zeron/ui/breadcrumb";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeron/ui/card";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { InputCopy } from "@zeron/ui/input-copy";
import { PageAside, PageBody, PageColumns, PageContent, PageLayout, PagePrimary } from "@zeron/ui/page-layout";
import { cn } from "@zeron/ui/system/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import {
  defaultModelDetail,
  type ModelCodeLanguage,
  type ModelDetailData,
} from "./model-detail-data";

export interface ModelDetailProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  model?: ModelDetailData;
  defaultLanguage?: ModelCodeLanguage;
  onLanguageChange?: (language: ModelCodeLanguage) => void;
  onRequestApiKey?: () => void;
  onAgentSelect?: (agentId: string) => void;
  onNavigate?: (href: string) => void;
  onCopyCode?: (language: ModelCodeLanguage) => void;
}

function AgentButtons({ model, onAgentSelect }: { model: ModelDetailData; onAgentSelect?: (agentId: string) => void }) {
  if (!model.agents.length) return null;
  return <div className="mt-3 flex flex-wrap items-center gap-3 p-1" aria-label="兼容 Agent">{model.agents.map((agent) => <Tooltip key={agent.id} content={agent.name} side="top"><Button type="button" size="xl" variant="ghost" iconOnly className="size-10 !p-1 border border-border bg-transparent leading-none" onClick={() => onAgentSelect?.(agent.id)} aria-label={`在 ${agent.name} 中使用`}>{agent.logo && <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center align-middle leading-none [&>svg]:block [&>svg]:size-8 [&>img]:block">{agent.logo}</span>}</Button></Tooltip>)}</div>;
}

function resolveLanguage(model: ModelDetailData, defaultLanguage?: ModelCodeLanguage) {
  return defaultLanguage && model.codeSamples.some((sample) => sample.language === defaultLanguage)
    ? defaultLanguage
    : model.codeSamples[0]?.language;
}

/** Model details with product-owned API-key and navigation actions. */
export function ModelDetail({
  model = defaultModelDetail,
  defaultLanguage,
  onLanguageChange,
  onRequestApiKey,
  onAgentSelect,
  onNavigate,
  onCopyCode,
  className,
  ...props
}: ModelDetailProps) {
  const initialLanguage = resolveLanguage(model, defaultLanguage);
  const [language, setLanguage] = useState<ModelCodeLanguage | undefined>(initialLanguage);
  useEffect(() => {
    setLanguage(resolveLanguage(model, defaultLanguage));
  }, [defaultLanguage, model]);
  const activeSample = useMemo(
    () => model.codeSamples.find((sample) => sample.language === language) ?? model.codeSamples[0],
    [language, model.codeSamples]
  );

  return (
    <PageLayout size="full" className={cn("h-full bg-surface-base pt-0", className)} {...props}>
      <PageContent>
        <PageBody className="max-w-[1320px] px-3 py-3 sm:px-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#models" onClick={(event) => { event.preventDefault(); onNavigate?.("#models"); }}>模型服务</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{model.name}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="mt-3 rounded-2xl bg-muted p-3" aria-labelledby="model-detail-title">
            <div className="flex min-w-0 items-start gap-3 max-sm:flex-col">
              <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-floating text-title font-semibold text-fg-default">{model.logo ?? model.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0"><h1 id="model-detail-title" className="text-title text-fg-default">{model.name}</h1><p className="mt-1 text-label leading-5 text-fg-muted">{model.description}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><Badge size="sm" className="font-mono">{model.modelId}</Badge>{model.tags.map((tag) => <Badge key={tag} size="sm">{tag}</Badge>)}</div>
          </section>

          <PageColumns asideWidth="407px" columnsAt="xl" className="mt-5 gap-5">
            <PageAside aria-label={`${model.name} API 快速开始`}>
              <Card className="rounded-xl border border-border bg-surface-floating">
                <CardHeader className="p-4 pb-0"><CardTitle>快速开始</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <section aria-labelledby="api-key-step"><h2 id="api-key-step" className="text-body font-medium text-fg-default">1. 获取你的 API Key</h2><p className="mt-2 text-body text-fg-muted">确保你拥有该模型服务权限。在密钥管理中创建密钥，并将其设置为环境变量。</p><Button type="button" className="mt-3 w-full" disabled={!onRequestApiKey} onClick={onRequestApiKey}>获取 API Key</Button>{!onRequestApiKey && <InlineNotice className="mt-3" variant="emphasized" tone="info">请在产品接入层配置密钥管理动作。</InlineNotice>}</section>
                  <section className="mt-5 border-t border-border pt-4" aria-labelledby="api-call-step"><h2 id="api-call-step" className="text-body font-medium text-fg-default">2. 首次调用 API</h2><p className="mt-2 text-body text-fg-muted">通过 Zentrix 使用 <span className="font-mono text-label text-fg-default">{model.modelId}</span> 模型。</p>{activeSample && <Tabs value={activeSample.language} onValueChange={(value) => { const next = value as ModelCodeLanguage; setLanguage(next); onLanguageChange?.(next); }} variant="underline" color="neutral" className="mt-3"><TabsList className="overflow-x-auto">{model.codeSamples.map((sample) => <TabItem key={sample.language} value={sample.language} label={sample.label} />)}</TabsList>{model.codeSamples.map((sample) => <TabPanel key={sample.language} value={sample.language} className="mt-2"><pre className="max-h-72 overflow-auto rounded-xl bg-hover p-3 font-mono text-label leading-5 text-fg-default"><code>{sample.code}</code></pre><InputCopy label={`复制 ${sample.label} 示例`} value={sample.code} variant="button" className="mt-2 font-mono text-label" onCopy={() => onCopyCode?.(sample.language)} /></TabPanel>)}</Tabs>}</section>
                </CardContent>
              </Card>
              {model.agents.length > 0 && <Card className="mt-3 rounded-xl border border-border bg-surface-floating"><CardHeader className="p-4 pb-0"><CardTitle>对接第三方 Agent</CardTitle></CardHeader><CardContent className="p-4 pt-1"><AgentButtons model={model} onAgentSelect={onAgentSelect} /></CardContent></Card>}
              <Card className="mt-3 rounded-xl border border-border bg-surface-floating"><CardHeader className="p-4 pb-0"><CardTitle>Endpoint</CardTitle></CardHeader><CardContent className="p-4"><p className="text-body text-fg-muted">{model.endpoint.description}</p>{model.endpoint.url && <InputCopy label="API Endpoint" value={model.endpoint.url} variant="button" className="mt-3 font-mono text-label" />}<p className="mt-3 text-label text-fg-muted">兼容：{model.endpoint.modes.join(" · ")}</p></CardContent></Card>
            </PageAside>

            <PagePrimary>
              <section aria-labelledby="model-readme"><h2 id="model-readme" className="text-heading text-fg-default">Read me</h2><div className="mt-3 space-y-3 text-body leading-7 text-fg-muted">{model.readme.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
              <section className="mt-5" aria-labelledby="model-features"><h2 id="model-features" className="text-title text-fg-default">Key Features</h2><ul className="mt-3 space-y-3">{model.readme.features.map((feature) => <li key={feature.title} className="pl-5 text-body text-fg-muted before:float-left before:-ml-5 before:content-['•']"><span className="font-medium text-fg-default">{feature.title}：</span>{feature.description}</li>)}</ul></section>
              {model.benchmarks.length > 0 && <section className="mt-5" aria-labelledby="model-benchmarks"><h2 id="model-benchmarks" className="text-title text-fg-default">Benchmarks</h2><div className="mt-3 overflow-x-auto rounded-xl border border-border"><Table className="min-w-[44rem]"><TableHeader><TableRow><TableHead scope="col">Benchmark</TableHead>{model.benchmarks[0]?.columns.map((column) => <TableHead key={column.key} scope="col" aria-label={column.isCurrent ? `${column.label}，当前模型` : column.label} className={cn("whitespace-nowrap", column.isCurrent && "bg-muted font-semibold")}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{model.benchmarks.flatMap((group) => [<TableRow key={`${group.name}-group`}><TableHead colSpan={group.columns.length + 1} scope="rowgroup" className="bg-hover">{group.name}</TableHead></TableRow>, ...group.rows.map((row, index) => <TableRow key={`${group.name}-${row.benchmark}`} index={index}><TableCell className="whitespace-nowrap font-medium text-fg-default">{row.benchmark}</TableCell>{group.columns.map((column) => <TableCell key={column.key} className={cn("tabular-nums", column.isCurrent && "bg-muted font-medium text-fg-default")}>{row.values[column.key] ?? "—"}</TableCell>)}</TableRow>)])}</TableBody></Table></div></section>}
            </PagePrimary>
          </PageColumns>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}
