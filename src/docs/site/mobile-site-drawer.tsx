"use client";

import type { RefObject } from "react";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SettingsContent } from "@/docs/site/right-panel";
import { Sidebar } from "@/docs/site/sidebar";

export function MobileSiteDrawer({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  return (
    <MobileDrawer open={open} onClose={onClose} triggerRef={triggerRef}>
      <Sidebar mobile />
      <div className="mt-auto pt-4">
        <div className="pl-1 pt-2 pb-2">
          <h2 className="text-[16px] text-foreground leading-none font-semibold">
            Make them yours
          </h2>
        </div>
        <SettingsContent tooltipSide="right" />
      </div>
    </MobileDrawer>
  );
}
