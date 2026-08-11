"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";

export function HomeIntro() {
  const ArrowRight = useIcon("arrow-right");
  return (
    <div className="w-full max-w-[960px] mx-auto py-20 sm:py-28 px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] sm:text-[28px] text-foreground leading-none font-bold">Zeron Design</h1>
          <p className="text-[14px] text-muted-foreground">Refined UI components with satisfying hover.</p>
          <div className="flex items-center gap-2 mt-2">
            <Button asChild variant="primary" size="sm">
              <Link href="/docs">Learn more</Link>
            </Button>
            <Button asChild variant="tertiary" size="sm">
              <Link href="/demo">See demo</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled aria-label="No previous page"><ArrowRight className="rotate-180" /></Button>
          <Tooltip content={<span>Introduction &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
            <Button asChild variant="ghost" size="icon">
              <Link href="/docs" aria-label="Next: Introduction"><ArrowRight /></Link>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
