import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";

const basicCode = `import { ThinkingIndicator } from "./components";

<ThinkingIndicator />`;

export default function ThinkingIndicatorDoc() {
  return (
    <DocPage
      title="ThinkingIndicator"
      slug="thinking-indicator"
      description="Animated status indicator with morphing SVG and cycling text."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          <ThinkingIndicator />
        </ComponentPreview>
      </DocSection>
    </DocPage>
  );
}
