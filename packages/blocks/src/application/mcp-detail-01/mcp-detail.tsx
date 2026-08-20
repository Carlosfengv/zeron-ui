"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { cn } from "@zeron/ui/system/utils";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Textarea } from "@zeron/ui/textarea";
import { Tooltip } from "@zeron/ui/tooltip";
import Image from "next/image";
import supabaseMcpCursor from "./assets/supabase-mcp-cursor.png";
import {
  defaultMcpDetail,
  type McpConnectionOptions,
  type McpConnectionResult,
  type McpDetailData,
} from "./mcp-detail-data";

type McpSection = "overview" | "tools";
type ConnectionStatus = "idle" | "loading" | "result" | "error" | "expired";

export interface McpDetailProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  service?: McpDetailData;
  defaultSection?: McpSection;
  defaultConnectionOptions?: Partial<McpConnectionOptions>;
  onSectionChange?: (section: McpSection) => void;
  onConnectionOptionsChange?: (options: McpConnectionOptions) => void;
  onRequestConnection?: (options: McpConnectionOptions) => Promise<McpConnectionResult> | McpConnectionResult;
  onRunTool?: (toolName: string, input: Record<string, unknown>) => Promise<unknown> | unknown;
  onAgentSelect?: (agentId: string) => void;
  onNavigate?: (href: string) => void;
}

