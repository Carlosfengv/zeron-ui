import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { FallbackChainBlockDocClient } from "./FallbackChainBlockDocClient";

export default function FallbackChainBlockDoc() {
  return <FallbackChainBlockDocClient code={getBlockPreviewSource("fallback-chain-01")} />;
}
