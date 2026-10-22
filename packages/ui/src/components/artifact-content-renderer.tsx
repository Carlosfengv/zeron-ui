"use client";

import { CodeBlock, CodeDiff, type CodeFile } from "#components/code-block";
import { Markdown } from "#components/markdown";

// Internal rendering only: each panel resolves its own resource/revision and view.
type ArtifactContentRendererProps =
  | { mode: "markdown"; text: string }
  | { mode: "code"; file: CodeFile; toolbar?: boolean }
  | { mode: "diff"; oldFile: CodeFile; newFile: CodeFile; diffStyle: "split" | "unified" };

export function ArtifactContentRenderer(props: ArtifactContentRendererProps) {
  if (props.mode === "markdown") {
    return <div className="mx-auto w-full max-w-3xl p-6"><Markdown text={props.text} /></div>;
  }
  return <div className="min-w-0 p-3">{props.mode === "diff"
    ? <CodeDiff oldFile={props.oldFile} newFile={props.newFile} options={{ diffStyle: props.diffStyle }} />
    : <CodeBlock file={props.file} toolbar={props.toolbar} />}</div>;
}