function nextExpiry(expiration: string) {
  const hours = expiration === "24h" ? 24 : expiration === "7d" ? 24 * 7 : 48;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function mockConnection(options: McpConnectionOptions): McpConnectionResult {
  const url = "https://example.invalid/mcp/supabase-mcp";
  return {
    streamableHttpUrl: url,
    jsonConfig: JSON.stringify({ mcpServers: { supabase: { url, transport: options.transport } } }, null, 2),
    expiresAt: nextExpiry(options.expiration),
  };
}

function formatExpiry(expiresAt?: string) {
  if (!expiresAt) return null;
  const parsed = new Date(expiresAt);
  return Number.isNaN(parsed.valueOf()) ? expiresAt : parsed.toLocaleString("zh-CN");
}

function assetSource(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

function AgentButtons({ service, onAgentSelect }: Pick<McpDetailProps, "onAgentSelect"> & { service: McpDetailData }) {
  if (!service.agents.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 p-1" aria-label="兼容 Agent">
      {service.agents.map((agent) => (
        <Tooltip key={agent.id} content={agent.name} side="top">
          <Button type="button" variant="ghost" size="xl" iconOnly className="size-10 !p-1 border border-border bg-transparent leading-none" onClick={() => onAgentSelect?.(agent.id)} aria-label={`配置到 ${agent.name}`}>
            {agent.logo && <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center align-middle leading-none [&>svg]:block [&>svg]:size-8 [&>img]:block">{agent.logo}</span>}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** MCP resource details with product-owned connection and tool execution callbacks. */
export function McpDetail({
  service = defaultMcpDetail,
  defaultSection = "overview",
  defaultConnectionOptions,
  onSectionChange,
  onConnectionOptionsChange,
  onRequestConnection,
  onRunTool,
  onAgentSelect,
  onNavigate,
  className,
  ...props
}: McpDetailProps) {
  const [section, setSection] = useState<McpSection>(defaultSection);
  const [connectionOptions, setConnectionOptions] = useState<McpConnectionOptions>({
    transport: defaultConnectionOptions?.transport ?? service.connectionOptions.transports[0]?.value ?? "",
    authMethod: defaultConnectionOptions?.authMethod ?? service.connectionOptions.authMethods[0]?.value ?? "",
    expiration: defaultConnectionOptions?.expiration ?? service.connectionOptions.expirations[0]?.value ?? "",
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [connectionResult, setConnectionResult] = useState<McpConnectionResult | null>(null);
  const [connectionResultIsMock, setConnectionResultIsMock] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const requestRevision = useRef(0);
  const [toolName, setToolName] = useState(service.tools[0]?.name ?? "");
  const [toolInput, setToolInput] = useState(() => JSON.stringify(service.tools[0]?.defaultInput ?? {}, null, 2));
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [toolResultIsMock, setToolResultIsMock] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState(false);
  const toolRevision = useRef(0);

  useEffect(() => () => {
    requestRevision.current += 1;
    toolRevision.current += 1;
  }, []);

  useEffect(() => {
    if (!connectionResult?.expiresAt || connectionStatus !== "result") return;
    const expireAt = new Date(connectionResult.expiresAt).valueOf();
    if (Number.isNaN(expireAt)) return;
    const expire = () => {
      setConnectionResult(null);
      setConnectionResultIsMock(false);
      setConnectionStatus("expired");
    };
    const delay = expireAt - Date.now();
    if (delay <= 0) return expire();
    const timer = window.setTimeout(() => {
      expire();
    }, delay);
    const recheckExpiry = () => {
      if (document.visibilityState === "visible" && expireAt <= Date.now()) expire();
    };
    document.addEventListener("visibilitychange", recheckExpiry);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", recheckExpiry);
    };
  }, [connectionResult?.expiresAt, connectionStatus]);

  const updateOptions = (key: keyof McpConnectionOptions, value: string) => {
    requestRevision.current += 1;
    const next = { ...connectionOptions, [key]: value };
    setConnectionOptions(next);
    setConnectionResult(null);
    setConnectionResultIsMock(false);
    setConnectionError(null);
    setConnectionStatus("idle");
    onConnectionOptionsChange?.(next);
  };

  const requestConnection = async () => {
    const revision = ++requestRevision.current;
    setConnectionStatus("loading");
    setConnectionError(null);
    setConnectionResult(null);
    setConnectionResultIsMock(false);
    try {
      const isMockResult = !onRequestConnection;
      const result = onRequestConnection
        ? await onRequestConnection(connectionOptions)
        : mockConnection(connectionOptions);
      if (revision !== requestRevision.current) return;
      setConnectionResult(result);
      setConnectionResultIsMock(isMockResult);
      setConnectionStatus("result");
    } catch {
      if (revision !== requestRevision.current) return;
      setConnectionError("无法获取连接信息，请检查配置后重试。");
      setConnectionStatus("error");
    }
  };

  const runTool = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(toolInput);
    } catch {
      setToolError("请输入合法的 JSON Object。");
      return;
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      setToolError("参数必须是 JSON Object。");
      return;
    }
    const revision = ++toolRevision.current;
    const isMockResult = !onRunTool;
    setToolLoading(true);
    setToolError(null);
    setToolResult(null);
    setToolResultIsMock(false);
    try {
      const result = onRunTool
        ? await onRunTool(toolName, parsed as Record<string, unknown>)
        : { example: true, tool: toolName, input: parsed };
      if (revision !== toolRevision.current) return;
      setToolResult(JSON.stringify(result, null, 2));
      setToolResultIsMock(isMockResult);
    } catch {
      if (revision !== toolRevision.current) return;
      setToolError("工具执行失败，请稍后重试。");
    } finally {
      if (revision === toolRevision.current) setToolLoading(false);
    }
  };

  const activeTool = service.tools.find((tool) => tool.name === toolName);
  const overviewImage = service.overview.image ?? (service.id === defaultMcpDetail.id
    ? { src: assetSource(supabaseMcpCursor), alt: "Cursor 中配置 Supabase MCP 的示例界面" }
    : undefined);

  return (
    <PageLayout size="full" className={cn("h-full bg-surface-base pt-0", className)} {...props}>
      <PageContent>
        <PageBody className="max-w-[1320px] px-3 py-3 sm:px-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="#mcp" onClick={(event) => { event.preventDefault(); onNavigate?.("#mcp"); }}>MCP 广场</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="#developer-tools" onClick={(event) => { event.preventDefault(); onNavigate?.("#developer-tools"); }}>{service.category}</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{service.name}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="mt-3 rounded-2xl bg-muted p-3" aria-labelledby="mcp-detail-title">
            <div className="flex min-w-0 items-start gap-3 max-sm:flex-col">
              <div aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-floating text-title font-semibold text-fg-default">{service.logo ?? service.name.slice(0, 1).toUpperCase()}</div>
              <div className="min-w-0">
                <h1 id="mcp-detail-title" className="text-title text-fg-default">{service.name}</h1>
                <p className="mt-1 text-label leading-5 text-fg-muted">{service.description}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge size="sm">{service.category}</Badge>
              {service.license && <Badge size="sm">开源协议：{service.license}</Badge>}
              <Badge size="sm">开发者：{service.developer}</Badge>
            </div>
          </section>

          <PageColumns asideWidth="407px" columnsAt="xl" className="mt-5 gap-5">
            <PageAside aria-label={`${service.name} 开始使用`}>
              <Card className="rounded-xl border border-border bg-surface-floating">
                <CardHeader className="p-4 pb-0"><CardTitle>服务配置</CardTitle></CardHeader>
                <CardContent className="space-y-3 p-4">
                  <InlineNotice variant="emphasized" tone="info">连接信息可能包含当前用户或组织权限，请勿泄露，仅限个人使用。</InlineNotice>
                  {(["transport", "authMethod", "expiration"] as const).map((key) => {
                    const label = key === "transport" ? "传输类型" : key === "authMethod" ? "鉴权类型" : "有效期";
                    const options = key === "transport" ? service.connectionOptions.transports : key === "authMethod" ? service.connectionOptions.authMethods : service.connectionOptions.expirations;
                    return <label key={key} className="block text-label text-fg-default"><span className="mb-1 block">{label}</span><Select value={connectionOptions[key]} onValueChange={(value) => updateOptions(key, value)} disabled={connectionStatus === "loading"}><SelectTrigger className="w-full" /> <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent></Select></label>;
                  })}
                  <Button type="button" className="w-full" loading={connectionStatus === "loading"} onClick={requestConnection}>获取连接信息</Button>
                  {connectionStatus === "error" && <InlineNotice tone="danger" variant="emphasized">{connectionError} <button type="button" className="underline" onClick={requestConnection}>重试</button></InlineNotice>}
                  {connectionStatus === "expired" && <InlineNotice tone="warning" variant="emphasized">连接信息已过期，请重新生成。</InlineNotice>}
                  {connectionStatus === "result" && connectionResult && <div className="space-y-3" aria-live="polite">{connectionResultIsMock && <InlineNotice variant="emphasized" tone="info">示例连接信息，仅用于文档预览。</InlineNotice>}{connectionResult.streamableHttpUrl && <InputCopy label="Streamable HTTP URL" value={connectionResult.streamableHttpUrl} variant="button" />}{connectionResult.jsonConfig && <InputCopy label="JSON Config" value={connectionResult.jsonConfig} variant="button" />}{connectionResult.expiresAt && <p className="text-label text-fg-muted">有效至：{formatExpiry(connectionResult.expiresAt)}</p>}</div>}
                </CardContent>
              </Card>
              <Card className="mt-3 rounded-xl border border-border bg-surface-floating">
                <CardHeader className="p-4 pb-0"><CardTitle>如何使用？</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2"><p className="text-body text-fg-muted">将 MCP 配置到兼容的 Agent 中，或阅读服务文档完成产品接入。</p><Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onNavigate?.("#docs")}>查看文档</Button><AgentButtons service={service} onAgentSelect={onAgentSelect} /></CardContent>
              </Card>
            </PageAside>

            <PagePrimary>
              <Tabs value={section} onValueChange={(value) => { const next = value as McpSection; setSection(next); onSectionChange?.(next); }} variant="pill" color="neutral">
                <TabsList><TabItem value="overview" label="服务详情" /><TabItem value="tools" label="工具测试" /></TabsList>
                <TabPanel value="overview" className="mt-5">
                  <h2 className="text-heading text-fg-default">{service.overview.title}</h2>
                  {service.registryStatus && <Badge className="mt-3" size="sm">{service.registryStatus}</Badge>}
                  <p className="mt-3 text-body text-fg-muted">{service.overview.lead}</p>
                  {overviewImage && <Image src={overviewImage.src} alt={overviewImage.alt} width={1280} height={720} className="mt-4 aspect-video w-full rounded-xl border border-border object-cover" />}
                  <div className="mt-4 space-y-3 text-body leading-7 text-fg-muted">{service.overview.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                  <section className="mt-5" aria-labelledby="mcp-setup-title"><h3 id="mcp-setup-title" className="text-title text-fg-default">设置</h3><ol className="mt-3 space-y-3">{service.overview.setupSteps.map((step, index) => <li key={step.title} className="rounded-xl bg-hover p-3"><p className="text-body font-medium text-fg-default">{index + 1}. {step.title}</p><p className="mt-1 text-body text-fg-muted">{step.description}</p></li>)}</ol></section>
                </TabPanel>
                <TabPanel value="tools" className="mt-5">
                  {!service.tools.length ? <InlineNotice variant="emphasized" tone="info">该服务尚未公开可测试工具。</InlineNotice> : <div className="space-y-3"><label className="block text-label text-fg-default"><span className="mb-1 block">选择工具</span><Select value={toolName} onValueChange={(value) => { setToolName(value); setToolInput(JSON.stringify(service.tools.find((tool) => tool.name === value)?.defaultInput ?? {}, null, 2)); setToolResult(null); setToolResultIsMock(false); setToolError(null); }} disabled={toolLoading}><SelectTrigger className="w-full" /><SelectContent>{service.tools.map((tool) => <SelectItem key={tool.name} value={tool.name}>{tool.name}</SelectItem>)}</SelectContent></Select></label>{activeTool?.description && <p className="text-body text-fg-muted">{activeTool.description}</p>}<label className="block text-label text-fg-default"><span className="mb-1 block">参数（JSON Object）</span><Textarea value={toolInput} onChange={(event) => setToolInput(event.target.value)} aria-invalid={!!toolError} disabled={toolLoading} className="min-h-40 font-mono text-label" /></label>{toolError && <InlineNotice aria-live="polite" variant="emphasized" tone="danger">{toolError}</InlineNotice>}<Button type="button" loading={toolLoading} onClick={runTool}>运行工具</Button>{toolResultIsMock && <InlineNotice variant="emphasized" tone="info">示例结果，未执行真实工具调用。</InlineNotice>}{toolResult && <pre aria-live="polite" className="overflow-x-auto rounded-xl bg-hover p-3 font-mono text-label text-fg-default">{toolResult}</pre>}</div>}
                </TabPanel>
              </Tabs>
            </PagePrimary>
          </PageColumns>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}
