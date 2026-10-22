"use client";

import { ArtifactContentRenderer } from "../artifact-content-renderer";
import type { ArtifactDocument, ArtifactRevision } from "./types";

export function ArtifactContent({ artifact, revision, previous, view }: {
  artifact: ArtifactDocument; revision: ArtifactRevision; previous?: ArtifactRevision;
  view: "code" | "preview" | "changes";
}) {
  if (view === "preview" && artifact.kind === "markdown") {
    return <ArtifactContentRenderer mode="markdown" text={revision.content} />;
  }
  const file = { name: artifact.filename, contents: revision.content };
  if (view === "changes" && previous) {
    return <ArtifactContentRenderer mode="diff" oldFile={{ name: artifact.filename, contents: previous.content }} newFile={file} diffStyle="unified" />;
  }
  return <ArtifactContentRenderer mode="code" file={file} toolbar={false} />;
}
