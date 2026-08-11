import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

// Tailwind utilities reserved for the Zeron Design token system.
const SHADCN_RESERVED_REGEX =
  "\\b(bg|text|border|ring|hover:bg|hover:text|focus-visible:ring|focus:ring)-(primary|secondary|popover|primary-foreground|secondary-foreground|popover-foreground|destructive-foreground)(\\/[0-9]+)?\\b";

// Focus indicators must ride the --focus-ring token so every click area
// shows the same ring (see the @layer base :focus-visible fallback in
// app/globals.css). This catches color-bearing ring/outline/border utilities
// under focus variants that bypass the token: palette colors, white/black,
// and arbitrary values that aren't var(--focus-ring) — including the raw
// hex, which must go through the token form to stay themeable.
const FOCUS_PALETTE =
  "(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-[0-9]{2,3}";
const FOCUS_RING_REGEX = `\\bfocus(?:-visible|-within)?:(?:ring|outline|border)-(?:${FOCUS_PALETTE}|white|black|\\[(?!color:var\\(--focus-ring|var\\(--focus-ring))`;
const FOCUS_RING_MESSAGE =
  "Focus indicators must use the --focus-ring token — e.g. focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)].";

const shadcnRestrictedRules = {
  "no-restricted-syntax": [
    "error",
    {
      selector: `Literal[value=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens (bg-foreground, bg-card, bg-accent, bg-destructive, text-foreground, etc.) instead.",
    },
    {
      selector: `TemplateElement[value.raw=/${SHADCN_RESERVED_REGEX}/]`,
      message:
        "Tailwind utility reserved for /compare's shadcn theme. Use FF tokens instead.",
    },
    {
      selector: `Literal[value=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
    {
      selector: `TemplateElement[value.raw=/${FOCUS_RING_REGEX}/]`,
      message: FOCUS_RING_MESSAGE,
    },
  ],
};

export default [
  {
    ignores: [
      ".claude/**",
      ".next*/**",
      ".playwright-*/**",
      "coverage/**",
      "dist/**",
      "next-env.d.ts",
      "node_modules/**",
      "output/**",
      "public/r/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [
      "app/**/*.{ts,tsx}",
      "src/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/registry/default", "@/registry/default/*", "@/registry/default/**"],
              message:
                "Source code must use public entries from @/components/ui, @/lib, or @/hooks.",
            },
            {
              group: ["@/components/flavored", "@/components/flavored/*", "@/components/flavored/**"],
              message: "Import the canonical component from @/components/ui instead.",
            },
          ],
        },
      ],
    },
  },
// Block reserved Tailwind tokens in Zeron Design code.
  {
    files: ["**/*.{ts,tsx}"],
    rules: shadcnRestrictedRules,
  },
];
