"use client";

import {
  InlineNotice,
  InlineNoticeAction,
  InlineNoticeContent,
  type InlineNoticeTone,
} from "@zeron/ui/inline-notice";
import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { useTranslations } from "next-intl";

const basicCode = `import { Badge } from "./components/badge";
import {
  InlineNotice, InlineNoticeContent,
} from "./components/inline-notice";

<InlineNotice>
  <Badge size="sm" color="blue">Beta</Badge>
  <InlineNoticeContent>
    This feature is available in the new editor.
  </InlineNoticeContent>
</InlineNotice>`;

const badgeCompositionCode = `<InlineNotice>
  <Badge size="sm" color="violet">Pro</Badge>
  <InlineNoticeContent>Available on paid plans.</InlineNoticeContent>
</InlineNotice>

<InlineNotice>
  <Badge size="sm" status="warning">Expiring</Badge>
  <InlineNoticeContent>Credentials expire in 3 days.</InlineNoticeContent>
</InlineNotice>`;

const emphasizedCode = `<InlineNotice variant="emphasized" tone="neutral">
  <Badge size="sm" variant="strong" color="gray">Neutral</Badge>
  ...
</InlineNotice>
<InlineNotice variant="emphasized" tone="info">
  <Badge size="sm" variant="strong" color="blue">Info</Badge>
  ...
</InlineNotice>
<InlineNotice variant="emphasized" tone="success">
  <Badge size="sm" variant="strong" color="green">Success</Badge>
  ...
</InlineNotice>
<InlineNotice variant="emphasized" tone="warning">
  <Badge size="sm" variant="strong" color="amber">Warning</Badge>
  ...
</InlineNotice>
<InlineNotice variant="emphasized" tone="danger">
  <Badge size="sm" variant="strong" color="red">Danger</Badge>
  ...
</InlineNotice>`;

const compositionCode = `<InlineNotice variant="emphasized" tone="danger">
  <Badge size="sm" variant="strong" color="red">Failed</Badge>
  <InlineNoticeContent>
    Payment could not be completed for <code>INV-2048</code>.
  </InlineNoticeContent>
  <InlineNoticeAction>
    <button type="button">Review</button>
  </InlineNoticeAction>
</InlineNotice>`;

const inlineCode = `<p>
  Deployment is ready. {" "}
  <InlineNotice>
    <Badge size="sm" color="violet">Preview</Badge>
    <InlineNoticeContent>Only team members can open this URL.</InlineNoticeContent>
  </InlineNotice>{" "}
  Share it after access is configured.
</p>`;

const emphasizedBadgeColors = {
  neutral: "gray",
  info: "blue",
  success: "green",
  warning: "amber",
  danger: "red",
} satisfies Record<InlineNoticeTone, BadgeColor>;

