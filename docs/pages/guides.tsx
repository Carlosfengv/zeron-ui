"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardGroup,
  CardHeader,
  CardTitle,
} from "@zeron/ui/card";
import { InputCopy } from "@zeron/ui/input-copy";
import { PageBody, PageContent, PageLayout } from "@zeron/ui/page-layout";
import { cn } from "@zeron/ui/system/utils";
import { useIcon, type IconName } from "@zeron/icons/context";
import {
  localePrefixFromPathname,
  localizePathname,
} from "@docs/components/shell/site/locale-path";

const journeyIds = ["explore", "prototype", "integrate"] as const;
type JourneyId = (typeof journeyIds)[number];

const journeyIcons: Record<JourneyId, IconName> = {
  explore: "square-library",
  prototype: "doc-showcase",
  integrate: "doc-page-layout",
};

const copy = {
  en: {
    eyebrow: "Zeron guides",
    title: "Start with the job. Build from a proven pattern.",
    description:
      "Explore a working product example first, then turn it into a reviewable prototype or connect it to a real application.",
    choose: "What do you want to accomplish?",
    chooseHint: "Choose the result you need now. You can continue to another path later.",
    outcome: "You will leave with",
    journeys: {
      explore: {
        index: "01",
        title: "See whether Zeron fits",
        description: "Try real business examples and compare interaction patterns. No installation required.",
        audience: "For evaluation and design decisions",
        result: "A suitable starting pattern and a clear reason for choosing it.",
        steps: ["Browse by business task", "Use the working example", "Compare the closest alternatives"],
        action: "Browse business templates",
        href: "/docs/blocks",
        secondary: "Browse components",
        secondaryHref: "/docs/components",
      },
      prototype: {
        index: "02",
        title: "Create a reviewable prototype",
        description: "Choose a close example and ask a coding agent to adapt the content, states, and flow.",
        audience: "For PMs, UX designers, and rapid validation",
        result: "A working prototype with explicit mock data and remaining integration work.",
        steps: ["Choose a close example", "Describe your business differences", "Open, review, and refine the result"],
        action: "Start with AI",
        href: "#prototype-guide",
        secondary: "See the example first",
        secondaryHref: "/docs/blocks/resource-list-table-01",
      },
      integrate: {
        index: "03",
        title: "Connect Zeron to a product",
        description: "Install only what the page needs, then connect real data, routes, permissions, and actions.",
        audience: "For frontend delivery",
        result: "A maintainable product page ready for code review.",
        steps: ["Check the current project", "Review and run the install plan", "Connect behavior and verify states"],
        action: "Open integration guide",
        href: "/docs",
        secondary: "Inspect a data block",
        secondaryHref: "/docs/blocks/resource-list-table-01",
      },
    },
    example: {
      eyebrow: "Recommended first practice",
      title: "Build a resource management page",
      description:
        "Learn one complete workflow: search and filter resources, select rows, perform bulk actions, and account for loading, empty, and failure states.",
      labels: ["Search", "Filter", "Selection", "Bulk actions"],
      tableTitle: "Resources",
      search: "Search resources",
      filter: "Status: all",
      rows: [
        ["Compute cluster", "Enabled", "v2.4"],
        ["Backup policy", "Draft", "v1.8"],
        ["Model endpoint", "Enabled", "v3.1"],
      ],
      resultLabel: "Why start here",
      result:
        "It covers selection, composition, business adaptation, and state design without requiring a full application shell.",
      try: "Try the working example",
      compare: "Compare with Data Table",
    },
    tasks: {
      eyebrow: "More starting points",
      title: "Find the closest business task",
      description: "Choose by the work users need to complete. Asset types are explained after you select a task.",
      items: [
        ["Account settings", "Manage profiles, credentials, model access, and account actions.", "/docs/blocks/personal-settings-01", "Prototype"],
        ["Monitoring and logs", "Explore live records with search, filters, schemas, and cursor loading.", "/docs/blocks/infinite-log-table-01", "Data block"],
        ["Resource details", "Present status, metadata, metrics, and contextual actions for one resource.", "/docs/blocks/resource-details-01", "Block"],
        ["Application frame", "Start a product area with navigation and a responsive content region.", "/docs/blocks/top-nav-app-shell-01", "Layout"],
      ],
    },
    ai: {
      eyebrow: "AI-assisted setup",
      title: "Tell the agent the outcome. Let it handle the setup.",
      description:
        "You do not need to understand the CLI first. Open your project in a coding agent, copy the task below, and review the files it plans to change.",
      existing: "Already have a project",
      existingBody: "The agent checks the existing shell, theme, aliases, and installed components before adding anything.",
      newProject: "No project yet",
      newProjectBody: "The same task asks the agent to create a compatible prototype project before adding Zeron.",
      copyLabel: "Copy this task to your coding agent",
      prompt:
        "Use the zeron-page-builder skill if it is available. Build a reviewable resource management prototype with Zeron. The page must support search, status filtering, row selection, and bulk actions. Use explicit mock data and include loading, empty, filtered-empty, and action-failure states. If this folder already contains a React or Next.js project, preserve its existing shell, theme, routes, and package manager. If no compatible project exists, create a minimal Next.js prototype project first. Inspect the current project and the Zeron catalog, compare resource-list-table-01 with composing DataTable, and briefly explain the choice. Show the install plan before writing files, install only the required Zeron items, start the preview, and report the preview URL, review steps, and work still needed for real data and business services.",
      agentSteps: ["Inspect the project", "Choose the closest Zeron asset", "Show the install plan", "Build and open the preview"],
      completion: "Done when you can operate the prototype in a browser and clearly see which parts are still simulated.",
      manual: "Prefer manual setup?",
      manualBody: "Initialize Zeron, then add only the block or components selected for the page.",
    },
  },
  zh: {
    eyebrow: "Zeron 使用指南",
    title: "从业务任务开始，用成熟模式完成页面",
    description: "先体验一个可以工作的产品案例，再把它变成可评审原型，或接入真实产品。",
    choose: "你现在想完成什么？",
    chooseHint: "选择当前需要的结果。完成后仍可以继续进入另一条路径。",
    outcome: "完成后你将获得",
    journeys: {
      explore: {
        index: "01",
        title: "判断 Zeron 是否适合",
        description: "体验真实业务案例并比较交互模式，无需安装。",
        audience: "适合前期评估与设计选型",
        result: "一个适合当前任务的起点，以及清晰的选型理由。",
        steps: ["按业务任务浏览", "操作完整示例", "比较相近方案"],
        action: "浏览业务模板",
        href: "/docs/blocks",
        secondary: "浏览组件",
        secondaryHref: "/docs/components",
      },
      prototype: {
        index: "02",
        title: "创建可评审的业务原型",
        description: "选择接近需求的案例，让 coding agent 改造内容、状态与流程。",
        audience: "适合 PM、UX 设计师与快速验证",
        result: "一个可操作的原型，以及明确的模拟数据和待接入项。",
        steps: ["选择相近案例", "描述业务差异", "打开原型并持续调整"],
        action: "用 AI 开始搭建",
        href: "#prototype-guide",
        secondary: "先体验示例",
        secondaryHref: "/docs/blocks/resource-list-table-01",
      },
      integrate: {
        index: "03",
        title: "接入正式产品",
        description: "安装页面真正需要的内容，连接数据、路由、权限与业务操作。",
        audience: "适合前端工程交付",
        result: "一个能够进入代码评审、可继续维护的业务页面。",
        steps: ["检查现有项目", "查看并执行安装计划", "接入业务并验证状态"],
        action: "查看工程接入",
        href: "/docs",
        secondary: "查看数据区块",
        secondaryHref: "/docs/blocks/resource-list-table-01",
      },
    },
    example: {
      eyebrow: "推荐的第一次实践",
      title: "搭建资源管理页面",
      description: "完整走通一次搜索、筛选、选择和批量操作，并补齐加载、空数据和失败状态。",
      labels: ["搜索", "筛选", "选择", "批量操作"],
      tableTitle: "资源",
      search: "搜索资源",
      filter: "状态：全部",
      rows: [
        ["计算集群", "已启用", "v2.4"],
        ["备份策略", "草稿", "v1.8"],
        ["模型端点", "已启用", "v3.1"],
      ],
      resultLabel: "为什么从这里开始",
      result: "这个案例同时覆盖选型、页面组合、业务适配与状态设计，而且不要求先搭建完整应用框架。",
      try: "体验完整示例",
      compare: "与 Data Table 比较",
    },
    tasks: {
      eyebrow: "更多起点",
      title: "找到最接近的业务任务",
      description: "先按用户要完成的工作选择。选中后，再解释它属于模板、区块还是组件组合。",
      items: [
        ["账户与个人设置", "管理资料、凭证、模型权限与账户操作。", "/docs/blocks/personal-settings-01", "原型"],
        ["监控与日志", "通过搜索、筛选、Schema 和游标加载查看实时记录。", "/docs/blocks/infinite-log-table-01", "数据区块"],
        ["资源详情", "展示单个资源的状态、元数据、指标与上下文操作。", "/docs/blocks/resource-details-01", "区块"],
        ["应用框架", "用导航与响应式内容区域建立新的产品空间。", "/docs/blocks/top-nav-app-shell-01", "布局"],
      ],
    },
    ai: {
      eyebrow: "AI 辅助准备",
      title: "告诉 Agent 你要的结果，让它处理项目准备",
      description: "你不需要先理解命令行。在 coding agent 中打开项目，复制下面的任务，再检查它准备修改的文件。",
      existing: "已经有项目",
      existingBody: "Agent 会先检查现有应用框架、主题、路径别名和已安装组件，再决定需要增加什么。",
      newProject: "还没有项目",
      newProjectBody: "同一份任务会要求 Agent 先创建兼容的原型项目，然后再引入 Zeron。",
      copyLabel: "复制给 coding agent",
      prompt:
        "如果 zeron-page-builder skill 可用，请使用它。使用 Zeron 搭建一个可评审的资源管理原型，支持搜索、状态筛选、行选择与批量操作。使用明确的模拟数据，并提供加载、空数据、筛选无结果和操作失败状态。如果当前目录已有 React 或 Next.js 项目，请保留现有应用框架、主题、路由与包管理器；如果没有兼容项目，先创建一个最小的 Next.js 原型项目。检查当前项目和 Zeron 目录，比较 resource-list-table-01 与使用 DataTable 重新组合，并简要说明选择理由。写入文件前展示安装计划，只安装需要的 Zeron 内容。完成后启动预览，并给出预览地址、评审步骤，以及接入真实数据和业务服务仍需完成的工作。",
      agentSteps: ["检查项目", "选择合适的 Zeron 资产", "展示安装计划", "搭建并打开预览"],
      completion: "当你可以在浏览器中操作原型，并清楚知道哪些部分仍是模拟时，这条路径才算完成。",
      manual: "希望手动安装？",
      manualBody: "先初始化 Zeron，再只安装本页面选中的区块或组件。",
    },
  },
} as const;

