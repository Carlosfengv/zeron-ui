"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { RuleFlowEditorDemo as RuleFlowEditor } from "@docs/components/blocks/RuleFlowEditorDemo";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function RuleFlowEditorBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("ruleFlowEditorBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="rule-flow-editor-01"
      title={t("title")}
      preview={
        <div className="h-full min-h-0 overflow-hidden bg-surface-raised p-3 sm:p-6">
          <RuleFlowEditor />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
