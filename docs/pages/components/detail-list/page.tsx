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
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

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
