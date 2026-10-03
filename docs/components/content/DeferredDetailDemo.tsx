"use client";

import { startTransition, useEffect, useRef, useState, type ComponentType } from "react";
import { useLocale } from "next-intl";
import { Button } from "@zeron/ui/button";

/** A detail demo is activated once, then kept mounted to preserve user edits.
 * Loaders belong in tiny client entrypoints, never in the server document. */
export function DeferredDetailDemo<Props extends object>({
  loader,
  demoProps,
  minHeight,
  nearViewport = false,
}: {
  loader: () => Promise<ComponentType<Props>>;
  demoProps: Props;
  minHeight: number;
  nearViewport?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(!nearViewport);
  const [Demo, setDemo] = useState<ComponentType<Props> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const english = useLocale() === "en";

  useEffect(() => {
    if (activated) return;
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setActivated(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setActivated(true);
        observer.disconnect();
      }
    }, { rootMargin: "160px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  useEffect(() => {
    if (!activated) return;
    let cancelled = false;
    setFailed(false);
    void loader().then((Component) => {
      if (!cancelled) startTransition(() => setDemo(() => Component));
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [activated, attempt, loader]);

  return (
    <div ref={ref} className="w-full min-w-0" style={{ minHeight }} data-detail-demo={Demo ? "ready" : failed ? "error" : "pending"}>
      {Demo ? <Demo {...demoProps} /> : (
        <div className="flex items-start justify-center gap-3 bg-surface-raised pt-6 text-label text-fg-muted" style={{ minHeight }} aria-busy={activated && !failed}>
          {failed ? <><span>{english ? "Preview unavailable" : "预览暂不可用"}</span><Button variant="secondary" size="sm" onClick={() => setAttempt((value) => value + 1)}>{english ? "Retry" : "重试"}</Button></> : <span>{english ? "Loading preview…" : "正在加载预览…"}</span>}
        </div>
      )}
    </div>
  );
}
