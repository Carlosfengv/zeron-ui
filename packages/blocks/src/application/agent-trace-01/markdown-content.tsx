import { Fragment, type ReactNode } from "react";

function inlineCode(text: string): ReactNode {
  const pieces = text.split(/(`[^`]+`)/g);
  return pieces.map((piece, index) => piece.startsWith("`") && piece.endsWith("`")
    ? <code key={index} className="rounded bg-surface-raised px-1 py-0.5 font-mono text-[0.9em] text-fg-default">{piece.slice(1, -1)}</code>
    : <Fragment key={index}>{piece}</Fragment>);
}

/** A deliberately small, safe Markdown surface that remains stable while deltas append. */
export function StreamMarkdown({ text, streaming }: { text: string; streaming: boolean }) {
  const parts = text.split(/(```[\s\S]*?(?:```|$))/g).filter(Boolean);
  return <div className="space-y-3 whitespace-pre-wrap break-words leading-6">{parts.map((part, index) => {
    if (part.startsWith("```")) {
      const body = part.slice(3);
      const newline = body.indexOf("\n");
      const language = newline === -1 ? "" : body.slice(0, newline).trim();
      const code = (newline === -1 ? body : body.slice(newline + 1)).replace(/```$/, "");
      return <pre key={index} className="overflow-x-auto rounded-md bg-surface-raised px-3 py-2 text-label leading-5"><code data-language={language || undefined}>{code}</code></pre>;
    }
    return <p key={index}>{inlineCode(part)}</p>;
  })}{streaming && <span aria-label="Streaming response" className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-fg-muted" />}</div>;
}
