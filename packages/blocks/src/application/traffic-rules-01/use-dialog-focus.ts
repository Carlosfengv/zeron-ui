"use client";

import { useEffect, useRef, type RefObject } from "react";

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogFocus(enabled: boolean, onDismiss: () => void): RefObject<HTMLDivElement | null> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!enabled) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialFocus = dialog.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled])")
      ?? dialog.querySelector<HTMLElement>(focusableSelector)
      ?? dialog;
    const focusFrame = window.requestAnimationFrame(() => initialFocus.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        // The first Escape belongs to an open nested popup, not its parent editor.
        if (dialog.querySelector('[role="combobox"][aria-expanded="true"], [role="menu"], [role="listbox"]')) return;
        event.preventDefault();
        dismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [enabled]);

  return dialogRef;
}
