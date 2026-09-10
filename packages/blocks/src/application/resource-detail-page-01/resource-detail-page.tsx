"use client";

/* eslint-disable @next/next/no-img-element -- Registry Blocks stay framework-agnostic. */

import { type ReactNode, useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSection,
  DetailListSectionLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { ResourceDetailLayout } from "@zeron/ui/resource-detail-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import { Switch } from "@zeron/ui/switch";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  ResourceWorkspaceShell,
  type ResourceWorkspaceShellProps,
} from "../resource-workspace-shell-01";
import feishuLogo from "./feishu.svg";
import mcpMarketIcon from "./mcp-market.svg";
import {
  defaultResourceDetailPageLabels,
  type ResourceDetailPageChange,
  type ResourceDetailPageData,
  type ResourceDetailPageLabelOverrides,
  type ResourceDetailPageSection,
  type ResourceProtectionSettings,
} from "./resource-detail-page-data";

function assetUrl(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

export interface ResourceDetailPageProps
  extends Omit<ResourceWorkspaceShellProps, "children"> {
  /** Required business data. Use defaultResourceDetailPageData explicitly for demos. */
  data: ResourceDetailPageData;
  labels?: ResourceDetailPageLabelOverrides;
  activeSection?: ResourceDetailPageSection;
  defaultSection?: ResourceDetailPageSection;
  onSectionChange?: (section: ResourceDetailPageSection) => void;
  onClose?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEdit?: () => void;
  onPublishedChange?: (published: boolean) => void;
  onCategoriesChange?: (categories: readonly string[]) => void;
  onSecurityLevelChange?: (level: string) => void;
  onProtectionChange?: (settings: ResourceProtectionSettings) => void;
  /** Unified event boundary for persisting editable fields through one adapter. */
  onResourceChange?: (change: ResourceDetailPageChange) => void;
  resourceIcon?: ReactNode;
  sourceIcon?: ReactNode;
  detailActions?: ReactNode;
  detailNavigation?: ReactNode;
  detailStatus?: ReactNode;
  recordNavigation?: ReactNode;
  /** Pass null to remove the rail or a render function to consume editable state. */
  overviewAside?:
    | ReactNode
    | ((context: ResourceDetailPageOverviewContext) => ReactNode);
  sectionContent?: Partial<Record<ResourceDetailPageSection, ReactNode>>;
}

export interface ResourceDetailPageOverviewContext {
  categories: readonly string[];
  data: ResourceDetailPageData;
  onCategoriesChange: (categories: readonly string[]) => void;
  onProtectionChange: (settings: ResourceProtectionSettings) => void;
  onPublishedChange: (published: boolean) => void;
  onSecurityLevelChange: (level: string) => void;
  protection: ResourceProtectionSettings;
  published: boolean;
  securityLevel: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-5 text-heading font-semibold text-fg-default first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-5 text-title font-semibold text-fg-default first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-4 text-body font-semibold text-fg-default first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-fg-default">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-fg-muted">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-fg-muted">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 [&>p]:my-0">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-r-lg border-l-2 border-border bg-surface-raised px-3 py-2 text-fg-muted">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      className="font-medium text-fg-brand underline decoration-current/35 underline-offset-2 hover:decoration-current"
      href={href}
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="my-3 max-w-full overflow-x-auto whitespace-pre rounded-lg bg-surface-raised px-3 py-2 font-mono text-label leading-5">
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code
      className={cn(
        "rounded bg-surface-raised px-1 py-0.5 font-mono text-fg-default",
        className
      )}
    >
      {children}
    </code>
  ),
};

function DetailSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={checked}
      className="p-0 [&>span:last-child]:sr-only"
      label={label}
      onCheckedChange={onCheckedChange}
    />
  );
}

