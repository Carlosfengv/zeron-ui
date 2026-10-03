import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ZlrListBlockDocClient } from "./ZlrListBlockDocClient";

export default function ZlrListBlockDoc() {
  return <ZlrListBlockDocClient code={getBlockPreviewSource("zlrlist")} />;
}
