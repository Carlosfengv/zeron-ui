"use client";

import { useEffect, useState } from "react";
import {
  getCachedPreviewSource,
  requestPreviewSource,
  type PreviewCode,
} from "@docs/lib/preview-source";

type SourceState = { url: string; source?: string; failed: boolean };

export function usePreviewSource(code: PreviewCode, enabled: boolean) {
  const url = typeof code === "string" ? null : code.url;
  const [state, setState] = useState<SourceState | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!url || !enabled) return;
    let cancelled = false;
    setState({ url, failed: false });
    let release: (() => void) | undefined;
    try {
      const request = requestPreviewSource(url);
      release = request.release;
      request.promise.then(
        (source) => { if (!cancelled) setState({ url, source, failed: false }); },
        () => { if (!cancelled) setState({ url, failed: true }); },
      );
    } catch {
      setState({ url, failed: true });
    }
    return () => {
      cancelled = true;
      release?.();
    };
  }, [url, enabled, retryKey]);

  const source = typeof code === "string"
    ? code
    : state?.url === url && state.source !== undefined
      ? state.source
      : getCachedPreviewSource(code.url);

  return {
    source,
    failed: source === undefined && state?.url === url && state.failed,
    retry: () => setRetryKey((current) => current + 1),
  };
}
