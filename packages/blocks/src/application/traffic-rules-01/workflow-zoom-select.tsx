"use client";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";

const zoomLevels = [60, 75, 90, 100, 110, 125];

export function WorkflowZoomSelect({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <Select itemDensity="compact" onValueChange={(next) => onChange(Number(next))} size="sm" value={String(value)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="min-w-[68px] border-transparent bg-transparent text-label text-fg-muted shadow-none hover:border-transparent hover:bg-hover"
      />
      <SelectContent align="end">
        {zoomLevels.map((level) => <SelectItem key={level} value={String(level)}>{level}%</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
