// Generated from packages/ui/src/tokens/semantic-tokens.mjs. Do not edit.
// CSS duration utilities and these Framer Motion tiers share one source.
// Use spring.<tier> for entry and spring.<tier>.exit for dismissal.

export const spring = {
  fast: {
    type: "spring" as const,
    duration: 0.08,
    bounce: 0,
    exit: { duration: 0.06 },
  },
  moderate: {
    type: "spring" as const,
    duration: 0.16,
    bounce: 0,
    exit: { duration: 0.12 },
  },
  slow: {
    type: "spring" as const,
    duration: 0.24,
    bounce: 0.12,
    exit: { duration: 0.16 },
  },
} as const;

// Fallback delay (ms) for deferred-unmount timers. The safety buffer keeps a
// throttled/background tab from leaving an exited portal mounted forever.
export const exitFallbackMs = (tier: { exit: { duration: number } }) =>
  Math.round(tier.exit.duration * 1000) + 100;
