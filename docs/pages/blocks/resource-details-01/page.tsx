"use client";

import { ResourceDetails } from "@zeron/blocks/resource-details-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

const code = `"use client";

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
import { cn } from "@zeron/ui/system/utils";

export interface ResourceDetailsProps {
  className?: string;
  defaultEnabled?: boolean;
}

function HealthHistory() {
  return (
    <div
      className="flex shrink-0 items-center gap-1 py-0.5"
      role="img"
      aria-label="11 successful health checks in the last hour"
    >
      {Array.from({ length: 11 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="size-2.5 rounded-full border border-success-border bg-success-surface"
        />
      ))}
    </div>
  );
}

export function ResourceDetails({
  className,
  defaultEnabled = true,
}: ResourceDetailsProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <DetailList className={cn("w-full max-w-[400px]", className)}>
      <DetailListItem>
        <DetailListLabel>健康状态 (最近1小时)</DetailListLabel>
        <DetailListValue className="max-w-none">
          <HealthHistory />
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
        <DetailListValue className="font-mono text-label">
          anthropic:v1
        </DetailListValue>
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
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-fg-success"
              />
              11 ms
            </span>
          </Badge>
        </DetailListValue>
      </DetailListItem>
      <DetailListItem>
        <DetailListLabel>更新时间</DetailListLabel>
        <DetailListValue className="tabular-nums">
          2026 06-21 12:32:12
        </DetailListValue>
      </DetailListItem>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-usage-label">
        <DetailListSectionLabel id="resource-usage-label">
          使用情况
        </DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>当前已用</DetailListLabel>
          <DetailListValue className="tabular-nums">12.1 M</DetailListValue>
        </DetailListItem>
      </DetailListSection>

      <DetailListSeparator />

      <DetailListSection aria-labelledby="resource-api-format-label">
        <DetailListSectionLabel id="resource-api-format-label">
          API 格式
        </DetailListSectionLabel>
        <DetailListItem>
          <DetailListLabel>兼容性</DetailListLabel>
          <DetailListValue className="text-fg-default">
            标准兼容（推荐）
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Chat</DetailListLabel>
          <DetailListValue className="font-mono text-label">
            /v1/chat/completions
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>OpenAI Responses</DetailListLabel>
          <DetailListValue className="font-mono text-label">
            /v1/responses
          </DetailListValue>
        </DetailListItem>
        <DetailListItem>
          <DetailListLabel>Anthropic Messages</DetailListLabel>
          <DetailListValue className="font-mono text-label">
            /v1/messages
          </DetailListValue>
        </DetailListItem>
      </DetailListSection>
    </DetailList>
  );
}`;

export default function ResourceDetailsBlockDoc() {
  const t = useTranslations("resourceDetailsBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="resource-details-01"
      title={t("title")}
      preview={
        <div className="flex min-h-full items-start justify-center bg-surface-base p-4 sm:p-8">
          <ResourceDetails />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
