"use client";

import { ThinkingIndicator } from "@zeron/ui/thinking-indicator";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

export default function ThinkingIndicatorDoc() {
  const t = useTranslations("thinkingIndicator");
  return (
    <DocPage
      title="ThinkingIndicator"
      slug="thinking-indicator"
      description="Animated status indicator with morphing SVG and cycling text."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "with-icon",
              label: "With icon",
              code: basicCode,
              preview: <ThinkingIndicator />,
            },
            {
              value: "text-only",
              label: "Text only",
              code: `<ThinkingIndicator showIcon={false} />`,
              preview: <ThinkingIndicator showIcon={false} />,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <ThinkingIndicator />
        </ComponentPreview>
      </DocSection>
    </DocPage>
  );
}
