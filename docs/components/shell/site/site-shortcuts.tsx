"use client";

import { useEffect } from "react";
import { useIconContext } from "@zeron/icons/context";
import { useThemeContext } from "@zeron/ui/system/theme-context";

const keyboardControls = 'input, textarea, select, [role="combobox"], [role="listbox"], [role="menu"], [role="menubar"], [role="grid"], [role="tree"]';

export function SiteShortcuts() {
  const { theme, setTheme } = useThemeContext();
  const { availableVariants, cycleVariant } = useIconContext();
  const canCycleIcons = availableVariants.length > 1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.isComposing || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key !== "d" && (key !== "i" || !canCycleIcons)) return;

      if (event.target instanceof Element) {
        const editingHost = event.target.closest("[contenteditable]");
        if (event.target.closest(keyboardControls) || (editingHost instanceof HTMLElement && editingHost.isContentEditable)) return;
      }

      event.preventDefault();
      if (key === "i") {
        cycleVariant();
        return;
      }

      const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      setTheme(isDark ? "light" : "dark");
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canCycleIcons, cycleVariant, setTheme, theme]);

  return null;
}
