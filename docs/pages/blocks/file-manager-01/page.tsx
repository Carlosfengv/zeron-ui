import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { FileManagerBlockDocClient } from "./FileManagerBlockDocClient";

export default function FileManagerBlockDoc() {
  return <FileManagerBlockDocClient code={getBlockPreviewSource("file-manager-01")} />;
}
