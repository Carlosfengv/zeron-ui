"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";

/** Keep readable, copyable text independent of the optional highlighting chunk. */
export function PreviewCodeFallback({
  source,
  sourceFailed,
  highlightFailed,
  onSourceRetry,
  onHighlightRetry,
}: {
  source: string | undefined;
  sourceFailed: boolean;
  highlightFailed: boolean;
  onSourceRetry: () => void;
  onHighlightRetry: () => void;
}) {
  const t = useTranslations("preview");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const mounted = useRef(false);
  const copyAttempt = useRef(0);
  const latestSource = useRef(source);
  latestSource.current = source;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const copy = async () => {
    if (source === undefined) return;
    const attempt = ++copyAttempt.current;
    try {
      await navigator.clipboard.writeText(source.trim());
      if (mounted.current && latestSource.current === source && copyAttempt.current === attempt) setCopyState("copied");
    } catch {
      if (mounted.current && latestSource.current === source && copyAttempt.current === attempt) setCopyState("failed");
    }
  };

  const status = source === undefined
    ? sourceFailed ? "sourceFailed" : "sourceLoading"
    : highlightFailed ? "highlightFailed" : "highlighting";

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-label text-fg-muted">
        <span role="status">{t(status)}</span>
        {source === undefined && sourceFailed && (
          <Button size="sm" variant="ghost" onClick={onSourceRetry}>{t("sourceRetry")}</Button>
        )}
        {source !== undefined && highlightFailed && (
          <Button size="sm" variant="ghost" onClick={onHighlightRetry}>{t("highlightRetry")}</Button>
        )}
        {source !== undefined && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={copy}>
            {t(copyState === "copied" ? "copied" : copyState === "failed" ? "copyFailed" : "copy")}
          </Button>
        )}
      </div>
      {source !== undefined && (
        <pre className="m-0 overflow-auto p-4 text-code text-fg-default"><code>{source.trim()}</code></pre>
      )}
    </>
  );
}
