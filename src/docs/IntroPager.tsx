"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";

export function IntroPager({ nextSlug, nextName }: { nextSlug: string; nextName: string }) {
  const ArrowRight = useIcon("arrow-right");
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Tooltip content={<span>Showcase &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
        <Button asChild variant="ghost" size="icon">
          <Link href="/" aria-label="Previous: Showcase"><ArrowRight className="rotate-180" /></Link>
        </Button>
      </Tooltip>
      <Tooltip content={<span>{nextName} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
        <Button asChild variant="ghost" size="icon">
          <Link href={`/docs/${nextSlug}`} aria-label={`Next: ${nextName}`}><ArrowRight /></Link>
        </Button>
      </Tooltip>
    </div>
  );
}