function JourneyButton({ active, description, icon, index, onSelect, title }: {
  active: boolean;
  description: string;
  icon: IconName;
  index: string;
  onSelect: () => void;
  title: string;
}) {
  const Icon = useIcon(icon);

  return (
    <button
      aria-pressed={active}
      className={cn(
        "group flex min-h-28 w-full items-start gap-3 border-b border-border-subtle px-4 py-4 text-left outline-none transition-colors duration-fast last:border-b-0 hover:bg-hover focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring lg:min-h-32 lg:border-b-0 lg:border-r lg:last:border-r-0",
        active && "bg-active",
      )}
      onClick={onSelect}
      type="button"
    >
      <span className={active ? "mt-0.5 text-fg-brand" : "mt-0.5 text-fg-muted"}>
        <Icon aria-hidden size={18} strokeWidth={active ? 2 : 1.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-label text-fg-muted">{index}</span>
        <span className={active ? "mt-1 block text-body font-semibold text-fg-default" : "mt-1 block text-body font-medium text-fg-default"}>{title}</span>
        <span className="mt-1.5 block text-label leading-5 text-fg-muted">{description}</span>
      </span>
    </button>
  );
}

export default function GuidesPage() {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const language = localePrefix === "/en" ? "en" : "zh";
  const text = copy[language];
  const [journey, setJourney] = useState<JourneyId>("prototype");
  const activeJourney = text.journeys[journey];
  const ArrowRight = useIcon("arrow-right");
  const Check = useIcon("check-square");
  const hrefFor = (href: string) => href.startsWith("#") ? href : localizePathname(href, localePrefix);

  return (
    <section aria-labelledby="guides-title" className="flex h-[calc(100svh-3rem)] min-h-0 w-full bg-surface-base">
      <PageLayout className="h-full min-h-0 w-full" gutter="none" size="full">
        <PageContent className="overflow-y-auto overscroll-contain">
          <PageBody className="h-auto overflow-visible">
            <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
              <header className="max-w-3xl">
                <p className="text-label font-medium text-fg-brand">{text.eyebrow}</p>
                <h1 id="guides-title" className="mt-4 max-w-2xl text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-fg-default">{text.title}</h1>
                <p className="mt-5 max-w-2xl text-[1.05rem] leading-7 text-fg-muted">{text.description}</p>
              </header>

              <section aria-labelledby="journey-title" className="mt-12 lg:mt-16">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <h2 id="journey-title" className="text-title font-semibold text-fg-default">{text.choose}</h2>
                    <p className="mt-1 text-body text-fg-muted">{text.chooseHint}</p>
                  </div>
                  <Badge color="blue" size="sm">{activeJourney.audience}</Badge>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-border bg-surface-raised">
                  <div className="grid lg:grid-cols-3">
                    {journeyIds.map((id) => (
                      <JourneyButton active={journey === id} description={text.journeys[id].description} icon={journeyIcons[id]} index={text.journeys[id].index} key={id} onSelect={() => setJourney(id)} title={text.journeys[id].title} />
                    ))}
                  </div>
                  <div aria-live="polite" className="border-t border-border bg-surface-floating px-5 py-6 sm:px-7 lg:grid lg:grid-cols-[1fr_1.1fr_auto] lg:items-center lg:gap-10 lg:px-8">
                    <div>
                      <p className="text-label text-fg-muted">{text.outcome}</p>
                      <p className="mt-2 max-w-md text-body font-medium leading-6 text-fg-default">{activeJourney.result}</p>
                    </div>
                    <ol className="mt-5 grid gap-2 lg:mt-0">
                      {activeJourney.steps.map((step, index) => (
                        <li className="flex items-center gap-2 text-body text-fg-muted" key={step}>
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-fg-muted">{index + 1}</span>{step}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-6 flex flex-wrap gap-2 lg:mt-0 lg:flex-col">
                      <Button asChild trailingIcon={ArrowRight}><Link href={hrefFor(activeJourney.href)}>{activeJourney.action}</Link></Button>
                      <Button asChild variant="ghost"><Link href={hrefFor(activeJourney.secondaryHref)}>{activeJourney.secondary}</Link></Button>
                    </div>
                  </div>
                </div>
              </section>

              <section aria-labelledby="practice-title" className="mt-20 border-t border-border pt-14 lg:mt-28 lg:pt-20">
                <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16">
                  <div className="lg:sticky lg:top-8">
                    <p className="text-label font-medium text-fg-brand">{text.example.eyebrow}</p>
                    <h2 id="practice-title" className="mt-3 text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-0.025em] text-fg-default">{text.example.title}</h2>
                    <p className="mt-4 text-body leading-6 text-fg-muted">{text.example.description}</p>
                    <div className="mt-5 flex flex-wrap gap-1.5">{text.example.labels.map((label) => <Badge key={label} size="sm" variant="dot">{label}</Badge>)}</div>
                    <div className="mt-7 border-l-2 border-brand pl-4">
                      <p className="text-label font-medium text-fg-default">{text.example.resultLabel}</p>
                      <p className="mt-1 text-body leading-6 text-fg-muted">{text.example.result}</p>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-2">
                      <Button asChild trailingIcon={ArrowRight}><Link href={localizePathname("/docs/blocks/resource-list-table-01", localePrefix)}>{text.example.try}</Link></Button>
                      <Button asChild variant="tertiary"><Link href={localizePathname("/docs/components/data-table", localePrefix)}>{text.example.compare}</Link></Button>
                    </div>
                  </div>

                  <div aria-label={text.example.title} className="overflow-hidden rounded-xl border border-border bg-surface-raised p-2 sm:p-3">
                    <div className="rounded-lg bg-surface-floating p-4 sm:p-5">
                      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div><p className="text-body font-semibold text-fg-default">{text.example.tableTitle}</p><p className="mt-0.5 text-label text-fg-muted">3 {language === "zh" ? "项资源" : "resources"}</p></div>
                        <div className="flex gap-2"><span className="min-w-0 flex-1 rounded-lg border border-border bg-surface-base px-3 py-2 text-label text-fg-muted sm:w-40">{text.example.search}</span><span className="rounded-lg bg-muted px-3 py-2 text-label text-fg-default">{text.example.filter}</span></div>
                      </div>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full min-w-[430px] border-collapse text-left">
                          <thead><tr className="text-label text-fg-muted"><th className="w-10 px-2 py-3 font-normal"><span className="block size-3.5 rounded border border-border" /></th><th className="px-2 py-3 font-normal">{language === "zh" ? "名称" : "Name"}</th><th className="px-2 py-3 font-normal">{language === "zh" ? "状态" : "Status"}</th><th className="px-2 py-3 font-normal">{language === "zh" ? "版本" : "Version"}</th></tr></thead>
                          <tbody>{text.example.rows.map(([name, status, version], index) => <tr className="border-t border-border-subtle text-body" key={name}><td className="px-2 py-4"><span className={index === 0 ? "flex size-3.5 items-center justify-center rounded border border-brand bg-brand text-[10px] text-fg-on-brand" : "block size-3.5 rounded border border-border"}>{index === 0 ? "✓" : null}</span></td><td className="px-2 py-4 font-medium text-fg-default">{name}</td><td className="px-2 py-4"><Badge color={status === "Draft" || status === "草稿" ? "gray" : "green"} size="sm" variant="dot">{status}</Badge></td><td className="px-2 py-4 text-fg-muted">{version}</td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section aria-labelledby="tasks-title" className="mt-20 lg:mt-28">
                <p className="text-label font-medium text-fg-brand">{text.tasks.eyebrow}</p>
                <div className="mt-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><h2 id="tasks-title" className="text-heading font-semibold tracking-[-0.02em] text-fg-default">{text.tasks.title}</h2><p className="max-w-lg text-body leading-6 text-fg-muted">{text.tasks.description}</p></div>
                <CardGroup border="outlined" className="mt-6" orientation="inline" proximityHover>
                  {text.tasks.items.map(([title, description, href, kind]) => (
                    <Card href={localizePathname(href, localePrefix)} key={href} label={title}>
                      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
                      <CardFooter><Badge color="blue" size="sm">{kind}</Badge><ArrowRight aria-hidden className="ml-2 text-fg-muted" size={15} strokeWidth={1.5} /></CardFooter>
                    </Card>
                  ))}
                </CardGroup>
              </section>

              <section aria-labelledby="prototype-guide" className="mt-20 border-t border-border pt-14 lg:mt-28 lg:pt-20">
                <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
                  <div>
                    <p className="text-label font-medium text-fg-brand">{text.ai.eyebrow}</p>
                    <h2 id="prototype-guide" className="mt-3 text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-0.025em] text-fg-default">{text.ai.title}</h2>
                    <p className="mt-4 text-body leading-6 text-fg-muted">{text.ai.description}</p>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                      <div><p className="text-body font-medium text-fg-default">{text.ai.existing}</p><p className="mt-1 text-label leading-5 text-fg-muted">{text.ai.existingBody}</p></div>
                      <div><p className="text-body font-medium text-fg-default">{text.ai.newProject}</p><p className="mt-1 text-label leading-5 text-fg-muted">{text.ai.newProjectBody}</p></div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-raised p-3 sm:p-4">
                    <div className="rounded-lg bg-surface-floating p-4 sm:p-5">
                      <div className="flex items-center gap-2"><Badge color="blue" size="sm">01</Badge><p className="text-body font-medium text-fg-default">{text.ai.copyLabel}</p></div>
                      <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-base p-4 text-label leading-6 text-fg-muted">{text.ai.prompt}</p>
                      <InputCopy align="left" className="mt-3" value={text.ai.prompt} variant="button" />
                    </div>
                    <ol className="grid gap-px overflow-hidden rounded-lg bg-border-subtle sm:grid-cols-2">{text.ai.agentSteps.map((step, index) => <li className="flex items-center gap-2 bg-surface-floating px-4 py-3 text-label text-fg-muted" key={step}><span className="text-fg-brand">0{index + 1}</span>{step}</li>)}</ol>
                    <div className="mt-3 flex items-start gap-3 rounded-lg bg-surface-floating px-4 py-4"><Check aria-hidden className="mt-0.5 shrink-0 text-fg-brand" size={17} strokeWidth={1.5} /><p className="text-body leading-6 text-fg-default">{text.ai.completion}</p></div>
                    <div className="mt-5 border-t border-border px-1 pt-5">
                      <p className="text-body font-medium text-fg-default">{text.ai.manual}</p><p className="mt-1 text-label leading-5 text-fg-muted">{text.ai.manualBody}</p>
                      <div className="mt-3 grid gap-2"><InputCopy align="left" value="npx zeron-ui init" /><InputCopy align="left" value="npx zeron-ui add resource-list-table-01" /></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}
