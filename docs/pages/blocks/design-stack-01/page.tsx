import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { DesignStackBlockDocClient } from "./DesignStackBlockDocClient";

export default function DesignStackBlockDoc() {
  return <DesignStackBlockDocClient code={getBlockPreviewSource("design-stack-01")} />;
}
