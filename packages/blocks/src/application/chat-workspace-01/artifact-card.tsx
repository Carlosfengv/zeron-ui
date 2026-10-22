"use client";

import { ArtifactCard as SharedArtifactCard } from "@zeron/ui/artifact-card";
import { resolveArtifactLabels } from "@zeron/ui/artifact-panel/labels";
import { artifactReviewStatus, artifactSizeText, safeArtifactUrl } from "@zeron/ui/artifact-panel/utils";
import type { ArtifactCardProps } from "./chat-workspace-types";

/** Compatibility adapter for full workspace resources and their review rules. */
export function ArtifactCard({ labels: overrides, locale, ...props }: ArtifactCardProps) {
  const labels = resolveArtifactLabels(locale, overrides);
  return <SharedArtifactCard {...props} labels={labels} locale={locale} getReviewStatus={artifactReviewStatus}
    getDescription={(resource) => resource.kind === "url"
      ? safeArtifactUrl(resource.url, true) ?? labels.unavailableUrl
      : artifactSizeText(resource, locale)} />;
}
