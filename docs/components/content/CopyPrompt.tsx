"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";

export function CopyPrompt({ value, label, children }: { value: string; label: string; children?: ReactNode }) {
  const t = useTranslations("introduction.skills");
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  async function copy() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="rounded-lg border-hairline border-border-subtle bg-surface-raised p-4">
        <p className="whitespace-pre-wrap break-words text-body text-fg-default select-text">{value}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={copy} disabled={status === "copying"}>
          {status === "copied" ? t("copied") : label}
        </Button>
        {children}
      </div>
      <p role="status" aria-live="polite" className="text-body text-fg-muted">
        {status === "error" ? t("copyError") : status === "copied" ? t("copySuccess") : null}
      </p>
    </div>
  );
}
