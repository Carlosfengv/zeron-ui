"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AgentTrace } from "@zeron/blocks/agent-trace-01";
import { Badge } from "@zeron/ui/badge";
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
  allowUpload?: boolean;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function appendMockConversation(data: unknown, text: string) {
  const source = isRecord(data) ? data : {};
  const events = Array.isArray(source.events) ? source.events : Array.isArray(data) ? data : [];
  const maxSequence = events.reduce((maximum, event) => isRecord(event) && typeof event.seq === "number" ? Math.max(maximum, event.seq) : maximum, 0);
  const maxTurn = events.reduce((maximum, event) => {
    const eventData = isRecord(event) && isRecord(event.data) ? event.data : null;
    return eventData && typeof eventData.turn === "number" ? Math.max(maximum, eventData.turn) : maximum;
  }, 0);
  const turn = maxTurn + 1;
  const now = Date.now();
  const reply = `这是一个 mock 回复：已收到“${text}”。你可以继续追问，或切换到 Trace 查看本次对话记录。`;

  return {
    ...source,
    events: [...events,
      { seq: maxSequence + 1, time: now, type: "turn/start", data: { turn } },
      { seq: maxSequence + 2, time: now + 1, type: "user/message", data: { turn, content: [{ type: "text", text }] } },
      { seq: maxSequence + 3, time: now + 300, type: "assistant/message", data: { turn, step: 1, usage: { inputTokens: 120, outputTokens: 48, reasoningTokens: 8 }, message: { role: "assistant", source: { kind: "model", provider: "mock", model: "Mock Agent" }, content: [{ type: "text", text: reply }] } } },
      { seq: maxSequence + 4, time: now + 301, type: "turn/end", data: { turn, reason: { kind: "completed" } } },
    ],
  };
}

function SessionBadge({ className, session }: { className?: string; session: AgentSession }) {
  if (!session.badge) return null;
  const neutralButtonTone = session.badgeTone === "neutral-button";
  return <Badge color={session.badgeColor ?? "gray"} size="sm" className={className} style={neutralButtonTone ? { backgroundColor: "var(--inverse-background)", color: "var(--fg-on-inverse)" } : undefined}>{session.badge}</Badge>;
}

function SessionNavigation({ activeSessionId, onSessionSelect, sessions, showSidebarTrigger = false }: {
  activeSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  sessions: readonly AgentSession[];
  showSidebarTrigger?: boolean;
}) {
  const ChevronDown = useIcon("chevron-down");
  const Library = useIcon("square-library");
  const Link = useIcon("link");
  const More = useIcon("ellipsis");
  const Chat = useIcon("message-circle");
  const utilities = [{ label: "新对话", icon: Chat }, { label: "技能广场", icon: Library }, { label: "应用连接", icon: Link }, { label: "更多", icon: More }];

  return <>
    <SidebarHeader className="space-y-1 px-2 py-1.5"><div className="flex min-w-0 items-center gap-1"><SidebarIdentityRow as="button" leading={<SidebarIdentityAvatar className="rounded-lg" tone="brand">Z</SidebarIdentityAvatar>} primary="Carlos’s workspace" description="产品研发中心" trailing={<ChevronDown className="size-4" />} />{showSidebarTrigger && <SidebarTrigger className="shrink-0" label="收起会话导航" size="xs" />}</div></SidebarHeader>
    <SidebarContent contentClassName="gap-3 px-2 py-1">
      <SidebarGroup><SidebarGroupContent><NavMenu activeValue={null} aria-label="工作区导航" keyboardNavigation="roving">{utilities.map(({ icon: Icon, label }) => <NavItem key={label} value={label}><NavItemTrigger render={<button type="button" />} onClick={(event) => event.preventDefault()}><NavItemLeading><Icon aria-hidden size={16} strokeWidth={1.5} /></NavItemLeading><NavItemContent><NavItemLabel>{label}</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>)}</NavMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup collapsible defaultOpen>
        <SidebarGroupLabel>智能体</SidebarGroupLabel>
        <SidebarGroupTrigger className="mb-0 h-control-md px-1.5 text-body text-fg-default"><span className="flex min-w-0 items-center gap-2"><SidebarIdentityAvatar className="size-5 rounded-md text-[10px]" tone="brand">Z</SidebarIdentityAvatar><span className="truncate">Zeron</span></span></SidebarGroupTrigger>
        <SidebarGroupContent className="pt-1"><NavMenu activeValue={activeSessionId} aria-label="Zeron 会话" keyboardNavigation="roving">{sessions.map((session) => <NavItem key={session.id} value={session.id} className="data-[active=true]:rounded-lg data-[active=true]:bg-active"><NavItemTrigger className="px-1.5" render={<button type="button" />} onClick={() => onSessionSelect(session.id)}><NavItemLeading><span aria-hidden="true" data-slot="agent-session-channel-icon" className="grid size-4 shrink-0 place-items-center">{session.channelIcon}</span></NavItemLeading><NavItemContent><span className="flex min-w-0 items-center gap-1.5"><NavItemLabel>{session.title}</NavItemLabel><SessionBadge className="shrink-0" session={session} /></span></NavItemContent></NavItemTrigger><span className="relative me-1 flex h-control-md w-8 shrink-0 items-center justify-end"><span className="whitespace-nowrap text-label text-fg-subtle transition-opacity group-hover/nav-item:opacity-0 group-focus-within/nav-item:opacity-0">{session.updatedAt}</span><DropdownMenu><DropdownTrigger render={<Button aria-label={`${session.title} 更多操作`} className="pointer-events-none absolute right-0 opacity-0 group-hover/nav-item:pointer-events-auto group-hover/nav-item:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100" iconOnly size="xs" type="button" variant="ghost"><More aria-hidden size={16} strokeWidth={1.5} /></Button>} /><DropdownContent align="end" className="w-36"><MenuItem index={0} label="重命名会话" onSelect={() => undefined} /><MenuItem index={1} label="删除会话" onSelect={() => undefined} /></DropdownContent></DropdownMenu></span></NavItem>)}</NavMenu></SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="px-2 py-1.5"><SidebarIdentityRow description="wei.feng@zstack.io" leading={<SidebarIdentityAvatar className="rounded-lg">CF</SidebarIdentityAvatar>} primary="carlos" trailing={<More className="size-4" />} trailingPlacement="edge" /></SidebarFooter>
  </>;
}

