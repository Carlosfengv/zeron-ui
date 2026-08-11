"use client";

import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@/components/ui/app-shell";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const sidebarCode = `<AppShell layout="sidebar">
  <AppShellSidebar>...</AppShellSidebar>
  <AppShellHeader>...</AppShellHeader>
  <AppShellMain>...</AppShellMain>
</AppShell>`;

const stackedCode = `<AppShell layout="stacked">
  <AppShellHeader>...</AppShellHeader>
  <AppShellMain>...</AppShellMain>
</AppShell>`;

const props: PropDef[] = [
  { name: "AppShell", type: 'div props & { layout?: "sidebar" | "stacked" }', default: '"sidebar"', description: "Application frame. Use sidebar for a side region and stacked for a header-over-content flow." },
  { name: "AppShellSidebar", type: 'div props & { side?: "left" | "right"; width?: CSSProperties["width"] }', default: 'side: "left", width: "260px"', description: "Optional persistent navigation column. Its side controls the main column placement." },
  { name: "AppShellHeader", type: "header props", description: "Optional sticky header in the main column." },
  { name: "AppShellMain", type: "main props", description: "The single primary content landmark." },
];

export default function AppShellDoc() {
  return <DocPage title="AppShell" slug="app-shell" description="A composable application frame with no router or navigation-state coupling.">
    <DocSection title="Sidebar layout"><ComponentPreview code={sidebarCode} padding="none" minHeightClass="min-h-[240px]" align="bottom" fullScreenable><div className="w-full p-5 group-data-[fullscreen=true]/preview-content:h-full"><AppShell layout="sidebar" className="min-h-[200px] w-full overflow-hidden border border-border text-body group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0"><AppShellSidebar className="border-r border-border bg-muted p-3">Sidebar</AppShellSidebar><AppShellHeader className="border-b border-border bg-surface-base p-3">Header</AppShellHeader><AppShellMain className="p-3">Main content</AppShellMain></AppShell></div></ComponentPreview></DocSection>
    <DocSection title="Stacked layout"><ComponentPreview code={stackedCode} padding="none" minHeightClass="min-h-[180px]" align="bottom" fullScreenable><div className="w-full p-5 group-data-[fullscreen=true]/preview-content:h-full"><AppShell layout="stacked" className="min-h-[140px] w-full overflow-hidden border border-border text-body group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0"><AppShellHeader className="border-b border-border bg-surface-base p-3">Header</AppShellHeader><AppShellMain className="p-3">Main content</AppShellMain></AppShell></div></ComponentPreview></DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
  </DocPage>;
}
