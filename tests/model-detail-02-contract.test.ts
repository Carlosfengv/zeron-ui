import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/blocks/src/application/model-detail-02/model-detail-02.tsx"),
  "utf8",
);
const data = readFileSync(
  join(ROOT, "packages/blocks/src/application/model-detail-02/model-detail-02-data.ts"),
  "utf8",
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"),
);

describe("ModelDetail02 contract", () => {
  it("ships every in-scope OpenRouter content section", () => {
    for (const id of [
      "providers",
      "pricing",
      "performance",
      "uptime",
      "benchmarks",
      "apps",
      "activity",
      "faq",
    ]) {
      expect(source).toContain(`id=\"${id}\"`);
    }
    expect(source).not.toContain('id="explore"');
    expect(source).not.toContain('["explore", "Explore"]');
    expect(source).not.toContain("function ExploreSection");
    expect(source).not.toContain("More models from");
    expect(source).toContain("<AppShell");
    expect(source).toContain("<AppShellHeader");
    expect(source).toContain("<AppShellMain");
    expect(source).toContain("<TopNav");
    expect(source).toContain("<TopNavNavigation");
    expect(source).toContain("<TopNavActions");
    expect(source).toContain('activeValue="#models"');
    expect(source).not.toContain("GlobalFooter");
  });

  it("uses Zeron components and the shared shadcn chart wrapper", () => {
    expect(source).toContain('from "@zeron/ui/page-layout"');
    expect(source).toContain('from "@zeron/ui/breadcrumb"');
    expect(source).toContain('from "@zeron/ui/card"');
    expect(source).toContain('from "@zeron/ui/chart"');
    expect(source).toContain('from "@zeron/ui/container"');
    expect(source).toContain('from "@zeron/ui/data-table"');
    expect(source).toContain("<ChartContainer");
    expect(source.match(/<CardGroup border="outlined" separated>/g)).toHaveLength(3);
    expect(source.match(/<DataTable/g)).toHaveLength(2);
    expect(source).toContain("data.model.facts.map");
    expect(source).toContain("<PageColumns");
    expect(source).toContain('asideSide="left"');
    expect(source).toContain('asideWidth="200px"');
    expect(source).toContain("<PageAside");
    expect(source).toContain('className="lg:self-stretch"');
    expect(source).toContain('className="w-full justify-start text-left"');
    expect(source).toContain("<PagePrimary");
    expect(source).not.toContain("<PageSidebar");
    expect(source).toContain('<PageContent className="overflow-y-auto overscroll-contain" ref={contentRef}>');
    expect(source).toContain('className="max-w-[1320px] flex-none overflow-visible px-3 py-3 sm:px-5"');
    expect(source).not.toContain("bodyRef");
    expect(source).toContain("event.preventDefault();");
    expect(source).toContain('root.scrollTo({ behavior: "smooth", top });');
    expect(source).toContain('window.history.replaceState(null, "", `#${section}`);');
    expect(source).toContain('root.addEventListener("scroll", selectLastSectionAtBottom, { passive: true });');
    expect(source).toContain('<PageActions className="mt-3">');
    expect(source).toContain("onOpenPlayground?: () => void;");
    expect(source).toContain("onRequestApiKey?: () => void;");
    expect(source).toContain('<BreadcrumbPage>OpenRouter</BreadcrumbPage>');
    expect(source).not.toContain("onPinChange");
    expect(source).not.toContain("data.model.compareHref");
    expect(source).not.toContain("items-start justify-between");
    expect(source).toContain('className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"');
    expect(source).toContain("meta={fact.detail}");
    expect(source).toContain('useIcon("file")');
    expect(source).toContain('useIcon("image")');
    expect(source).toContain('useIcon("type")');
    expect(source).toContain("<TooltipProvider>");
    expect(source.match(/<ModalityIcon/g)).toHaveLength(4);
    expect(source).toContain("bg-warning-surface text-fg-warning");
    expect(source).toContain("bg-success-surface text-fg-success");
    expect(source).toContain("bg-info-surface text-fg-info");
    expect(source).toContain("unit={fact.unit}");
    expect(source).toContain('fact.presentation === "modalities"');
    expect(source).toContain("<AvailabilityMonitor");
    expect(source).toContain("contained={false}");
    expect(source).toContain('<AccordionGroup className="w-full" collapsible type="single">');
    expect(source).toContain('<Tabs color="default" onValueChange={(value) => setRange(value as PricingRange)} value={range} variant="pill">');
    expect(source).not.toContain('value={range} variant="underline" color="neutral"');
    expect(source).toContain('<Container key={group.id}>');
    expect(source).toContain('<ContainerHeader>');
    expect(source).toContain('<ContainerBody>');
    expect(source).not.toContain('<Card key={group.id}>');
  });

  it("preserves the target data without external URLs", () => {
    expect(data).toContain("OpenAI: GPT-6 Astra");
    expect(data).toContain("weightedInput: 2.400673");
    expect(data).toContain("weightedOutput: 48.78");
    expect(data).toContain("OpenAI Flex");
    expect(data).toContain("Azure (US)");
    expect(data.match(/\{ id: "[^"]+", question:/g)).toHaveLength(7);
    expect(source).not.toMatch(/https?:\/\//);
    expect(data).not.toMatch(/https?:\/\//);
    expect(source).not.toContain("href={app.href}");
    expect(source).not.toContain("href={faq.href}");
    expect(source).toContain("endpointsHref={null}");
    expect(source).toContain("learnMoreHref={null}");
  });

  it("declares the complete registry boundary", () => {
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "model-detail-02",
    );
    expect(item).toMatchObject({
      dependencies: ["recharts", "tw-animate-css", "@lobehub/icons"],
      registryDependencies: expect.arrayContaining([
        "availability-monitor-01",
        "accordion",
        "app-shell",
        "breadcrumb",
        "chart",
        "container",
        "data-table",
        "icon-context",
        "nav-item",
        "nav-menu",
        "page-layout",
        "select",
        "tabs",
        "tooltip",
        "top-nav",
      ]),
    });
  });

  it("uses the OpenAI model mark and keeps identity badges below the title", () => {
    expect(source).toContain(
      'import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono"',
    );
    expect(source).toContain("<OpenAIMono size={24} />");
    expect(source).toMatch(
      /id="model-detail-title"[\s\S]*?<Badge size="sm">\{data\.model\.provider\}<\/Badge>[\s\S]*?data\.model\.slug/,
    );
  });

  it("shows matching provider logos in both provider tables", () => {
    expect(source).toContain(
      'import AzureColor from "@lobehub/icons/es/Azure/components/Color"',
    );
    expect(source).toContain('name.startsWith("Azure") ? AzureColor : OpenAIMono');
    expect(source.match(/<ProviderLogo name=\{row\.original\.name\} \/>/g)).toHaveLength(2);
    expect(source).toContain('<span className="inline-flex items-center gap-2">');
  });

  it("shows matching icons before app names", () => {
    for (const icon of ["HermesAgentMono", "CodexMono", "CursorMono", "PiMono"]) {
      expect(source).toContain(`<${icon} aria-hidden`);
    }
    expect(source).toContain("function OmpLogo()");
    expect(source).toContain('id === "omp"');
    expect(source).toContain("<AppLogo id={app.id} />");
  });
});
