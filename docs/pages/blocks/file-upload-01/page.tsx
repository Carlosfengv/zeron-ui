import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { FileUploadBlockDocClient } from "./FileUploadBlockDocClient";

export default function FileUploadBlockDoc() {
  return <FileUploadBlockDocClient code={getBlockPreviewSource("file-upload-01")} />;
}
