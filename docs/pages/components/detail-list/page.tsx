"use client";

import { Badge } from "@zeron/ui/badge";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSection,
  DetailListSectionLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import { Switch } from "@zeron/ui/switch";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

const basicCode = `import {
  DetailList, DetailListItem, DetailListLabel, DetailListValue,
} from "./components";

<DetailList>
  <DetailListItem>
    <DetailListLabel>Provider</DetailListLabel>
    <DetailListValue>DeepSeek</DetailListValue>
  </DetailListItem>
  <DetailListItem>
    <DetailListLabel>Latency</DetailListLabel>
    <DetailListValue><Badge color="lime">11 ms</Badge></DetailListValue>
  </DetailListItem>
</DetailList>`;

const groupedCode = `<DetailList>
  <DetailListSection aria-labelledby="usage-label">
    <DetailListSectionLabel id="usage-label">Usage</DetailListSectionLabel>
    <DetailListItem>
      <DetailListLabel>Current</DetailListLabel>
      <DetailListValue>12.1 M</DetailListValue>
    </DetailListItem>
  </DetailListSection>
  <DetailListSeparator />
  <DetailListSection aria-labelledby="api-label">
    <DetailListSectionLabel id="api-label">API format</DetailListSectionLabel>
    <DetailListItem>
      <DetailListLabel>OpenAI Chat</DetailListLabel>
      <DetailListValue className="font-mono">/v1/chat/completions</DetailListValue>
    </DetailListItem>
  </DetailListSection>
</DetailList>`;

const resourceDetailsCode = `"use client";

import { useState } from "react";
import { Badge } from "@zeron/ui/badge";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSection,
  DetailListSectionLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import { Switch } from "@zeron/ui/switch";

export function ResourceDetails() {
  const [enabled, setEnabled] = useState(true);

  return (
    <DetailList className="w-full max-w-[400px]">
      <DetailListItem>
        <DetailListLabel>健康状态 (最近1小时)</DetailListLabel>
        <DetailListValue className="max-w-none">
          <div className="flex shrink-0 items-center gap-1 py-0.5" role="img" aria-label="最近一小时 11 次健康检查均成功">
            {Array.from({ length: 11 }, (_, index) => (
              <span key={index} aria-hidden="true" className="size-2.5 rounded-full border border-success-border bg-success-surface" />
            ))}
          </div>
        </DetailListValue>
      </DetailListItem>

      <DetailListSeparator />

      <DetailListItem>
        <DetailListLabel>开启</DetailListLabel>
        <DetailListValue className="max-w-none">
          <Switch
            label="开启资源供应商"
            checked={enabled}
            onToggle={() => setEnabled((current) => !current)}
            className="p-0 [&>span:last-child]:sr-only"
          />
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>模型供应商</DetailListLabel>
        <DetailListValue>DeepSeek</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>API 端点</DetailListLabel>
        <DetailListValue className="font-mono text-label break-all">https://api.deepseek.com</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>Provider 版本</DetailListLabel>
        <DetailListValue className="font-mono text-label">anthropic:v1</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>可用性探查方式</DetailListLabel>
        <DetailListValue>探活端点</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>最近探查</DetailListLabel>
        <DetailListValue>3 分钟前</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>连通性延迟</DetailListLabel>
        <DetailListValue className="max-w-none">
          <Badge color="lime" size="sm" className="px-1.5">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fg-success" />
              11 ms
            </span>
          </Badge>
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>更新时间</DetailListLabel>
        <DetailListValue className="tabular-nums">2026 06-21 12:32:12</DetailListValue>
      </DetailListItem>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-usage-label">
        <DetailListSectionLabel id="resource-usage-label">使用情况</DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>当前已用</DetailListLabel>
          <DetailListValue className="tabular-nums">12.1 M</DetailListValue>
        </DetailListItem>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-api-format-label">
        <DetailListSectionLabel id="resource-api-format-label">API 格式</DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>兼容性</DetailListLabel>
          <DetailListValue className="text-fg-default">标准兼容（推荐）</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Chat</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/chat/completions</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Responses</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/responses</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>Anthropic Messages</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/messages</DetailListValue>
        </DetailListItem>
      </DetailListSection>
    </DetailList>
  );
}`;

