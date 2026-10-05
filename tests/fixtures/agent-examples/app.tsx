"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { AppShell, AppShellSidebar, AppShellHeader, AppShellMain } from "#components/app-shell";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarTrigger, useSidebar } from "#components/sidebar";
import { SidebarIdentityRow, SidebarIdentityAvatar } from "#components/sidebar-identity-row";
import { SidebarAccountMenu } from "#components/sidebar-account-menu";
import { NavMenu } from "#components/nav-menu";
import { NavItem, NavItemTrigger, NavItemLeading, NavItemContent, NavItemLabel } from "#components/nav-item";
import { ResourceListPage } from "./resource-list/page";
import { ResourceDetailPage } from "./resource-detail/page";
import { SettingsPage } from "./settings/page";
import { createDeterministicApi } from "./shared/deterministic-api";
import type { ExampleApi, ResourceQuery } from "./shared/contracts";

declare global {
  interface Window { __zeronExampleObservations?: () => ReturnType<ReturnType<typeof createDeterministicApi>["snapshot"]> }
}

export const initialResourceQuery: ResourceQuery = { search: "", status: "all", sort: "name", direction: "asc", pageIndex: 0, pageSize: 10 };
type Route = { page: "list" } | { page: "detail"; id: string } | { page: "settings" };

function ResourcesIcon(props: ComponentProps<"svg">) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
}
function SettingsIcon(props: ComponentProps<"svg">) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" /><circle cx="15" cy="17" r="3" /></svg>;
}
function AccountFooter({ onSettings }: { onSettings: () => void }) {
  const { state, isMobile } = useSidebar();
  return <SidebarAccountMenu primary="Example account" description="Administrator" compact={state === "collapsed" && !isMobile} sections={[{ items: [{ id: "settings", label: "Account settings", onSelect: onSettings }] }]} />;
}
function WorkspaceHeader() {
  const { state, isMobile } = useSidebar();
  const compact = state === "collapsed" && !isMobile;
  return <SidebarHeader>{compact ? <SidebarIdentityAvatar tone="brand" aria-label="Zeron workspace">Z</SidebarIdentityAvatar> : <SidebarIdentityRow primary="Zeron workspace" leading={<SidebarIdentityAvatar tone="brand">Z</SidebarIdentityAvatar>} />}</SidebarHeader>;
}
function ExampleNavigation({ route, onNavigate }: { route: Route; onNavigate: (page: "list" | "settings") => void }) {
  const { closeMobile } = useSidebar();
  const navigate = (page: "list" | "settings") => { onNavigate(page); closeMobile(); };
  return <Sidebar collapsible="icon" className="static h-full" ariaLabel="Example navigation">
    <WorkspaceHeader />
    <SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent>
      <NavMenu aria-label="Workspace navigation" activeValue={route.page === "settings" ? "settings" : "resources"} keyboardNavigation="roving">
        <NavItem value="resources"><NavItemTrigger render={<button type="button" />} tooltip="Resources" onClick={() => navigate("list")}><NavItemLeading><ResourcesIcon aria-hidden="true" /></NavItemLeading><NavItemContent><NavItemLabel>Resources</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
        <NavItem value="settings"><NavItemTrigger render={<button type="button" />} tooltip="Settings" onClick={() => navigate("settings")}><NavItemLeading><SettingsIcon aria-hidden="true" /></NavItemLeading><NavItemContent><NavItemLabel>Settings</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
      </NavMenu>
    </SidebarGroupContent></SidebarGroup></SidebarContent>
    <SidebarFooter><AccountFooter onSettings={() => navigate("settings")} /></SidebarFooter>
  </Sidebar>;
}

/** Host-owned navigation demonstrates callbacks; consumers may replace it with their real router. */
export function ExamplesApp({ api, initialQuery = initialResourceQuery, initialPage = "list", initialResourceId = "resource-1" }: { api: ExampleApi; initialQuery?: ResourceQuery; initialPage?: "list" | "detail" | "settings"; initialResourceId?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [route, setRoute] = useState<Route>(initialPage === "detail" ? { page: "detail", id: initialResourceId } : { page: initialPage });
  const content = useRef<HTMLElement>(null);
  useEffect(() => { content.current?.focus(); }, [route]);
  const open = useCallback((id: string, context: ResourceQuery) => { setQuery(context); setRoute({ page: "detail", id }); }, []);
  const back = useCallback((context: ResourceQuery) => { setQuery(context); setRoute({ page: "list" }); }, []);
  return <SidebarProvider><AppShell className="h-dvh min-h-0 overflow-hidden">
    <AppShellSidebar><ExampleNavigation route={route} onNavigate={page => setRoute({ page })} /></AppShellSidebar>
    <AppShellHeader><SidebarTrigger /></AppShellHeader>
    <AppShellMain ref={content} tabIndex={-1} aria-label="Example content" className="flex flex-col">{route.page === "list" ? <ResourceListPage api={api} query={query} onQueryChange={setQuery} onOpenResource={open} /> : route.page === "detail" ? <ResourceDetailPage api={api} id={route.id} returnQuery={query} onBack={back} /> : <SettingsPage api={api} />}</AppShellMain>
  </AppShell></SidebarProvider>;
}

/** Standalone example adapter. Production hosts inject ExampleApi into ExamplesApp. */
export default function ExamplePreview() {
  const [preview, setPreview] = useState<{ api: ExampleApi; page: "list" | "detail" | "settings"; id: string } | null>(null);
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const name = parameters.get("example");
    const page = name === "detail" || name === "settings" ? name : "list";
    const scenario = parameters.get("scenario") ?? "success";
    const service = createDeterministicApi({ editable: scenario !== "readonly" });
    const observe = service.snapshot;
    if (parameters.get("observe") === "1") window.__zeronExampleObservations = observe;
    const operation = page === "list" ? "list" : page === "detail" ? "detail" : "settings";
    if (scenario === "error" || scenario === "forbidden") service.enqueue(operation, { outcome: scenario === "error" ? "unavailable" : "forbidden" });
    if (scenario === "empty" && page === "list") service.enqueue("list", { outcome: "empty" });
    if (scenario === "slow" || scenario === "race") service.enqueue(operation, { delayMs: 2000, ignoreAbort: scenario === "race" });
    if (scenario === "save-error" || scenario === "save-forbidden" || scenario === "saving") service.enqueue(page === "detail" ? "rename" : "saveSettings", {
      outcome: scenario === "save-error" ? "unavailable" : scenario === "save-forbidden" ? "forbidden" : "success", delayMs: scenario === "saving" ? 2000 : 0,
    });
    setPreview({ api: service.api, page, id: scenario === "missing" ? "missing-resource" : "resource-1" });
    return () => { if (window.__zeronExampleObservations === observe) delete window.__zeronExampleObservations; };
  }, []);
  return preview ? <ExamplesApp api={preview.api} initialPage={preview.page} initialResourceId={preview.id} /> : <p role="status">Starting example</p>;
}
