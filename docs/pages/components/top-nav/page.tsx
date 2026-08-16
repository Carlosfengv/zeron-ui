"use client";

import { useState } from "react";
import { AppShell, AppShellHeader, AppShellMain } from "@zeron/ui/app-shell";
import { PageBody, PageContent, PageLayout } from "@zeron/ui/page-layout";
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavItemMenu,
  TopNavItemMenuContent,
  TopNavItemMenuTrigger,
  TopNavNavigation,
  type TopNavNavigationAlign,
} from "@zeron/ui/top-nav";
import { NavItem, NavItemContent, NavItemLabel, NavItemTrigger } from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import {
  PlayField,
  PlaySelect,
  PlaySection,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@docs/components/playground/playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";

const code = `<TopNav navigationAlign="center" className="px-3 py-1 sm:px-3">
  <TopNavBrand className="gap-3">
    <strong className="text-heading">Zentrix</strong>
    <span className="text-body">能力中心</span>
  </TopNavBrand>
  <TopNavNavigation>
    <NavMenu
      orientation="horizontal"
      variant="underline"
      activeValue="mcp"
      keyboardNavigation="roving"
    >
      <NavItem value="home">...</NavItem>
      <NavItem value="models">...</NavItem>
      <NavItem value="mcp">...</NavItem>
      <NavItem value="more">
        <TopNavItemMenu>
          <TopNavItemMenuTrigger>
            <NavItemContent><NavItemLabel>更多</NavItemLabel></NavItemContent>
          </TopNavItemMenuTrigger>
          <TopNavItemMenuContent>
            <NavMenu as="div" orientation="vertical">
              <NavItem value="api">...</NavItem>
              <NavItem value="docs">...</NavItem>
              <NavItem value="updates">...</NavItem>
            </NavMenu>
          </TopNavItemMenuContent>
        </TopNavItemMenu>
      </NavItem>
    </NavMenu>
  </TopNavNavigation>
  <TopNavActions>
    <Button variant="neutral">登录</Button>
  </TopNavActions>
</TopNav>`;

function buildAppShellCode(navigationAlign: TopNavNavigationAlign) {
  return `<AppShell layout="stacked">
  <AppShellHeader>
    <TopNav navigationAlign="${navigationAlign}">
      <TopNavBrand>Zentrix / 能力中心</TopNavBrand>
      <TopNavNavigation>
        <NavMenu orientation="horizontal" variant="underline" activeValue="mcp">
          <NavItem value="mcp">...</NavItem>
          <NavItem value="more">
            <TopNavItemMenu>...</TopNavItemMenu>
          </NavItem>
        </NavMenu>
      </TopNavNavigation>
      <TopNavActions><Button variant="neutral">登录</Button></TopNavActions>
    </TopNav>
  </AppShellHeader>
  <AppShellMain>
    <PageLayout className="h-full pt-0">
      <PageContent>
        <PageBody>...</PageBody>
      </PageContent>
    </PageLayout>
  </AppShellMain>
</AppShell>`;
}

const demoSections = {
  home: {
    label: "首页",
    eyebrow: "能力中心",
    title: "连接你的 AI 工作流",
    description: "集中发现模型与工具能力，并快速接入现有业务场景。",
  },
  models: {
    label: "模型广场",
    eyebrow: "模型广场",
    title: "统一管理模型能力",
    description: "在一个入口中查看、选择并配置适合不同任务的模型。",
  },
  mcp: {
    label: "MCP 广场",
    eyebrow: "MCP 广场",
    title: "扩展智能体的能力边界",
    description: "浏览可复用的 MCP 服务，让智能体连接更多数据与工具。",
  },
  api: {
    label: "API 管理",
    eyebrow: "开发者工具",
    title: "集中管理接口与凭据",
    description: "查看调用地址、访问凭据和服务运行状态。",
  },
  docs: {
    label: "使用文档",
    eyebrow: "帮助中心",
    title: "从示例快速开始",
    description: "通过指南与代码示例了解能力接入方式。",
  },
  updates: {
    label: "更新日志",
    eyebrow: "产品动态",
    title: "了解最近发布的能力",
    description: "跟进模型、工具和平台体验的最新变化。",
  },
} as const;

const navigationAlignments: TopNavNavigationAlign[] = ["left", "center", "right"];
const primarySections = ["home", "models", "mcp"] as const;
const moreSections = ["api", "docs", "updates"] as const;

type DemoSection = keyof typeof demoSections;

interface ZentrixTopNavProps {
  activeSection: DemoSection;
  navigationAlign?: TopNavNavigationAlign;
  onActiveSectionChange: (value: DemoSection) => void;
}

function ZentrixTopNav({
  activeSection,
  navigationAlign = "center",
  onActiveSectionChange,
}: ZentrixTopNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeMoreSection = moreSections.find(
    (value) => value === activeSection
  );
  const activeTopLevel = activeMoreSection ? "more" : activeSection;
  const activeMoreLabel = activeMoreSection
    ? demoSections[activeMoreSection].label
    : "更多";

  return (
    <TopNav navigationAlign={navigationAlign} className="w-full px-3 py-1 sm:px-3">
      <TopNavBrand className="min-w-0 gap-3 text-fg-default">
        <strong className="shrink-0 text-heading leading-none font-bold">Zentrix</strong>
        <span className="shrink-0 text-body font-medium">能力中心</span>
      </TopNavBrand>
      <TopNavNavigation>
        <NavMenu
          orientation="horizontal"
          variant="underline"
          activeValue={activeTopLevel}
          keyboardNavigation="roving"
          aria-label="能力中心导航"
        >
          {primarySections.map((value) => (
            <NavItem key={value} value={value}>
              <NavItemTrigger
                href={`#${value}`}
                className="px-1.5"
                onClick={(event) => {
                  event.preventDefault();
                  onActiveSectionChange(value);
                }}
              >
                <NavItemContent>
                  <NavItemLabel>{demoSections[value].label}</NavItemLabel>
                </NavItemContent>
              </NavItemTrigger>
            </NavItem>
          ))}
          <NavItem value="more">
            <TopNavItemMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <TopNavItemMenuTrigger className="px-1.5">
                <NavItemContent>
                  <NavItemLabel>{activeMoreLabel}</NavItemLabel>
                </NavItemContent>
              </TopNavItemMenuTrigger>
              <TopNavItemMenuContent aria-label="更多导航">
                <NavMenu
                  as="div"
                  orientation="vertical"
                  activeValue={activeSection}
                  keyboardNavigation="native"
                  aria-label="更多导航"
                >
                  {moreSections.map((value) => (
                    <NavItem key={value} value={value}>
                      <NavItemTrigger
                        href={`#${value}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setMoreOpen(false);
                          onActiveSectionChange(value);
                        }}
                      >
                        <NavItemContent>
                          <NavItemLabel>{demoSections[value].label}</NavItemLabel>
                        </NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                  ))}
                </NavMenu>
              </TopNavItemMenuContent>
            </TopNavItemMenu>
          </NavItem>
        </NavMenu>
      </TopNavNavigation>
      <TopNavActions className="min-w-0 justify-end">
        <Button type="button" size="md" variant="neutral" className="px-2">登录</Button>
      </TopNavActions>
    </TopNav>
  );
}

function TopNavAppShellPlayground() {
  const [activeSection, setActiveSection] = useState<DemoSection>("mcp");
  const [navigationAlign, setNavigationAlign] = useState<TopNavNavigationAlign>("center");
  const section = demoSections[activeSection];
  const controls = (
    <PlaygroundPanel
      onShuffle={() => {
        const next = navigationAlignments[Math.floor(Math.random() * navigationAlignments.length)];
        setNavigationAlign(next);
      }}
    >
      <PlaySection label="Layout" />
      <PlayField label="Navigation alignment">
        <PlaySelect
          value={navigationAlign}
          onChange={(next) => setNavigationAlign(next as TopNavNavigationAlign)}
          options={navigationAlignments.map((align) => ({
            value: align,
            label: align.charAt(0).toUpperCase() + align.slice(1),
          }))}
        />
      </PlayField>
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview
          code={buildAppShellCode(navigationAlign)}
          padding="none"
          minHeightClass="min-h-[400px]"
          fullScreenable
        >
          <div className="h-[400px] w-full group-data-[fullscreen=true]/preview-content:h-full">
            <AppShell
              layout="stacked"
              className="h-full min-h-0 w-full overflow-hidden text-body"
            >
              <AppShellHeader>
                <ZentrixTopNav
                  activeSection={activeSection}
                  navigationAlign={navigationAlign}
                  onActiveSectionChange={setActiveSection}
                />
              </AppShellHeader>
              <AppShellMain landmark={false} className="flex min-h-0 overflow-hidden">
                <PageLayout className="h-full pt-0">
                  <PageContent>
                    <PageBody>
                      <section aria-live="polite" className="p-5 sm:p-6">
                        <p className="text-caption text-fg-muted">{section.eyebrow}</p>
                        <h2 className="mt-1 text-title text-fg-default">{section.title}</h2>
                        <p className="mt-2 max-w-lg text-body text-fg-muted">{section.description}</p>
                      </section>
                    </PageBody>
                  </PageContent>
                </PageLayout>
              </AppShellMain>
            </AppShell>
          </div>
        </ComponentPreview>
      }
    />
  );
}

const props: PropDef[] = [
  { name: "variant", type: '"default" | "floating"', default: '"default"', description: "Transparent by default, or an inset raised surface when floating." },
  { name: "navigationAlign", type: '"left" | "center" | "right"', default: '"center"', description: "Aligns navigation next to the brand, at the exact center, or next to the actions." },
];

const menuTriggerProps: PropDef[] = [
  { name: "suffix", type: "ReactNode", default: "ChevronDown", description: "Replaces the default dropdown chevron. Pass null to hide it." },
  { name: "children", type: "ReactNode", description: "Navigation item content rendered inside the menu button." },
];

export default function TopNavDoc() {
  const [active, setActive] = useState<DemoSection>("mcp");
  return <DocPage title="TopNav" slug="top-nav" description="A compact horizontal navigation container that shares NavMenu and NavItem behavior with Sidebar.">
    <DocSection title="Playground">
      <TopNavAppShellPlayground />
    </DocSection>
    <DocSection title="Basic">
      <ComponentPreview code={code} padding="none">
        <ZentrixTopNav activeSection={active} onActiveSectionChange={setActive} />
      </ComponentPreview>
    </DocSection>
    <DocSection title="API Reference"><PropsTable props={props} /></DocSection>
    <DocSection title="API Reference — TopNavItemMenuTrigger"><PropsTable props={menuTriggerProps} /></DocSection>
  </DocPage>;
}
