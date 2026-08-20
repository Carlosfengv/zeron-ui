import { DocPage } from "@docs/components/content/DocPage";
import { InputMessageExamples } from "./input-message-examples";

export default function InputMessageDoc() {
  return (
    <DocPage
      title="InputMessage"
      slug="input-message"
      description="Agent-style message composer with a floating editor, flexible action slots, contextual footer controls, and an optional AI-output disclaimer."
    >
      <InputMessageExamples />
    </DocPage>
  );
}
