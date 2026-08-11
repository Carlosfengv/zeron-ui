"use client";

import { InputCopy } from "@/components/ui/input-copy";

export function InstallCommand({ value, compact = false }: { value: string; compact?: boolean }) {
  return <InputCopy value={value} align={compact ? "left" : "right"} className={compact ? "w-fit" : undefined} />;
}
