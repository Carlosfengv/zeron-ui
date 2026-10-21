"use client";

import { ArtifactContentRenderer } from "../artifact-content-renderer";
import type { ArtifactResource, ArtifactView } from "./types";

export function ArtifactCodePreview({ resource, view, split }: { resource: ArtifactResource; view: ArtifactView; split: boolean }) {
  if (!("content" in resource)) return null;
  if (view === "preview" && resource.kind === "markdown") {
    return <ArtifactContentRenderer mode="markdown" text={resource.content} />;
  }
  const file = { name: resource.path ?? resource.name, contents: resource.content };
  if (view === "diff" && "previousContent" in resource && resource.previousContent !== undefined) {
    return <ArtifactContentRenderer mode="diff"
      oldFile={{ name: resource.kind === "code" ? resource.previousPath ?? file.name : file.name, contents: resource.previousContent }}
      newFile={file} diffStyle={split ? "split" : "unified"} />;
  }
  return <ArtifactContentRenderer mode="code" file={file} />;
}
