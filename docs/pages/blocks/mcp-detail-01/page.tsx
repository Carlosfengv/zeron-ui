import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { McpDetailBlockDocClient } from "./McpDetailBlockDocClient";

export default function McpDetailBlockDoc() {
  return <McpDetailBlockDocClient code={getBlockPreviewSource("mcp-detail-01")} />;
}
