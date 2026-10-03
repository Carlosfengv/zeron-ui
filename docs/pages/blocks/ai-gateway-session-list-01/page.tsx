import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AiGatewaySessionListBlockDocClient } from "./AiGatewaySessionListBlockDocClient";

export default function AiGatewaySessionListBlockDoc() {
  return <AiGatewaySessionListBlockDocClient code={getBlockPreviewSource("ai-gateway-session-list-01")} />;
}
