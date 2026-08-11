// Generated from src/system/tokens/semantic-tokens.mjs. Do not edit directly.

export const shapeTokenValues = {
  "rounded": {
    "control": 8,
    "focus": 10,
    "selection": 8,
    "container": 12,
    "overlay": 12,
    "full": 9999
  },
  "pill": {
    "control": 20,
    "focus": 22,
    "selection": 16,
    "container": 24,
    "overlay": 20,
    "full": 9999
  }
} as const;

export const shapeTokenClasses = {
  "rounded": {
    "control": "rounded-[8px]",
    "focus": "rounded-[10px]",
    "selection": "rounded-[8px]",
    "container": "rounded-[12px]",
    "overlay": "rounded-[12px]",
    "full": "rounded-[9999px]"
  },
  "pill": {
    "control": "rounded-[20px]",
    "focus": "rounded-[22px]",
    "selection": "rounded-[16px]",
    "container": "rounded-[24px]",
    "overlay": "rounded-[20px]",
    "full": "rounded-[9999px]"
  }
} as const;

export type GeneratedShapeVariant = keyof typeof shapeTokenValues;