/** A session detail application page that composes Agent Trace with shared navigation. */
export function AgentSessionDetail({ activeSessionId: activeSessionIdProp, allowUpload = false, className, defaultActiveSessionId, onActiveSessionChange, sessions = defaultAgentSessions, ...props }: AgentSessionDetailProps) {
  const defaultSessionId = defaultActiveSessionId ?? sessions[0]?.id ?? "";
  const [internalActiveSessionId, setInternalActiveSessionId] = useState(defaultSessionId);
  const [draft, setDraft] = useState("");
  const [sessionData, setSessionData] = useState<Record<string, unknown>>({});
  const activeSessionId = activeSessionIdProp ?? internalActiveSessionId;
  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const activeData = sessionData[activeSession?.id ?? ""] ?? activeSession?.data;
  const selectSession = (sessionId: string) => { if (activeSessionIdProp === undefined) setInternalActiveSessionId(sessionId); setDraft(""); onActiveSessionChange?.(sessionId); };
  const sendMessage = (value: string) => {
    const text = value.trim();
    if (!text || !activeSession) return;
    setSessionData((current) => ({ ...current, [activeSession.id]: appendMockConversation(current[activeSession.id] ?? activeSession.data, text) }));
    setDraft("");
  };
  if (!activeSession) return null;

  return <SidebarProvider breakpointBehavior="collapse"><div className={cn("flex h-full min-h-[44rem] min-w-0 overflow-hidden bg-surface-base", className)} {...props}>
    <Sidebar ariaLabel="会话导航" className="relative h-full" collapsible="offcanvas" mobileWidth="min(280px, calc(100vw - 24px))" width="280px"><SessionNavigation activeSessionId={activeSession.id} onSessionSelect={selectSession} sessions={sessions} showSidebarTrigger /></Sidebar>
    <PageLayout className="h-full min-w-0 flex-1"><PageHeader><div className="flex min-w-0 items-center gap-2"><SidebarFloatingTrigger collapsedBehavior="offcanvas" contentClassName="h-[min(36rem,calc(100svh-4rem))] w-[280px] max-w-[calc(100vw-12px)] rounded-xl p-0" label="展开会话导航" menuLabel="打开会话导航菜单" renderContent={({ close }) => <SessionNavigation activeSessionId={activeSession.id} onSessionSelect={(sessionId) => { selectSession(sessionId); close(); }} sessions={sessions} />} size="xs" surfaceClassName="border-[0.5px] border-border-subtle" surfaceShadow="floating-drop" /><Breadcrumb className="min-w-0"><BreadcrumbList className="flex-nowrap"><BreadcrumbItem><BreadcrumbLink href="#zeron">Zeron</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem className="min-w-0"><BreadcrumbPage className="truncate">{activeSession.title}</BreadcrumbPage><SessionBadge className="shrink-0" session={activeSession} /></BreadcrumbItem></BreadcrumbList></Breadcrumb></div></PageHeader><PageContent><AgentTrace key={activeSession.id} allowUpload={allowUpload} chatFooter={<div className="shrink-0 px-3 py-3"><div className="mx-auto max-w-3xl"><InputMessage value={draft} onValueChange={setDraft} onSend={sendMessage} placeholder={`向 ${activeSession.agent} 发送消息…`} minRows={1} maxRows={4} history={[]} /></div></div>} className="min-h-0" data={activeData} defaultView="chat" layout="embedded" title={activeSession.title} /></PageContent></PageLayout>
  </div></SidebarProvider>;
}
