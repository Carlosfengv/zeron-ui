import type { ReactNode } from "react";
import type { PopoverAlign, PopoverSide } from "@zeron/ui/popover";

/** Relative ratings: 1 (lowest) through 5 (highest). Cost means expense. */
export type ModelSelectorRating = 1 | 2 | 3 | 4 | 5;

export interface ModelSelectorModel {
  id: string;
  name: string;
  description: string;
  /** A decorative model logo (for example from @lobehub/icons) or short fallback mark. */
  icon: ReactNode;
  ratings?: {
    speed: ModelSelectorRating;
    quality: ModelSelectorRating;
    cost: ModelSelectorRating;
  };
  /** Omit estimates for automatic routing or unavailable pricing. */
  firstTokenSeconds?: number;
  costPerMillionTokens?: number;
  disabled?: boolean;
}

export interface ModelSelectorValue {
  modelId: string;
  extendedThinking: boolean;
  webSearch: boolean;
}

export interface ModelSelectorLabels {
  chooseModel: string;
  model: string;
  speed: string;
  quality: string;
  cost: string;
  varies: string;
  extendedThinking: string;
  webSearch: string;
  firstToken: string;
  perMillionTokens: string;
  empty: string;
  navigate: string;
  select: string;
}

export interface ModelSelectorProps {
  models: readonly ModelSelectorModel[];
  value: ModelSelectorValue;
  onValueChange: (value: ModelSelectorValue) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  labels?: Partial<ModelSelectorLabels>;
  locale?: string;
  currency?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
  className?: string;
}
