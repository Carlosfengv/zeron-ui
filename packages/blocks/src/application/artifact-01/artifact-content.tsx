"use client";

import { CodeBlock, CodeDiff } from "@zeron/ui/code-block";
import { Markdown } from "@zeron/ui/markdown";
import type { ArtifactDocument, ArtifactRevision } from "./artifact-types";

export function ArtifactContent({ artifact, revision, previous, view }: {
  artifact: ArtifactDocument; revision: ArtifactRevision; previous?: ArtifactRevision;
  view: "code" | "preview" | "changes";
}) {
  if (view === "preview" && artifact.kind === "markdown") {
    return <div className="mx-auto w-full max-w-3xl p-6"><Markdown text={revision.content} /></div>;
  }
  if (view === "changes" && previous) {
    return <div className="min-w-0 p-3"><CodeDiff oldFile={{ name: artifact.filename, contents: previous.content }} newFile={{ name: artifact.filename, contents: revision.content }} options={{ diffStyle: "unified" }} /></div>;
  }
  return <div className="min-w-0 p-3"><CodeBlock file={{ name: artifact.filename, contents: revision.content }} toolbar={false} /></div>;
}
