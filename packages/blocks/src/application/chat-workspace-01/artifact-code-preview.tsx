"use client";

import { CodeBlock, CodeDiff } from "@zeron/ui/code-block";
import { Markdown } from "@zeron/ui/markdown";
import type { ArtifactResource, ArtifactView } from "./chat-workspace-types";

export function ArtifactCodePreview({ resource, view, split }: { resource: ArtifactResource; view: ArtifactView; split: boolean }) {
  if (!("content" in resource)) return null;
  if (view === "preview" && resource.kind === "markdown") return <div className="mx-auto w-full max-w-3xl p-6"><Markdown text={resource.content} /></div>;
  if (view === "diff" && "previousContent" in resource && resource.previousContent !== undefined) {
    return <div className="min-w-0 p-3"><CodeDiff oldFile={{ name: resource.kind === "code" ? resource.previousPath ?? resource.path ?? resource.name : resource.path ?? resource.name, contents: resource.previousContent }}
      newFile={{ name: resource.path ?? resource.name, contents: resource.content }} options={{ diffStyle: split ? "split" : "unified" }} /></div>;
  }
  return <div className="min-w-0 p-3"><CodeBlock file={{ name: resource.path ?? resource.name, contents: resource.content }} /></div>;
}
