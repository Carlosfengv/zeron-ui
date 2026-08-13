"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "@zeron/ui/page-layout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarFloatingTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@zeron/ui/sidebar";
import { SidebarIdentityAvatar, SidebarIdentityRow } from "@zeron/ui/sidebar-identity-row";
import { cn } from "@zeron/ui/system/utils";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";

type NavigationItem = { value: string; label: string; icon: IconComponent };

function PlatformShortcutHint() {
  const [label, setLabel] = useState("Ctrl/⌘ K");

  useEffect(() => {
    setLabel(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
  }, []);

  return (
    <KbdGroup className="ms-auto min-w-13 justify-end" aria-label={label}>
      {label.split(" ").map((part) => <Kbd key={part}>{part}</Kbd>)}
    </KbdGroup>
  );
}

function OperationsSearchTrigger({ onOpen }: { onOpen: () => void }) {
  const Search = useIcon("search");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k" ||
        target?.closest("input, textarea, select, [contenteditable], [role=textbox]")
      ) return;
      event.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="h-control-md w-full justify-start px-1.5 max-xl:min-h-11"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onOpen}
    >
      <span className="flex w-full min-w-0 items-center gap-1">
        <Search className="size-5 shrink-0" />
        <span>Search operations</span>
        <PlatformShortcutHint />
      </span>
    </Button>
  );
}

export interface ZaiopsOperationsProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** A responsive operations workspace recipe with an organization switcher and grouped navigation. */
export function ZaiopsOperations({
  title = "Inspection overview",
  description = "A responsive operations workspace composed from Sidebar, navigation primitives, and PageLayout.",
  children,
  className,
}: ZaiopsOperationsProps) {
  const [organization, setOrganization] = useState("ZAIops Production");
  const [active, setActive] = useState("overview");
  const [searchOpen, setSearchOpen] = useState(false);
  const ChevronDown = useIcon("chevron-down");
  const Home = useIcon("home");
  const List = useIcon("list");
  const Check = useIcon("check-square");
  const Brain = useIcon("brain");
  const Library = useIcon("square-library");

  const primary: NavigationItem[] = [
    { value: "overview", label: "Overview", icon: Home },
    { value: "clusters", label: "Clusters", icon: List },
    { value: "reports", label: "Reports", icon: Check },
  ];
  const governance: NavigationItem[] = [
    { value: "plans", label: "Inspection plans", icon: Check },
    { value: "skills", label: "Expert skills", icon: Brain },
    { value: "knowledge", label: "Knowledge base", icon: Library },
  ];
  const renderItem = (item: NavigationItem) => {
    const Icon = item.icon;
    return (
      <NavItem key={item.value} value={item.value}>
        <NavItemTrigger
          href={`#${item.value}`}
          className="h-control-md px-1.5 text-body data-[active=true]:text-fg-brand max-xl:min-h-11"
          onClick={(event) => {
            event.preventDefault();
            setActive(item.value);
          }}
        >
          <NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><Icon size={16} strokeWidth={1.5} /></NavItemLeading>
          <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
        </NavItemTrigger>
      </NavItem>
    );
  };

  const renderFloatingItem = (item: NavigationItem, close: () => void) => {
    const Icon = item.icon;
    return (
      <NavItem key={item.value} value={item.value}>
        <NavItemTrigger
          href={`#${item.value}`}
          className="h-control-md px-1.5 text-body data-[active=true]:text-fg-brand"
          onClick={(event) => {
            event.preventDefault();
            setActive(item.value);
            close();
          }}
        >
          <NavItemLeading className="group-data-[active=true]/nav-item:text-fg-brand"><Icon size={16} strokeWidth={1.5} /></NavItemLeading>
          <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
        </NavItemTrigger>
      </NavItem>
    );
  };

  return (
    <SidebarProvider>
      <div className={cn("flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-surface-base", className)}>
        <Sidebar
          width="260px"
          mobileWidth="min(260px, calc(100vw - 24px))"
          collapsible="offcanvas"
          ariaLabel="Operations navigation"
          className="relative h-full"
        >
          <SidebarHeader className="space-y-1 px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-1">
              <DropdownMenu>
                <DropdownTrigger
                  render={
                    <SidebarIdentityRow
                      as="button"
                      primary={organization}
                      leading={<SidebarIdentityAvatar tone="brand">Z</SidebarIdentityAvatar>}
                      trailing={<ChevronDown className="size-4" />}
                    />
                  }
                />
                <DropdownContent align="center" alignOffset={20} className="!w-60 !min-w-60 !max-w-60">
                  {["ZAIops Production", "Platform Engineering"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="flex h-control-md w-full items-center rounded-control px-2 text-left text-body text-fg-default transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
                      aria-pressed={organization === name}
                      onClick={() => setOrganization(name)}
                    >
                      {name}
                    </button>
                  ))}
                </DropdownContent>
              </DropdownMenu>
              <SidebarTrigger label="Toggle navigation" />
            </div>
            <OperationsSearchTrigger onOpen={() => setSearchOpen(true)} />
          </SidebarHeader>
          <SidebarContent contentClassName="gap-4 px-2 py-1">
            <SidebarGroup>
              <SidebarGroupContent><NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Primary navigation">{primary.map(renderItem)}</NavMenu></SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Inspection governance</SidebarGroupLabel>
              <SidebarGroupContent><NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Inspection governance">{governance.map(renderItem)}</NavMenu></SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-2 py-1.5">
            <SidebarIdentityRow primary="Carlos Feng" description="Operations lead" layout="two-line" leading={<SidebarIdentityAvatar>CF</SidebarIdentityAvatar>} />
          </SidebarFooter>
        </Sidebar>
        <PageLayout className="h-full min-w-0 flex-1">
          <PageHeader>
            <div className="flex min-w-0 items-center gap-2">
              <SidebarFloatingTrigger
                collapsedBehavior="offcanvas"
                label="Expand operations navigation"
                contentClassName="w-60 p-1"
                renderContent={({ close }) => (
                  <div className="flex min-w-0 flex-col gap-3 py-1">
                    <div className="px-1">
                      <OperationsSearchTrigger onOpen={() => {
                        close();
                        setSearchOpen(true);
                      }} />
                    </div>
                    <NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Operations navigation">
                      {primary.map((item) => renderFloatingItem(item, close))}
                    </NavMenu>
                    <div>
                      <p className="px-2 pb-1.5 text-label text-fg-muted">Inspection governance</p>
                      <NavMenu activeValue={active} keyboardNavigation="roving" aria-label="Inspection governance">
                        {governance.map((item) => renderFloatingItem(item, close))}
                      </NavMenu>
                    </div>
                  </div>
                )}
              />
              <PageHeaderContent icon={Home}><nav aria-label="Breadcrumb" className="text-body text-fg-muted">ZAIops / Operations</nav></PageHeaderContent>
            </div>
            <div className="xl:hidden"><SidebarTrigger label="Open navigation" className="min-h-11 min-w-11" /></div>
          </PageHeader>
          <PageContent>
            <PageBody className="p-6">
              <PageTitle className="text-title">{title}</PageTitle>
              <p className="mt-2 max-w-xl text-body text-fg-muted">{description}</p>
              {children && <div className="mt-6">{children}</div>}
            </PageBody>
          </PageContent>
        </PageLayout>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Search ZAIops</DialogTitle>
            <DialogDescription>Search sessions, clusters, inspection plans, and the knowledge base.</DialogDescription>
          </DialogHeader>
          <div className="rounded-control border border-border-subtle px-3 py-2 text-body text-fg-subtle">Enter a keyword to begin searching…</div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