export default function InlineNoticeDoc() {
  const t = useTranslations("inlineNotice");
  const toneExamples: Array<{
    tone: InlineNoticeTone;
    badge: string;
    message: string;
  }> = [
    { tone: "neutral", badge: t("neutralBadge"), message: t("neutralMessage") },
    { tone: "info", badge: t("infoBadge"), message: t("infoMessage") },
    { tone: "success", badge: t("successBadge"), message: t("successMessage") },
    { tone: "warning", badge: t("warningBadge"), message: t("warningMessage") },
    { tone: "danger", badge: t("dangerBadge"), message: t("dangerMessage") },
  ];

  const emphasizedNotice = (
    tone: InlineNoticeTone,
    badge: string,
    message: string
  ) => (
    <InlineNotice variant="emphasized" tone={tone}>
      <Badge size="sm" variant="strong" color={emphasizedBadgeColors[tone]}>
        {badge}
      </Badge>
      <InlineNoticeContent>{message}</InlineNoticeContent>
    </InlineNotice>
  );

  const rootProps: PropDef[] = [
    {
      name: "variant",
      type: '"subtle" | "emphasized"',
      default: '"subtle"',
      description: t("variantProp"),
    },
    {
      name: "tone",
      type: '"neutral" | "info" | "success" | "warning" | "danger"',
      description: t("toneProp"),
    },
    { name: "role", type: '"status" | "alert" | ...', description: t("roleProp") },
    { name: "children", type: "ReactNode", description: t("childrenProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];

  const partProps: PropDef[] = [
    { name: "InlineNoticeContent", type: "span", description: t("contentPart") },
    { name: "InlineNoticeAction", type: "span", description: t("actionPart") },
  ];

  return (
    <DocPage
      title="InlineNotice"
      slug="inline-notice"
      description="A quiet inline emphasis container that composes with Badge, with an optional semantic emphasized variant."
    >
      <DocSection title={t("playground")}>
        <VariantPlayground
          variants={[
            {
              value: "subtle",
              label: t("subtle"),
              code: basicCode,
              preview: (
                <InlineNotice>
                  <Badge size="sm" color="blue">{t("basicBadge")}</Badge>
                  <InlineNoticeContent>{t("basicMessage")}</InlineNoticeContent>
                </InlineNotice>
              ),
            },
            ...toneExamples.map(({ tone, badge, message }) => ({
              value: `emphasized-${tone}`,
              label: `${t("emphasized")} · ${tone}`,
              code: `<InlineNotice variant="emphasized" tone="${tone}">\n  <Badge size="sm" variant="strong" color="${emphasizedBadgeColors[tone]}">${badge}</Badge>\n  <InlineNoticeContent>${message}</InlineNoticeContent>\n</InlineNotice>`,
              preview: emphasizedNotice(tone, badge, message),
            })),
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <InlineNotice>
            <Badge size="sm" color="blue">{t("basicBadge")}</Badge>
            <InlineNoticeContent>{t("basicMessage")}</InlineNoticeContent>
          </InlineNotice>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("badgeComposition")}>
        <ComponentPreview code={badgeCompositionCode}>
          <div className="flex w-full max-w-xl flex-col items-start gap-3">
            <InlineNotice>
              <Badge size="sm" color="violet">{t("categoryBadge")}</Badge>
              <InlineNoticeContent>{t("categoryMessage")}</InlineNoticeContent>
            </InlineNotice>
            <InlineNotice>
              <Badge size="sm" status="warning">{t("statusBadge")}</Badge>
              <InlineNoticeContent>{t("statusMessage")}</InlineNoticeContent>
            </InlineNotice>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("emphasizedVariants")}>
        <ComponentPreview code={emphasizedCode}>
          <div className="flex w-full max-w-xl flex-col items-start gap-3">
            {toneExamples.map(({ tone, badge, message }) => (
              <span key={tone}>{emphasizedNotice(tone, badge, message)}</span>
            ))}
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("composition")}>
        <ComponentPreview code={compositionCode}>
          <InlineNotice variant="emphasized" tone="danger">
            <Badge size="sm" variant="strong" color="red">
              {t("compositionBadge")}
            </Badge>
            <InlineNoticeContent>
              {t("compositionPrefix")} <code className="font-mono">INV-2048</code>.
            </InlineNoticeContent>
            <InlineNoticeAction>
              <button type="button">{t("compositionAction")}</button>
            </InlineNoticeAction>
          </InlineNotice>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("inlineContext")}>
        <ComponentPreview code={inlineCode}>
          <p className="max-w-xl text-body leading-7 text-fg-default">
            {t("inlineBefore")}{" "}
            <InlineNotice>
              <Badge size="sm" color="violet">{t("inlineBadge")}</Badge>
              <InlineNoticeContent>{t("inlineMessage")}</InlineNoticeContent>
            </InlineNotice>{" "}
            {t("inlineAfter")}
          </p>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("usageGuidance")}>
        <div className="flex max-w-2xl flex-col gap-3 text-body leading-6 text-fg-muted">
          <p>{t("usageBody")}</p>
          <p>{t("emphasizedBody")}</p>
          <p>{t("alertBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <div className="flex max-w-2xl flex-col gap-3 text-body leading-6 text-fg-muted">
          <p>{t("accessibilityBody")}</p>
          <p>{t("liveRegionBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-medium text-fg-default">InlineNotice</h3>
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
