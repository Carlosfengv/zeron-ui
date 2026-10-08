import type { KeyboardEvent } from "react";
/** undefined: unrelated key; null: clear; number: selected data index. */
export function chartKeyboardIndex(event: KeyboardEvent, current: number | null, count: number): number | null | undefined {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape"].includes(event.key)) return undefined;
  event.preventDefault();
  if (event.key === "Escape" || count === 0) return null;
  if (event.key === "Home") return 0;
  if (event.key === "End") return count - 1;
  const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
  return Math.max(0, Math.min(count - 1, current === null ? (direction < 0 ? count - 1 : 0) : current + direction));
}
