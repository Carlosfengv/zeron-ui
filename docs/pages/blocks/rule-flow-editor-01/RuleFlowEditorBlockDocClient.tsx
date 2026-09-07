"use client";

import {
  RuleFlowEditor,
  defaultRuleFlow,
  type RuleFlowValue,
} from "@zeron/blocks/rule-flow-editor-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function RuleFlowEditorBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("ruleFlowEditorBlock");
  const [flow, setFlow] = useState<RuleFlowValue>(defaultRuleFlow);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="rule-flow-editor-01"
      title={t("title")}
      preview={
        <div className="h-full min-h-0 overflow-hidden bg-surface-raised p-3 sm:p-6">
          <RuleFlowEditor
            onValueChange={setFlow}
            value={flow}
          />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
