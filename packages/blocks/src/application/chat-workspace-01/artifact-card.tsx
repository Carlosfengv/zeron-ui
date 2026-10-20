"use client";

import { FileType } from "@zeron/ui/file-type";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { resolveArtifactLabels } from "./artifact-labels";
import { artifactReviewStatus, artifactSizeText, safeArtifactUrl } from "./artifact-utils";
import type { ArtifactCardProps } from "./chat-workspace-types";

export function ArtifactCard({ resources, title, onOpen, labels: overrides, locale, className, ...props }: ArtifactCardProps) {
  const labels = resolveArtifactLabels(locale, overrides);
  const Globe = useIcon("globe");
  const Arrow = useIcon("arrow-right");
  return (
    <div {...props} data-slot="artifact-card" className={cn("min-w-0 overflow-hidden rounded-lg border-hairline border-border bg-surface-floating", className)}>
      <div className="border-b-hairline border-border px-3 py-2 text-label font-medium">{title ?? labels.resources}</div>
      <ul className="flex min-w-0 flex-col gap-1 p-2">
        {resources.map((resource) => {
          const review = artifactReviewStatus(resource);
          const description = resource.kind === "url" ? safeArtifactUrl(resource.url, true) ?? labels.unavailableUrl : artifactSizeText(resource, locale);
          return <li key={resource.id} className="min-w-0">
            <InfoItem render={<button type="button" />} onClick={() => onOpen(resource)} aria-label={`${labels.preview}: ${resource.name}`}>
              <span className="flex size-8 shrink-0 items-center justify-center">{resource.kind === "url" ? <Globe size={20} aria-hidden /> : <FileType fileName={resource.name} size="sm" aria-hidden />}</span>
              <InfoItemContent>
                <InfoItemTitle className="truncate" title={resource.name}>{resource.name}</InfoItemTitle>
                {description && <InfoItemDescription className="truncate" title={description}>{description}</InfoItemDescription>}
              </InfoItemContent>
              <InfoItemTrailing>{review && <span className="text-label text-fg-muted">{labels[review]}</span>}<Arrow size={14} aria-hidden /></InfoItemTrailing>
            </InfoItem>
          </li>;
        })}
      </ul>
    </div>
  );
}
