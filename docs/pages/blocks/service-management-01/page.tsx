import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ServiceManagementBlockDocClient } from "./ServiceManagementBlockDocClient";

export default function ServiceManagementBlockDoc() {
  return <ServiceManagementBlockDocClient code={getBlockPreviewSource("service-management-01")} />;
}
