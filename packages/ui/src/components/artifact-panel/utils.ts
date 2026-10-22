import type { ArtifactResource, ArtifactView } from "./types";

export function artifactVersionKey(resource: ArtifactResource) {
  return JSON.stringify([resource.id, resource.version]);
}

export function artifactViews(resource: ArtifactResource): ArtifactView[] {
  if (resource.kind === "code") return resource.previousContent !== undefined ? ["diff", "source"] : ["source"];
  if (resource.kind === "markdown") return resource.previousContent !== undefined ? ["preview", "source", "diff"] : ["preview", "source"];
  return resource.kind === "text" ? ["source"] : ["preview"];
}

export function artifactIsReviewable(resource: ArtifactResource) {
  return (resource.kind === "code" || resource.kind === "markdown") && resource.previousContent !== undefined && resource.review !== undefined;
}

export function artifactReviewStatus(resource: ArtifactResource) {
  return artifactIsReviewable(resource) && "review" in resource ? resource.review : undefined;
}

/** Ready revisions awaiting a decision, preserving the host's resource order. */
export function getPendingReviewResources(resources: readonly ArtifactResource[]) {
  return resources.filter((resource) => artifactReviewStatus(resource) === "pending" && (!resource.status || resource.status === "ready"));
}

/** Web frames only receive HTTP(S). File/image URLs may also be local blob URLs. */
export function safeArtifactUrl(url?: string, web = false): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url, "https://preview.invalid");
    return (web ? ["http:", "https:"] : ["http:", "https:", "blob:"]).includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

export function artifactText(resource: ArtifactResource) {
  return "content" in resource ? resource.content : "url" in resource ? safeArtifactUrl(resource.url, resource.kind === "url") : undefined;
}

export function artifactSizeText(resource: ArtifactResource, locale = "en") {
  const bytes = resource.size !== undefined && Number.isFinite(resource.size) && resource.size >= 0
    ? resource.size : "content" in resource ? new TextEncoder().encode(resource.content).byteLength : undefined;
  if (bytes === undefined) return undefined;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = bytes > 0 ? Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)) : 0;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: unit ? 1 : 0 }).format(bytes / 1024 ** unit)} ${units[unit]}`;
}

export function downloadArtifact(resource: ArtifactResource) {
  const remote = safeArtifactUrl(resource.downloadUrl) ?? ("url" in resource ? safeArtifactUrl(resource.url, resource.kind === "url") : undefined);
  const blob = !remote && "content" in resource ? URL.createObjectURL(new Blob([resource.content], { type: "text/plain;charset=utf-8" })) : undefined;
  const url = remote ?? blob;
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = resource.name;
  link.rel = "noopener noreferrer";
  link.target = "_blank";
  link.click();
  if (blob) setTimeout(() => URL.revokeObjectURL(blob), 1000);
}
