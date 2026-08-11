"use client";

import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
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
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <ThinkingIndicator />
        </ComponentPreview>
      </DocSection>
    </DocPage>
  );
}