function ResourceDetailsDemo() {
  const [enabled, setEnabled] = useState(true);
  const usageLabelId = useId();
  const apiFormatLabelId = useId();

  return (
    <DetailList className="w-full max-w-[400px]">
      <DetailListItem>
        <DetailListLabel>健康状态 (最近1小时)</DetailListLabel>
        <DetailListValue className="max-w-none">
          <div
            className="flex shrink-0 items-center gap-1 py-0.5"
            role="img"
            aria-label="最近一小时 11 次健康检查均成功"
          >
            {Array.from({ length: 11 }, (_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="size-2.5 rounded-full border border-success-border bg-success-surface"
              />
            ))}
          </div>
        </DetailListValue>
      </DetailListItem>

      <DetailListSeparator />

      <DetailListItem>
        <DetailListLabel>开启</DetailListLabel>
        <DetailListValue className="max-w-none">
          <Switch
            label="开启资源供应商"
            checked={enabled}
            onToggle={() => setEnabled((current) => !current)}
            className="p-0 [&>span:last-child]:sr-only"
          />
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>模型供应商</DetailListLabel>
        <DetailListValue>DeepSeek</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>API 端点</DetailListLabel>
        <DetailListValue className="font-mono text-label break-all">
          https://api.deepseek.com
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>Provider 版本</DetailListLabel>
        <DetailListValue className="font-mono text-label">anthropic:v1</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>可用性探查方式</DetailListLabel>
        <DetailListValue>探活端点</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>最近探查</DetailListLabel>
        <DetailListValue>3 分钟前</DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>连通性延迟</DetailListLabel>
        <DetailListValue className="max-w-none">
          <Badge color="lime" size="sm" className="px-1.5">
            <span className="flex items-center gap-1">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-fg-success" />
              11 ms
            </span>
          </Badge>
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>更新时间</DetailListLabel>
        <DetailListValue className="tabular-nums">2026 06-21 12:32:12</DetailListValue>
      </DetailListItem>

      <DetailListSeparator />

      <DetailListSection aria-labelledby={usageLabelId}>
        <DetailListSectionLabel id={usageLabelId}>使用情况</DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>当前已用</DetailListLabel>
          <DetailListValue className="tabular-nums">12.1 M</DetailListValue>
        </DetailListItem>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby={apiFormatLabelId}>
        <DetailListSectionLabel id={apiFormatLabelId}>API 格式</DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>兼容性</DetailListLabel>
          <DetailListValue className="text-fg-default">标准兼容（推荐）</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Chat</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/chat/completions</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Responses</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/responses</DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>Anthropic Messages</DetailListLabel>
          <DetailListValue className="font-mono text-label">/v1/messages</DetailListValue>
        </DetailListItem>
      </DetailListSection>
    </DetailList>
  );
}

export default function DetailListDoc() {
  const t = useTranslations("detailList");

  const rootProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("childrenProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];

  const partProps: PropDef[] = [
    { name: "DetailListItem", type: "div", description: t("itemPart") },
    { name: "DetailListLabel", type: "div", description: t("labelPart") },
    { name: "DetailListValue", type: "div", description: t("valuePart") },
    { name: "DetailListSection", type: "section", description: t("sectionPart") },
    { name: "DetailListSectionLabel", type: "h3", description: t("sectionLabelPart") },
    { name: "DetailListSeparator", type: "div", description: t("separatorPart") },
  ];

  return (
    <DocPage
      title="DetailList"
      slug="detail-list"
      description="A framed, composable label-value list with grouped sections and separators for compact resource and entity details."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "basic",
              label: "Basic",
              code: basicCode,
              preview: <DetailList className="w-full max-w-md"><DetailListItem><DetailListLabel>Provider</DetailListLabel><DetailListValue>DeepSeek</DetailListValue></DetailListItem><DetailListItem><DetailListLabel>Latency</DetailListLabel><DetailListValue><Badge color="lime" size="sm">11 ms</Badge></DetailListValue></DetailListItem></DetailList>,
            },
            {
              value: "grouped",
              label: "Grouped",
              code: groupedCode,
              preview: <DetailList className="w-full max-w-md"><DetailListSection aria-labelledby="playground-usage"><DetailListSectionLabel id="playground-usage">Usage</DetailListSectionLabel><DetailListItem><DetailListLabel>Current</DetailListLabel><DetailListValue>12.1 M</DetailListValue></DetailListItem></DetailListSection><DetailListSeparator /><DetailListSection aria-labelledby="playground-api"><DetailListSectionLabel id="playground-api">API format</DetailListSectionLabel><DetailListItem><DetailListLabel>Endpoint</DetailListLabel><DetailListValue>/v1/chat/completions</DetailListValue></DetailListItem></DetailListSection></DetailList>,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <DetailList className="w-full max-w-md">
            <DetailListItem>
              <DetailListLabel>Provider</DetailListLabel>
              <DetailListValue>DeepSeek</DetailListValue>
            </DetailListItem>
            <DetailListItem>
              <DetailListLabel>Latency</DetailListLabel>
              <DetailListValue>
                <Badge color="lime" size="sm">11 ms</Badge>
              </DetailListValue>
            </DetailListItem>
          </DetailList>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("grouped")}>
        <ComponentPreview code={groupedCode}>
          <DetailList className="w-full max-w-md">
            <DetailListSection aria-labelledby="detail-list-usage-label">
              <DetailListSectionLabel id="detail-list-usage-label">Usage</DetailListSectionLabel>
              <DetailListItem>
                <DetailListLabel>Current</DetailListLabel>
                <DetailListValue>12.1 M</DetailListValue>
              </DetailListItem>
            </DetailListSection>
            <DetailListSeparator />
            <DetailListSection aria-labelledby="detail-list-api-label">
              <DetailListSectionLabel id="detail-list-api-label">API format</DetailListSectionLabel>
              <DetailListItem>
                <DetailListLabel>OpenAI Chat</DetailListLabel>
                <DetailListValue className="font-mono text-label">/v1/chat/completions</DetailListValue>
              </DetailListItem>
            </DetailListSection>
          </DetailList>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("resourceDetails")}>
        <ComponentPreview code={resourceDetailsCode} minHeightClass="min-h-[600px]">
          <ResourceDetailsDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <PropsTable props={rootProps} />
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">{t("parts")}</h3>
            <PropsTable props={partProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
