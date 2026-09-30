"use client";

import { useLinkStatus } from "next/link";
import { useLocale } from "next-intl";
import { cn } from "@zeron/ui/system/utils";

export function LinkPendingIndicator({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  const locale = useLocale();

  if (!pending) return null;

  return (
    <span className={cn("pointer-events-none inline-flex items-center justify-center", className)} role="status">
      <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-fg-brand border-r-transparent" />
      <span className="sr-only">{locale === "en" ? "Loading page…" : "正在加载页面…"}</span>
    </span>
  );
}
