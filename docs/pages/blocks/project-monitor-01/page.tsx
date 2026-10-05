import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { ProjectMonitorBlockDocClient } from "./ProjectMonitorBlockDocClient";

export default function ProjectMonitorBlockDoc() {
  return <ProjectMonitorBlockDocClient code={getBlockPreviewSource("project-monitor-01")} />;
}
