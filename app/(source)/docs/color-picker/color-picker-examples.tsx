"use client";

import { useState } from "react";
import { ColorPicker, ColorPickerPopover } from "@/components/ui/color-picker";

export function ControlledColorPickerExample() {
  const [color, setColor] = useState("#6B97FF");

  return (
    <div className="flex flex-col gap-3 items-start">
      <ColorPicker value={color} onValueChange={setColor} />
      <p className="text-label text-fg-muted">
        Current: <span className="font-mono">{color}</span>
      </p>
    </div>
  );
}

export function RemovableColorPickerExample() {
  const [color, setColor] = useState<string | null>("#6B97FF");

  if (color) {
    return (
      <ColorPickerPopover
        triggerLabel="Fill"
        triggerShowRemove
        onTriggerRemove={() => setColor(null)}
        value={color}
        onValueChange={setColor}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setColor("#6B97FF")}
      className="text-label text-fg-muted hover:text-fg-default border border-dashed border-border px-3 h-9 rounded-control cursor-pointer"
    >
      + Add fill
    </button>
  );
}
