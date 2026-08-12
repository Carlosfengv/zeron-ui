"use client";

import {
  InfoItem,
  InfoItemContent,
  InfoItemDescription,
  InfoItemGroup,
  InfoItemLeading,
  InfoItemTitle,
  InfoItemTrailing,
  InfoItemValue,
} from "@/components/ui/info-item";
import { Badge } from "@/components/ui/badge";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { useIcon } from "@/lib/icon-context";
import { useTranslations } from "next-intl";

const basicCode = `import {
  InfoItem, InfoItemContent, InfoItemDescription,
  InfoItemGroup, InfoItemLeading, InfoItemTitle,
  InfoItemTrailing, InfoItemValue,
} from "./components";

<InfoItemGroup>
  <InfoItem>
    <InfoItemLeading><FileArchive /></InfoItemLeading>
    <InfoItemContent>
      <InfoItemTitle>Storage</InfoItemTitle>
      <InfoItemDescription>72 GB of 100 GB used</InfoItemDescription>
    </InfoItemContent>
    <InfoItemTrailing>
      <InfoItemValue>72%</InfoItemValue>
    </InfoItemTrailing>
  </InfoItem>
</InfoItemGroup>`;

const quotaCode = `<InfoItem>
  <InfoItemLeading><Globe /></InfoItemLeading>
  <InfoItemContent>
    <InfoItemTitle>Bandwidth</InfoItemTitle>
    <InfoItemDescription>Resets in 12 days</InfoItemDescription>
  </InfoItemContent>
  <InfoItemTrailing className="w-28 flex-col items-end gap-1.5">
    <InfoItemValue>384 / 500 GB</InfoItemValue>
    <div role="progressbar" aria-valuenow={77}
      className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full w-[77%] rounded-full bg-brand" />
    </div>
  </InfoItemTrailing>
</InfoItem>`;

const inlineCode = `<InfoItem layout="inline">
  <InfoItemLeading><Rocket /></InfoItemLeading>
  <InfoItemContent>
    <InfoItemTitle>Plan</InfoItemTitle>
    <InfoItemDescription>Pro workspace</InfoItemDescription>
  </InfoItemContent>
  <InfoItemTrailing>
    <Badge variant="dot" color="green">Active</Badge>
  </InfoItemTrailing>
</InfoItem>`;

export default function InfoItemDoc() {
  const t = useTranslations("infoItem");
  const FileArchive = useIcon("file-archive");
  const Globe = useIcon("globe");
  const Rocket = useIcon("rocket");
  const Users = useIcon("users");

  const rootProps: PropDef[] = [
    {
      name: "layout",
      type: '"stacked" | "inline"',
      default: '"stacked"',
      description: t("layoutProp"),
    },
    { name: "children", type: "ReactNode", description: t("childrenProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];

  const partProps: PropDef[] = [
    { name: "InfoItemGroup", type: "div", description: t("groupPart") },
    { name: "InfoItemLeading", type: "div", description: t("leadingPart") },
    { name: "InfoItemContent", type: "div", description: t("contentPart") },
    { name: "InfoItemTitle", type: "div", description: t("titlePart") },
    { name: "InfoItemDescription", type: "div", description: t("descriptionPart") },
    { name: "InfoItemTrailing", type: "div", description: t("trailingPart") },
    { name: "InfoItemValue", type: "span", description: t("valuePart") },
  ];

  return (
    <DocPage
      title="InfoItem"
      slug="info-item"
      description="A composable information row with leading media, primary and supporting text, and a flexible trailing value or detail."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <InfoItemGroup className="w-full max-w-md">
            <InfoItem>
              <InfoItemLeading>
                <FileArchive size={16} strokeWidth={1.5} />
              </InfoItemLeading>
              <InfoItemContent>
                <InfoItemTitle>Storage</InfoItemTitle>
                <InfoItemDescription>72 GB of 100 GB used</InfoItemDescription>
              </InfoItemContent>
              <InfoItemTrailing>
                <InfoItemValue>72%</InfoItemValue>
              </InfoItemTrailing>
            </InfoItem>
            <InfoItem>
              <InfoItemLeading>
                <Users size={16} strokeWidth={1.5} />
              </InfoItemLeading>
              <InfoItemContent>
                <InfoItemTitle>Team seats</InfoItemTitle>
                <InfoItemDescription>3 seats are still available</InfoItemDescription>
              </InfoItemContent>
              <InfoItemTrailing>
                <InfoItemValue>7 / 10</InfoItemValue>
              </InfoItemTrailing>
            </InfoItem>
          </InfoItemGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("quota")}>
        <ComponentPreview code={quotaCode}>
          <InfoItemGroup className="w-full max-w-md">
            <InfoItem>
              <InfoItemLeading>
                <Globe size={16} strokeWidth={1.5} />
              </InfoItemLeading>
              <InfoItemContent>
                <InfoItemTitle>Bandwidth</InfoItemTitle>
                <InfoItemDescription>Resets in 12 days</InfoItemDescription>
              </InfoItemContent>
              <InfoItemTrailing className="w-28 flex-col items-end gap-1.5">
                <InfoItemValue>384 / 500 GB</InfoItemValue>
                <div
                  role="progressbar"
                  aria-label="Bandwidth used"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={77}
                  className="h-1 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full w-[77%] rounded-full bg-brand" />
                </div>
              </InfoItemTrailing>
            </InfoItem>
          </InfoItemGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("inlineLayout")}>
        <ComponentPreview code={inlineCode}>
          <InfoItemGroup className="w-full max-w-md">
            <InfoItem layout="inline">
              <InfoItemLeading>
                <Rocket size={16} strokeWidth={1.5} />
              </InfoItemLeading>
              <InfoItemContent>
                <InfoItemTitle>Plan</InfoItemTitle>
                <InfoItemDescription>Pro workspace</InfoItemDescription>
              </InfoItemContent>
              <InfoItemTrailing>
                <Badge variant="dot" color="green">Active</Badge>
              </InfoItemTrailing>
            </InfoItem>
          </InfoItemGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">InfoItem</h3>
            <PropsTable props={rootProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">{t("parts")}</h3>
            <PropsTable props={partProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
