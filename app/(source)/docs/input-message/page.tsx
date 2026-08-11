import { DocPage } from "@/docs/DocPage";
import { InputMessageExamples } from "./input-message-examples";

export default function InputMessageDoc() {
  return (
    <DocPage
      title="InputMessage"
      slug="input-message"
      description="Chat-style message composer with an auto-resizing textarea, flexible left/right action slots, and a built-in send button on a Surface-2 substrate."
    >
      <InputMessageExamples />
    </DocPage>
  );
}
