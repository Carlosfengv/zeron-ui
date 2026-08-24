"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import { AgentTrace } from "@zeron/blocks/agent-trace-01";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@zeron/ui/breadcrumb";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { InputMessage } from "@zeron/ui/input-message";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageContent, PageHeader, PageLayout } from "@zeron/ui/page-layout";
import { Sidebar, SidebarContent, SidebarFloatingTrigger, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarGroupTrigger, SidebarHeader, SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { defaultAgentSessions } from "./session-mocks";

export interface AgentSession {
  id: string;
  title: string;
  description: string;
  agent: string;
  updatedAt: string;
  badge?: string;
  badgeColor?: "gray" | "blue";
  /** Status badges communicate action required without competing with timestamps. */
  badgeStatus?: BadgeStatus;
  /** Uses the same fill and foreground tokens as Button variant="neutral". */
  badgeTone?: "neutral-button";
  /** Optional channel glyph; the leading slot remains reserved when omitted. */
  channelIcon?: ReactNode;
  data: unknown;
}

export interface AgentSessionDetailProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  sessions?: readonly AgentSession[];
  activeSessionId?: string;
  defaultActiveSessionId?: string;
  onActiveSessionChange?: (sessionId: string) => void;
  /** Enables attachments in both the trace viewer and the session composer. */
  allowUpload?: boolean;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function appendMockConversation(data: unknown, text: string, files: File[]) {
  const source = isRecord(data) ? data : {};
  const events = Array.isArray(source.events) ? source.events : Array.isArray(data) ? data : [];
  const maxSequence = events.reduce((maximum, event) => isRecord(event) && typeof event.seq === "number" ? Math.max(maximum, event.seq) : maximum, 0);
  const maxTurn = events.reduce((maximum, event) => {
    const eventData = isRecord(event) && isRecord(event.data) ? event.data : null;
    return eventData && typeof eventData.turn === "number" ? Math.max(maximum, eventData.turn) : maximum;
  }, 0);
  const turn = maxTurn + 1;
  const now = Date.now();
  const submittedContent = [
    ...(text ? [{ type: "text", text }] : []),
    ...files.map((file) => ({ type: "text", text: `附件：${file.name}` })),
  ];
  const reply = `这是一个 mock 回复：已收到“${text || `${files.length} 个附件`}”。你可以继续追问，或切换到 Trace 查看本次对话记录。`;

  return {
    ...source,
    events: [...events,
      { seq: maxSequence + 1, time: now, type: "turn/start", data: { turn } },
      { seq: maxSequence + 2, time: now + 1, type: "user/message", data: { turn, content: submittedContent } },
      { seq: maxSequence + 3, time: now + 300, type: "assistant/message", data: { turn, step: 1, usage: { inputTokens: 120, outputTokens: 48, reasoningTokens: 8 }, message: { role: "assistant", source: { kind: "model", provider: "mock", model: "Mock Agent" }, content: [{ type: "text", text: reply }] } } },
      { seq: maxSequence + 4, time: now + 301, type: "turn/end", data: { turn, reason: { kind: "completed" } } },
    ],
  };
}

const modelOptions = [
  { group: "推荐", label: "自动选择", provider: "automatic" },
  { group: "Anthropic", label: "Claude Sonnet 4.6", provider: "anthropic" },
  { group: "Anthropic", label: "Claude Haiku 4.5", provider: "anthropic" },
  { group: "OpenAI", label: "GPT-5.2", provider: "openai" },
  { group: "DeepSeek", label: "DeepSeek V3.2", provider: "deepseek" },
] as const;
const modelGroups = ["推荐", "Anthropic", "OpenAI", "DeepSeek"] as const;
const permissionOptions = ["默认权限", "仅限工作目录", "完全访问"];

function SessionBadge({ className, session }: { className?: string; session: AgentSession }) {
  if (!session.badge) return null;
  const neutralButtonTone = session.badgeTone === "neutral-button";
  return <Badge color={session.badgeColor ?? "gray"} status={session.badgeStatus} size="sm" className={className} style={neutralButtonTone && !session.badgeStatus ? { backgroundColor: "var(--inverse-background)", color: "var(--fg-on-inverse)" } : undefined}>{session.badge}</Badge>;
}

function SessionNavigation({ activeSessionId, onSessionSelect, sessions, showSidebarTrigger = false }: {
  activeSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  sessions: readonly AgentSession[];
  showSidebarTrigger?: boolean;
}) {
  const ChevronDown = useIcon("chevron-down");
  const ChevronRight = useIcon("chevron-right");
  const Library = useIcon("square-library");
  const Link = useIcon("link");
  const More = useIcon("ellipsis");
  const Chat = useIcon("message-circle");
  const utilities = [{ label: "新对话", icon: Chat }, { label: "技能广场", icon: Library }, { label: "应用连接", icon: Link }, { label: "更多", icon: More }];
  const agentGroups = sessions.reduce<{ agent: string; sessions: AgentSession[] }[]>((groups, session) => {
    const group = groups.find((candidate) => candidate.agent === session.agent);
    if (group) group.sessions.push(session);
    else groups.push({ agent: session.agent, sessions: [session] });
    return groups;
  }, []);
  const [openAgentNames, setOpenAgentNames] = useState(() =>
    agentGroups.filter((group) => group.sessions.some((session) => session.id === activeSessionId)).map((group) => group.agent)
  );

  return <>
    <SidebarHeader className="space-y-1 px-2 py-1.5"><div className="flex min-w-0 items-center gap-1"><SidebarIdentityRow as="button" leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">Z</SidebarIdentityAvatar>} primary="Carlos’s workspace" trailing={<ChevronDown className="size-4" />} />{showSidebarTrigger && <SidebarTrigger className="shrink-0" label="收起会话导航" size="xs" />}</div></SidebarHeader>
    <SidebarContent contentClassName="gap-3 px-2 py-1">
      <SidebarGroup><SidebarGroupContent><NavMenu activeValue={null} aria-label="工作区导航" keyboardNavigation="roving">{utilities.map(({ icon: Icon, label }) => <NavItem key={label} value={label}><NavItemTrigger render={<button type="button" />} onClick={(event) => event.preventDefault()}><NavItemLeading><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>智能体</SidebarGroupLabel>
        <div className="space-y-1.5">
          {agentGroups.map((group) => {
            const containsActiveSession = group.sessions.some((session) => session.id === activeSessionId);
            const open = openAgentNames.includes(group.agent);

            return <SidebarGroup key={group.agent} collapsible open={open} onOpenChange={(nextOpen) => setOpenAgentNames((current) => nextOpen ? [...new Set([...current, group.agent])] : current.filter((name) => name !== group.agent))}>
              <SidebarGroupTrigger className="mb-0 h-8 gap-1 px-1.5 text-body font-semibold text-fg-default" indicator={<ChevronRight aria-hidden size={16} strokeWidth={1.5} className="shrink-0 transition-transform duration-fast group-data-[panel-open]/sidebar-group-trigger:rotate-90 motion-reduce:transition-none" />}>
                <span className="flex min-w-0 items-center gap-1"><SidebarIdentityAvatar className="size-5 rounded-md text-[10px]" tone="brand">{group.agent.slice(0, 1)}</SidebarIdentityAvatar><span className="truncate">{group.agent}</span></span>
              </SidebarGroupTrigger>
              {open && <DropdownMenu><DropdownTrigger render={<Button aria-label={`${group.agent} 更多操作`} className="absolute right-6 top-1 size-6 text-fg-muted" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-36"><MenuItem index={0} label="编辑智能体" onSelect={() => undefined} /><MenuItem index={1} label="智能体设置" onSelect={() => undefined} /></DropdownContent></DropdownMenu>}
              <SidebarGroupContent className="pt-0"><NavMenu activeValue={containsActiveSession ? activeSessionId : null} aria-label={`${group.agent} 会话`} keyboardNavigation="roving" className="[--active:var(--hover)] [&_[data-slot=nav-list]]:gap-0">{group.sessions.map((session) => <NavItem key={session.id} value={session.id} className="py-0"><NavItemTrigger className="h-8 gap-1 px-1.5" render={<button type="button" />} onClick={() => onSessionSelect(session.id)}><NavItemLeading className="size-5">{session.channelIcon}</NavItemLeading><NavItemContent><NavItemLabel>{session.title}</NavItemLabel></NavItemContent></NavItemTrigger><span className="relative mr-1 flex h-8 min-w-11 shrink-0 items-center justify-end"><SessionBadge className="h-5 rounded px-1 text-[10px] leading-5 transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0" session={session} />{!session.badge && <span className="whitespace-nowrap text-[10px] text-fg-subtle transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">{session.updatedAt}</span>}<DropdownMenu><DropdownTrigger render={<Button aria-label={`${session.title} 更多操作`} className="pointer-events-none absolute right-0 size-6 opacity-0 group-hover/nav-item:pointer-events-auto group-hover/nav-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-36"><MenuItem index={0} label="重命名会话" onSelect={() => undefined} /><MenuItem index={1} label="删除会话" onSelect={() => undefined} /></DropdownContent></DropdownMenu></span></NavItem>)}</NavMenu></SidebarGroupContent>
            </SidebarGroup>;
          })}
        </div>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" trailing={<More className="size-4" />} trailingPlacement="edge" /></SidebarFooter>
  </>;
}

/** A session detail application page that composes Agent Trace with shared navigation. */
export function AgentSessionDetail({ activeSessionId: activeSessionIdProp, allowUpload = true, className, defaultActiveSessionId, onActiveSessionChange, sessions = defaultAgentSessions, ...props }: AgentSessionDetailProps) {
  const defaultSessionId = defaultActiveSessionId ?? sessions[0]?.id ?? "";
  const [internalActiveSessionId, setInternalActiveSessionId] = useState(defaultSessionId);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState(0);
  const [permission, setPermission] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, unknown>>({});
  const Image = useIcon("image");
  const Brain = useIcon("brain");
  const ChevronDown = useIcon("chevron-down");
  const Shield = useIcon("shield");
  const modelIcon = (provider: (typeof modelOptions)[number]["provider"]) =>
    provider === "anthropic"
      ? AnthropicMono
      : provider === "openai"
        ? OpenAIMono
        : provider === "deepseek"
          ? DeepSeekColor
          : Brain;
  const selectedModel = modelOptions[model];
  const ModelLogo = modelIcon(selectedModel.provider);
  const activeSessionId = activeSessionIdProp ?? internalActiveSessionId;
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const activeData = sessionData[activeSession?.id ?? ""] ?? activeSession?.data;
  const selectSession = (sessionId: string) => { if (activeSessionIdProp === undefined) setInternalActiveSessionId(sessionId); setDraft(""); setFiles([]); onActiveSessionChange?.(sessionId); };
  const sendMessage = (value: string, attachments: File[]) => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || !activeSession) return;
    setSessionData((current) => ({ ...current, [activeSession.id]: appendMockConversation(current[activeSession.id] ?? activeSession.data, text, attachments) }));
    setDraft("");
    setFiles([]);
  };
  if (!activeSession) return null;

  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-[44rem] min-w-0 overflow-hidden bg-surface-base", className)} {...props}>
    <Sidebar ariaLabel="会话导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(280px, calc(100vw - 24px))" width="280px"><SessionNavigation activeSessionId={activeSession.id} onSessionSelect={selectSession} sessions={sessions} showSidebarTrigger /></Sidebar>
    <PageLayout className="h-full min-w-0 flex-1"><PageHeader><div className="flex min-w-0 items-center gap-2"><SidebarFloatingTrigger collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[280px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开会话导航" menuLabel="打开会话导航菜单" renderContent={({ close }) => <SessionNavigation activeSessionId={activeSession.id} onSessionSelect={(sessionId) => { selectSession(sessionId); close(); }} sessions={sessions} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><Breadcrumb className="min-w-0"><BreadcrumbList className="flex-nowrap"><BreadcrumbItem><BreadcrumbLink href={`#${activeSession.agent}`}>{activeSession.agent}</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem className="min-w-0"><BreadcrumbPage className="truncate">{activeSession.title}</BreadcrumbPage><SessionBadge className="shrink-0" session={activeSession} /></BreadcrumbItem></BreadcrumbList></Breadcrumb></div></PageHeader><PageContent><AgentTrace key={activeSession.id} allowUpload={allowUpload} onDataChange={(nextData) => setSessionData((current) => ({ ...current, [activeSession.id]: nextData }))} chatFooter={<div className="shrink-0 px-3 py-3"><div className="mx-auto max-w-3xl"><InputMessage value={draft} onValueChange={setDraft} onSend={sendMessage} placeholder={`向 ${activeSession.agent} 发送消息…`} minRows={1} maxRows={4} history={[]} files={allowUpload ? files : undefined} onFilesChange={allowUpload ? setFiles : undefined} accept="image/png,image/jpeg,application/pdf" maxFiles={5} leftSlot={allowUpload ? ({ openFilePicker }) => <Button aria-label="添加附件" iconOnly size="sm" type="button" variant="ghost" onClick={() => openFilePicker()}><Image aria-hidden /></Button> : undefined} rightSlot={<DropdownMenu><DropdownTrigger render={<Button className="bg-hover" leadingIcon={ModelLogo} size="sm" trailingIcon={ChevronDown} type="button" variant="ghost">{selectedModel.label}</Button>} /><DropdownContent checkedIndex={model} align="end">{modelGroups.map((group) => <div key={group}><p className="px-2 pb-0.5 pt-1.5 text-label text-fg-subtle">{group}</p>{modelOptions.map((item, index) => item.group === group ? <MenuItem checked={model === index} icon={modelIcon(item.provider)} index={index} key={item.label} label={item.label} onSelect={() => setModel(index)} /> : null)}</div>)}</DropdownContent></DropdownMenu>} footer={<DropdownMenu><DropdownTrigger render={<Button leadingIcon={Shield} size="sm" trailingIcon={ChevronDown} type="button" variant="ghost">{permissionOptions[permission]}</Button>} /><DropdownContent checkedIndex={permission}>{permissionOptions.map((item, index) => <MenuItem checked={permission === index} index={index} key={item} label={item} onSelect={() => setPermission(index)} />)}</DropdownContent></DropdownMenu>} /></div></div>} className="min-h-0" data={activeData} defaultView="chat" layout="embedded" title={activeSession.title} /></PageContent></PageLayout>
  </div></SidebarProvider>;
}
