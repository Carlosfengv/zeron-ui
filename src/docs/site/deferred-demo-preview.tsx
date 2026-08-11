"use client";

import { useEffect, useState, type ComponentType } from "react";

export function DeferredDemoPreview({ slug }: { slug: string }) {
  const [Preview, setPreview] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    import("@/docs/site/bento-previews").then(({ previewMap }) => {
      if (!cancelled) setPreview(() => previewMap[slug] ?? null);
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (!Preview) return <div className="text-body-sm text-muted-foreground">Loading preview…</div>;
  return <Preview />;
}
