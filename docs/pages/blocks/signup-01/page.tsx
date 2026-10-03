import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { Signup01BlockDocClient } from "./Signup01BlockDocClient";

export default function Signup01BlockDoc() {
  return <Signup01BlockDocClient code={getBlockPreviewSource("signup-01")} />;
}
