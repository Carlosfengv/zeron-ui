"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";

interface PageLink {
  slug: string;
  name: string;
}

export function DocPager({ prev, next }: { prev: PageLink | null; next: PageLink | null }) {
  const ArrowRight = useIcon("arrow-right");

  return (
    <div className="flex items-center gap-1 shrink-0">
      {prev ? (
        <Tooltip content={<span>{prev.name} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
          <Button asChild variant="ghost" size="icon">
            <Link href={`/docs/${prev.slug}`} aria-label={`Previous: ${prev.name}`}>
              <ArrowRight className="rotate-180" />
            </Link>
          </Button>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="icon" disabled aria-label="No previous component">
          <ArrowRight className="rotate-180" />
        </Button>
      )}
      {next ? (
        <Tooltip content={<span>{next.name} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
          <Button asChild variant="ghost" size="icon">
            <Link href={`/docs/${next.slug}`} aria-label={`Next: ${next.name}`}>
              <ArrowRight />
            </Link>
          </Button>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="icon" disabled aria-label="No next component"><ArrowRight /></Button>
      )}
    </div>
  );
}