function ResourceMetadataPanel({
  categories,
  data,
  onCategoriesChange,
  onProtectionChange,
  onPublishedChange,
  onSecurityLevelChange,
  protection,
  published,
  securityLevel,
  sourceIcon,
  labels,
}: {
  categories: readonly string[];
  data: ResourceDetailPageData;
  onCategoriesChange: (categories: readonly string[]) => void;
  onProtectionChange: (settings: ResourceProtectionSettings) => void;
  onPublishedChange: (published: boolean) => void;
  onSecurityLevelChange: (level: string) => void;
  protection: ResourceProtectionSettings;
  published: boolean;
  securityLevel: string;
  sourceIcon: ReactNode;
  labels: typeof defaultResourceDetailPageLabels;
}) {
  const ChevronDown = useIcon("chevron-down");

  const toggleCategory = (category: string) => {
    const next = categories.includes(category)
      ? categories.filter((item) => item !== category)
      : [...categories, category];
    onCategoriesChange(next);
  };

  return (
    <DetailList className="rounded-xl p-3">
      <DetailListSection aria-labelledby="resource-basic-properties">
        <DetailListSectionLabel id="resource-basic-properties">
          {labels.basicProperties}
        </DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>{labels.source}</DetailListLabel>
          <DetailListValue>
            <span className="inline-flex items-center gap-1.5">
              {sourceIcon}
              {data.source}
            </span>
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>{labels.version}</DetailListLabel>
          <DetailListValue>{data.version}</DetailListValue>
        </DetailListItem>
        <DetailListItem className="items-start">
          <DetailListLabel className="pt-1.5">
            {labels.categories}
          </DetailListLabel>
          <DetailListValue className="flex-1 max-w-none">
            <DropdownMenu>
              <DropdownTrigger
                render={
                  <Button
                    aria-label={labels.categoryAction}
                    className="h-auto min-h-control-sm max-w-full px-1.5 py-1"
                    size="sm"
                    trailingIcon={ChevronDown}
                    type="button"
                    variant="ghost"
                  >
                    <span className="flex flex-wrap items-center justify-end gap-0.5">
                      {categories.map((category) => (
                        <Badge color="blue" key={category} size="sm">
                          {category}
                        </Badge>
                      ))}
                    </span>
                  </Button>
                }
              />
              <DropdownContent align="end">
                {data.categoryOptions.map((category, index) => (
                  <MenuItem
                    checked={categories.includes(category)}
                    index={index}
                    key={category}
                    label={category}
                    onSelect={() => toggleCategory(category)}
                  />
                ))}
              </DropdownContent>
            </DropdownMenu>
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>{labels.publishStatus}</DetailListLabel>
          <DetailListValue>
            <DetailSwitch
              checked={published}
              label={labels.publishAction}
              onCheckedChange={onPublishedChange}
            />
          </DetailListValue>
        </DetailListItem>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-authentication">
        <DetailListSectionLabel id="resource-authentication">
          {labels.authentication}
        </DetailListSectionLabel>
        <DetailListItem className="items-start">
          <DetailListLabel>{labels.endpoint}</DetailListLabel>
          <DetailListValue className="flex-1 max-w-none break-all">
            {data.authentication.endpoint}
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>{labels.transport}</DetailListLabel>
          <DetailListValue>{data.authentication.transport}</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>{labels.credentialStatus}</DetailListLabel>
          <DetailListValue>
            <Badge color="green" size="sm" variant="dot">
              {data.authentication.credentialStatus}
            </Badge>
          </DetailListValue>
        </DetailListItem>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-security">
        <DetailListSectionLabel id="resource-security">
          {labels.securityLevel}
        </DetailListSectionLabel>
        <Select
          onValueChange={onSecurityLevelChange}
          size="md"
          value={securityLevel}
        >
          <SelectTrigger
            aria-label={labels.securityLevel}
            className="w-full min-w-0"
          />
          <SelectContent>
            {data.security.levelOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-1 rounded-lg bg-surface-raised px-3 py-2 text-label leading-5 text-fg-muted">
          {data.security.description}
        </div>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-protection">
        <DetailListSectionLabel id="resource-protection">
          {labels.protection}
        </DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>{labels.rateLimit}</DetailListLabel>
          <DetailListValue>
            <DetailSwitch
              checked={protection.rateLimitEnabled}
              label={labels.rateLimitAction}
              onCheckedChange={(checked) =>
                onProtectionChange({ ...protection, rateLimitEnabled: checked })
              }
            />
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>{labels.circuitBreaker}</DetailListLabel>
          <DetailListValue>
            <DetailSwitch
              checked={protection.circuitBreakerEnabled}
              label={labels.circuitBreakerAction}
              onCheckedChange={(checked) =>
                onProtectionChange({
                  ...protection,
                  circuitBreakerEnabled: checked,
                })
              }
            />
          </DetailListValue>
        </DetailListItem>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-surface-raised p-3 text-label">
          <ProtectionValue
            label={labels.requestsPerMinute}
            value={protection.requestsPerMinute}
          />
          <ProtectionValue
            label={labels.timeout}
            value={`${protection.timeoutSeconds}s`}
          />
          <ProtectionValue
            label={labels.concurrency}
            value={protection.concurrency}
          />
          <ProtectionValue
            label={labels.overflowPolicy}
            value={protection.overflowPolicy}
          />
          <ProtectionValue
            className="col-span-2"
            label={labels.scope}
            value={protection.scope}
          />
        </div>
      </DetailListSection>
    </DetailList>
  );
}

function ProtectionValue({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-fg-subtle">{label}</p>
      <p className="mt-0.5 font-medium text-fg-default">{value}</p>
    </div>
  );
}

function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <article className="min-w-0 rounded-xl border-[0.5px] border-border bg-surface-floating px-5 py-4 text-body leading-6 text-fg-muted">
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

function EmptySection({
  description,
  label,
}: {
  description: string;
  label: string;
}) {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border-[0.5px] border-border bg-surface-floating px-6 py-12 text-center">
      <p className="text-title font-semibold text-fg-default">{label}</p>
      <p className="mt-1 text-body text-fg-muted">{description}</p>
    </section>
  );
}

