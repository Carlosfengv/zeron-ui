"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import {
  PlayField,
  PlaygroundLayout,
  PlaygroundPanel,
  PlaySelect,
} from "@docs/components/playground/playground";

export interface PlaygroundVariant {
  value: string;
  label: string;
  code: string;
  preview: ReactNode;
}

interface VariantPlaygroundProps {
  variants: readonly PlaygroundVariant[];
  minHeightClass?: string;
  padding?: "default" | "compact" | "responsive" | "none";
  align?: "center" | "bottom";
  inspectable?: boolean;
}

/**
 * A small, truthful playground for component pages whose useful controls map
 * cleanly to a handful of documented configurations. The selected variant
 * changes both the live preview and the copyable code; randomize is retained
 * so it behaves like the richer per-component playgrounds.
 */
export function VariantPlayground({
  variants,
  minHeightClass,
  padding,
  align,
  inspectable,
}: VariantPlaygroundProps) {
  const t = useTranslations("playground");
  const [selectedValue, setSelectedValue] = useState(variants[0]?.value ?? "");
  const selected = useMemo(
    () => variants.find((variant) => variant.value === selectedValue) ?? variants[0],
    [selectedValue, variants],
  );

  if (!selected || variants.length === 0) return null;

  const randomize = () => {
    if (variants.length < 2) return;
    const candidates = variants.filter((variant) => variant.value !== selected.value);
    setSelectedValue(candidates[Math.floor(Math.random() * candidates.length)]!.value);
  };

  return (
    <PlaygroundLayout
      controls={
        <PlaygroundPanel onShuffle={randomize}>
          <PlayField label={t("variant")}>
            <PlaySelect
              value={selected.value}
              onChange={setSelectedValue}
              options={variants.map(({ value, label }) => ({ value, label }))}
            />
          </PlayField>
        </PlaygroundPanel>
      }
      preview={
        <ComponentPreview
          code={selected.code}
          minHeightClass={minHeightClass}
          padding={padding}
          align={align}
          inspectable={inspectable}
        >
          {selected.preview}
        </ComponentPreview>
      }
    />
  );
}
