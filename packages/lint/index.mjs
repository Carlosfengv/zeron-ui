import { plugin } from "@shadcn/lint";
import {
  borderWidthTokens,
  shadowTokens,
  typographyTokens,
} from "@zeron/tokens";

// Zeron's size axes reference recipe objects, which upstream 0.1.0 cannot
// enumerate. Keep explicit guidance here and verify it against control-size.ts.
export const controlSizes = ["xs", "sm", "md", "lg", "xl"];
// Upstream's bundled class grammar treats custom text-* names as colors.
// These are the four Zeron typography utilities, not color exceptions.
export const typographyClasses = typographyTokens.map(({ name }) => `text-${name}`);
export const shadowClasses = shadowTokens.map(({ name }) => `shadow-${name}`);
export const borderWidthClasses = borderWidthTokens.flatMap(({ name }) => [
  `border-${name}`,
  ...["x", "y", "s", "e", "t", "r", "b", "l"].map((side) => `border-${side}-${name}`),
]);
export const stateMarkerClasses = ["is-active"];
export const restyleCategories = [
  "layout",
  "spacing",
  "typography",
  "color",
  "shape",
  "effects",
  "motion",
];
export const generatedUtilityClasses = [
  "duration-*",
  "z-*",
  "h-control-*",
  "min-h-control-*",
  "scroll-fade",
  "scroll-fade-x",
  "scrollbar-hide",
];
const publicPresentation = [...restyleCategories, ...generatedUtilityClasses, ...typographyClasses];

export const contracts = [
  {
    pattern: "^Button$",
    // Upstream cannot correlate class names with variant/active/asChild props.
    // Enforce the size API where the mapping is deterministic and let the
    // repository's semantic-color/focus rules review public presentation.
    allow: publicPresentation,
    deny: [
      "h", "min-h", "max-h", "block-size", "min-block-size", "max-block-size",
      "h-control-*", "min-h-control-*",
      "p", "px", "py", "ps", "pe", "pt", "pr", "pb", "pl",
    ],
    message: {
      spacing: `{{className}} changes {{component}} spacing. Use size (${controlSizes.join(", ")}); use margin or a parent gap for placement.`,
      layout: `{{className}} changes {{component}} height. Use size (${controlSizes.join(", ")}) instead.`,
      color: "{{className}} changes {{component}} colors. Use its public API; see {{file}}.",
    },
  },
  {
    pattern: "^(Input|InputGroup)$",
    allow: publicPresentation,
    // Input padding is a documented composition point for leading/trailing
    // adornments. Height remains owned by the shared size recipe.
    deny: [
      "h", "min-h", "max-h", "size", "block-size", "min-block-size", "max-block-size",
      "h-control-*", "min-h-control-*",
    ],
    message: {
      layout: `{{className}} changes {{component}} height. Use size (${controlSizes.join(", ")}) instead.`,
    },
  },
  {
    pattern: "^SelectTrigger$",
    allow: publicPresentation,
    deny: [
      "h", "min-h", "max-h", "size", "block-size", "min-block-size", "max-block-size",
      "h-control-*", "min-h-control-*",
      "p", "px", "py", "ps", "pe", "pt", "pr", "pb", "pl",
    ],
    message: {
      spacing: "{{className}} overrides SelectTrigger spacing. Set size on the parent Select (xs, sm, md, lg, xl).",
      layout: "{{className}} overrides SelectTrigger height. Set size on the parent Select (xs, sm, md, lg, xl).",
    },
  },
  {
    pattern: "^(CardContent|CardHeader|CardFooter|ContainerHeader|ContainerBody|ContainerFooter|PageBody|PageActions|PageHeader|PageContentHeader)$",
    allow: [...restyleCategories, ...generatedUtilityClasses],
  },
  {
    pattern: "^(PageTitle|PageDescription|CardTitle|CardDescription)$",
    allow: ["layout", "spacing", "typography", "color", ...typographyClasses],
  },
  {
    pattern: "^PageLayout$",
    allow: ["layout", "spacing", "typography", "color", "shape", "effects", "motion", ...generatedUtilityClasses],
    deny: ["max-w"],
    message: "{{className}} overrides PageLayout's page sizing or appearance. Use size and gutter for the outer frame; arrange content inside PageBody.",
  },
];

/**
 * ESLint flat-config policies only. Keep the host framework's parser and
 * language rules. Paths are relative to the host ESLint config.
 * Additional configs can override these rules for reviewed exceptions.
 */
export function createZeronConfig({
  files = ["**/*.{js,jsx,ts,tsx}"],
  componentFiles = ["components/ui/**/*.{js,jsx,ts,tsx}", "src/components/ui/**/*.{js,jsx,ts,tsx}"],
  paletteFiles = [],
  componentImports = ["^@zeron/ui(/|$)", "^@/components/ui(/|$)"],
  strict = false,
} = {}) {
  return [
    {
      name: "zeron/design-system",
      files,
      plugins: { shadcn: plugin },
      settings: {
        shadcn: {
          componentImports,
          note: "Zeron: use the existing component API and semantic tokens. Review semantic intent before accepting a color suggestion.",
        },
      },
      rules: {
        "shadcn/no-restyle": [
          "error",
          { allow: [...restyleCategories, ...generatedUtilityClasses], contracts },
        ],
        "shadcn/no-raw-colors": [
          "error",
          { allow: [...typographyClasses, ...shadowClasses, ...borderWidthClasses] },
        ],
        "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
        "shadcn/no-unknown-classes": ["error", { allow: stateMarkerClasses }],
        // Dynamic style props and class forwarding are common in Zeron's
        // motion and layout components. Audit these separately first.
        "shadcn/no-inline-styles": strict ? "error" : "off",
        "shadcn/require-static-classes": strict ? "error" : "off",
      },
    },
    ...(componentFiles.length ? [{
      name: "zeron/component-implementations",
      files: componentFiles,
      rules: {
        "shadcn/no-restyle": "off",
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-inline-styles": "off",
        "shadcn/require-static-classes": "off",
      },
    }] : []),
    ...(paletteFiles.length ? [{
      name: "zeron/audited-palettes",
      files: paletteFiles,
      rules: { "shadcn/no-raw-colors": "off" },
    }] : []),
  ];
}
