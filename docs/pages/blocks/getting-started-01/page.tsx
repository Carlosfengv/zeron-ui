import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { GettingStartedBlockDocClient } from "./GettingStartedBlockDocClient";

export default function GettingStartedBlockDoc() {
  return <GettingStartedBlockDocClient code={getBlockPreviewSource("getting-started-01")} />;
}
