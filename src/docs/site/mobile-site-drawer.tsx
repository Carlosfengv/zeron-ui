"use client";

import type { RefObject } from "react";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { SettingsContent } from "@/docs/site/right-panel";
import { Sidebar } from "@/docs/site/sidebar";
import { useTranslations } from "next-intl";

export function MobileSiteDrawer({
  open,
  onClose,
  triggerRef,
  localePrefix = "",
  showLanguage = false,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLElement | null>;
  localePrefix?: string;
  showLanguage?: boolean;
}) {
  const t = useTranslations("settings");
  return (
    <MobileDrawer open={open} onClose={onClose} triggerRef={triggerRef}>
      <Sidebar mobile localePrefix={localePrefix} />
      <div className="mt-auto pt-4">
        <div className="pl-1 pt-2 pb-2">
          <h2 className="text-[16px] text-foreground leading-none font-semibold">
            {t("heading")}
          </h2>
        </div>
        <SettingsContent tooltipSide="right" localePrefix={localePrefix} showLanguage={showLanguage} />
      </div>
    </MobileDrawer>
  );
}