export function ResourceDetailPage({
  activeSection,
  data,
  defaultSection = "overview",
  detailActions,
  detailNavigation,
  detailStatus,
  labels,
  onCategoriesChange,
  onClose,
  onEdit,
  onNext,
  onPrevious,
  onProtectionChange,
  onPublishedChange,
  onResourceChange,
  onSectionChange,
  onSecurityLevelChange,
  overviewAside,
  recordNavigation,
  resourceIcon,
  sectionContent,
  sourceIcon,
  ...shellProps
}: ResourceDetailPageProps) {
  const [uncontrolledSection, setUncontrolledSection] =
    useState<ResourceDetailPageSection>(defaultSection);
  const [categories, setCategories] =
    useState<readonly string[]>(data.categories);
  const [published, setPublished] = useState(data.published);
  const [securityLevel, setSecurityLevel] = useState(data.security.level);
  const [protection, setProtection] = useState(data.protection);
  const section = activeSection ?? uncontrolledSection;
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const Close = useIcon("x");
  const resolvedLabels = {
    ...defaultResourceDetailPageLabels,
    ...labels,
    sections: {
      ...defaultResourceDetailPageLabels.sections,
      ...labels?.sections,
    },
  };
  const resolvedResourceIcon = resourceIcon ?? (
    <img alt="" aria-hidden className="h-auto w-7" src={assetUrl(feishuLogo)} />
  );
  const resolvedSourceIcon = sourceIcon ?? (
    <img
      alt=""
      aria-hidden
      className="size-4 text-fg-default"
      src={assetUrl(mcpMarketIcon)}
    />
  );

  useEffect(() => {
    setCategories(data.categories);
    setPublished(data.published);
    setSecurityLevel(data.security.level);
    setProtection(data.protection);
  }, [data]);

  const changeSection = (value: string) => {
    const next = value as ResourceDetailPageSection;
    if (activeSection === undefined) setUncontrolledSection(next);
    onSectionChange?.(next);
  };
  const changeCategories = (value: readonly string[]) => {
    setCategories(value);
    onCategoriesChange?.(value);
    onResourceChange?.({ type: "categories", value });
  };
  const changePublished = (value: boolean) => {
    setPublished(value);
    onPublishedChange?.(value);
    onResourceChange?.({ type: "published", value });
  };
  const changeSecurityLevel = (value: string) => {
    setSecurityLevel(value);
    onSecurityLevelChange?.(value);
    onResourceChange?.({ type: "security-level", value });
  };
  const changeProtection = (value: ResourceProtectionSettings) => {
    setProtection(value);
    onProtectionChange?.(value);
    onResourceChange?.({ type: "protection", value });
  };
  const overviewContext: ResourceDetailPageOverviewContext = {
    categories,
    data,
    onCategoriesChange: changeCategories,
    onProtectionChange: changeProtection,
    onPublishedChange: changePublished,
    onSecurityLevelChange: changeSecurityLevel,
    protection,
    published,
    securityLevel,
  };
  const resolvedOverviewAside =
    overviewAside === undefined ? (
      <ResourceMetadataPanel
        categories={categories}
        data={data}
        labels={resolvedLabels}
        onCategoriesChange={changeCategories}
        onProtectionChange={changeProtection}
        onPublishedChange={changePublished}
        onSecurityLevelChange={changeSecurityLevel}
        protection={protection}
        published={published}
        securityLevel={securityLevel}
        sourceIcon={resolvedSourceIcon}
      />
    ) : typeof overviewAside === "function" ? (
      overviewAside(overviewContext)
    ) : (
      overviewAside
    );

  return (
    <ResourceWorkspaceShell {...shellProps}>
      <Tabs
        className="h-full min-w-0 flex-1"
        onValueChange={changeSection}
        value={section}
        variant="pill"
      >
        <ResourceDetailLayout
          actions={
            detailActions === undefined ? (
              <Button
                disabled={!onEdit}
                onClick={onEdit}
                size="md"
                type="button"
                variant="tertiary"
              >
                {resolvedLabels.editAction}
              </Button>
            ) : detailActions
          }
          aside={
            section === "overview" ? resolvedOverviewAside : undefined
          }
          asideLabel={resolvedLabels.aside}
          asideSide="left"
          asideWidth="25rem"
          className="h-full"
          description={data.description}
          leading={resolvedResourceIcon}
          navigation={
            detailNavigation === undefined ? (
              <nav
                aria-label={resolvedLabels.navigationLabel}
                className="flex min-w-0 items-center gap-2 text-label text-fg-muted"
              >
                {resolvedSourceIcon}
                <span>{resolvedLabels.rootPath}</span>
                <ChevronRight aria-hidden size={14} strokeWidth={1.5} />
                <span className="flex h-4 w-5 items-center justify-center overflow-hidden">
                  {resolvedResourceIcon}
                </span>
                <span className="truncate text-fg-default">{data.name}</span>
              </nav>
            ) : detailNavigation
          }
          recordNavigation={
            recordNavigation === undefined ? (
              <div className="flex min-h-control-lg w-full items-center gap-3 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Button
                    aria-label={resolvedLabels.closeAction}
                    disabled={!onClose}
                    iconOnly
                    onClick={onClose}
                    size="md"
                    type="button"
                    variant="tertiary"
                  >
                    <Close aria-hidden size={18} strokeWidth={1.5} />
                  </Button>
                  <Button
                    aria-label={resolvedLabels.previousAction}
                    disabled={!onPrevious || data.recordIndex <= 1}
                    iconOnly
                    onClick={onPrevious}
                    size="md"
                    type="button"
                    variant="tertiary"
                  >
                    <ChevronLeft aria-hidden size={18} strokeWidth={1.5} />
                  </Button>
                  <Button
                    aria-label={resolvedLabels.nextAction}
                    disabled={!onNext || data.recordIndex >= data.recordTotal}
                    iconOnly
                    onClick={onNext}
                    size="md"
                    type="button"
                    variant="tertiary"
                  >
                    <ChevronRight aria-hidden size={18} strokeWidth={1.5} />
                  </Button>
                </div>
                <p className="whitespace-nowrap text-label tabular-nums text-fg-muted">
                  {data.recordIndex} / {data.recordTotal} {resolvedLabels.recordUnit}
                </p>
              </div>
            ) : recordNavigation
          }
          scrollMode={section === "overview" ? "columns" : "body"}
          status={
            detailStatus === undefined ? (
              <Badge color="blue" size="sm" variant="strong">
                {published ? data.status : resolvedLabels.unpublishedStatus}
              </Badge>
            ) : detailStatus
          }
          tabs={
            <TabsList aria-label={resolvedLabels.tabs} className="my-0">
              <TabItem
                label={resolvedLabels.sections.overview}
                value="overview"
              />
              <TabItem
                badge={data.toolCount}
                label={resolvedLabels.sections.tools}
                value="tools"
              />
              <TabItem label={resolvedLabels.sections.scope} value="scope" />
              <TabItem
                badge={data.callCount}
                label={resolvedLabels.sections.usage}
                value="usage"
              />
              <TabItem label={resolvedLabels.sections.audit} value="audit" />
            </TabsList>
          }
          title={data.name}
        >
          <TabPanel value="overview">
            {sectionContent?.overview ?? (
              <MarkdownContent markdown={data.markdown} />
            )}
          </TabPanel>
          {(Object.keys(resolvedLabels.sections) as ResourceDetailPageSection[])
            .filter((item) => item !== "overview")
            .map((item) => (
              <TabPanel key={item} value={item}>
                {sectionContent?.[item] ?? (
                  <EmptySection
                    description={resolvedLabels.emptySectionDescription}
                    label={resolvedLabels.sections[item]}
                  />
                )}
              </TabPanel>
            ))}
        </ResourceDetailLayout>
      </Tabs>
    </ResourceWorkspaceShell>
  );
}
