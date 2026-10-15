import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { AccountActivityBlockDocClient } from "./AccountActivityBlockDocClient";

export default function AccountActivityBlockDoc() {
  return <AccountActivityBlockDocClient code={getBlockPreviewSource("account-activity-01")} />;
}
