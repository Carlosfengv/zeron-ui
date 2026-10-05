"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { DeploymentDetail, deploymentDetailDemoData, deploymentDetailDemoNow, type DeploymentStage } from "@zeron/blocks/deployment-detail-01";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";

const englishLabels = {
  title: "Deployment", share: "Share", sharing: "Sharing…", copied: "Link copied", copyError: "Could not copy. Try again.",
  visit: "Visit", environment: "Environment", status: "Status", created: "Created", duration: "Duration", completed: "Completed",
  domains: "Domains", moreDomains: "More domains", source: "Source", stages: "Deployment status", ready: "Ready", building: "Building",
  queued: "Queued", error: "Failed", cancelled: "Cancelled", unknown: "Unknown", success: "Complete", running: "Running", pending: "Pending", warning: "Warning",
  noPreview: "No website preview", noDomains: "No domains assigned", noSource: "No source available", noStages: "No deployment stages",
  errors: "errors", warnings: "warnings", checksPassed: "All checks passed", checksUnknown: "Checks awaiting update", investigate: "Investigate",
  logs: "View build logs", more: "More actions", copyCommit: "Copy commit hash", retry: "Retry", loading: "Loading deployment", unavailable: "Could not load deployment",
  stale: "Showing the last snapshot while awaiting an update", actionError: "Could not complete the action. Try again.",
};
export function DeploymentDetailDemo() {
  const locale = useLocale();
  const en = locale === "en";
  const [stage, setStage] = useState<DeploymentStage | null>(null);
  const data = { ...deploymentDetailDemoData,
    url: `/${locale}/block-demo/deployment-detail-01`, shareUrl: `/${locale}/block-demo/deployment-detail-01`,
    domains: deploymentDetailDemoData.domains.map((domain) => ({ ...domain, url: domain.url ? `/${locale}/block-demo/deployment-detail-01` : undefined })),
    stages: deploymentDetailDemoData.stages.map((stage, index) => en ? { ...stage, label: ["Build logs", "Deployment summary", "Running checks", "Assigning domains"][index], actionLabel: stage.actionLabel ? index === 0 ? "Run summary" : "View details" : undefined } : stage),
  };
  const labels = en ? englishLabels : undefined;
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8"><div className="m-auto w-full max-w-3xl space-y-3">
    <DeploymentDetail data={data} now={deploymentDetailDemoNow} locale={en ? "en-US" : "zh-CN"} labels={labels}
      actions={{ onOpenStage: setStage }} />
    <p className="text-center text-label text-fg-subtle">{en ? "Interactive demo · Example data, no live deployment connected" : "交互演示 · 示例数据，未连接真实部署"}</p>
    <Dialog open={stage !== null} onOpenChange={(open) => { if (!open) setStage(null); }}><DialogContent size="lg" className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{stage?.label}</DialogTitle><DialogDescription>{en ? "Example data for this deployment" : "本次部署的示例数据"}</DialogDescription></DialogHeader>
      <div className="space-y-2">{data.domains.map((domain) => <p key={domain.id} className="break-all font-mono text-label text-fg-default">{domain.name}</p>)}</div>
    </DialogContent></Dialog>
  </div></div>;
}
