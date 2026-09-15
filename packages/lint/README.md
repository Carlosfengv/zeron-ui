# @zeron/lint

Zeron Design policies built on `@shadcn/lint@0.1.0`. This is a **private workspace package**, not a published npm package or a separate lint engine.

## Run in this repository

```sh
pnpm lint:design
```

The design check extends the existing ESLint configuration, reports violations, and exits nonzero on errors. The full configured scope is clean and CI runs this command as a required check.

For a smaller review:

```sh
pnpm exec eslint --config eslint.design.config.mjs packages/blocks/src/application/resource-list-page-01
```

For machine-readable diagnostics:

```sh
pnpm lint:design --format json --output-file output/design-lint.json
```

Create the output directory first if it does not exist. ESLint reports rule IDs, files, locations, messages and available editor suggestions. It does not call an AI model. Suggestions are not automatic fixes.

## Policies

The repository's [Zeron Page Builder skill](../../.agents/skills/zeron-page-builder/SKILL.md) uses this checker as an implementation feedback loop: inspect active contracts, check affected files, fix findings, and rerun before browser verification. Its [verification reference](../../.agents/skills/zeron-page-builder/references/verification.md#design-lint-feedback-loop) explains scope and result reporting. The skill does not install the linter in consumer projects.

| Check | Default | Zeron adaptation |
| --- | --- | --- |
| `shadcn/no-restyle` | Error at usage sites | Button, Input, and InputGroup height comes from `size`; Button padding also comes from its API. SelectTrigger height and padding come from the parent Select unless `contentSized` is used. Public content regions may own presentation. |
| `shadcn/no-raw-colors` | Error | Exact token-derived exceptions cover Zeron typography, shadows, and border widths that upstream classifies as colors. |
| `shadcn/no-arbitrary-values` | Error at usage sites | Layout values are allowed. Reviewed block-specific visual recipes use exact file-scoped allowances with named reasons. Component implementations may use internal values. |
| `shadcn/no-unknown-classes` | Error | Uses the project's installed Tailwind and CSS theme. No broad exemption for named duration or animation classes. |
| `shadcn/no-inline-styles` | Off | Opt in with `strict: true` at usage sites after reviewing dynamic styling. |
| `shadcn/require-static-classes` | Off | Opt in with `strict: true` at usage sites. |

Core implementations keep color and unknown-class checks. The repository's existing ESLint checks still enforce reserved aliases, semantic colors and focus-ring policy. Only the audited ColorPicker and Badge palette sources are excluded from the upstream color rule. `is-active` is the sole allowed non-utility marker because Table rows expose it to a descendant selector.

## Reuse the configuration

The factory returns an array of ESLint flat config objects. Keep the host project's parser and framework rules, then append the policies:

```js
import { createZeronConfig } from "./packages/lint/index.mjs";

export default [
  ...existingConfig,
  ...createZeronConfig({
    files: ["src/**/*.{ts,tsx}"],
    componentFiles: ["src/components/ui/**/*.{ts,tsx}"],
    componentImports: ["^@/components/ui(/|$)"],
    paletteFiles: ["src/components/ui/color-picker.tsx", "src/components/ui/badge-colors.ts"],
    strict: false,
  }),
];
```

This example assumes the workspace package has been copied or linked locally with its dependencies. No `npm install @zeron/lint` flow is available yet. `componentFiles` must point to component implementations, not every file using components. Paths are relative to the ESLint configuration. Add reviewed exceptions as later ESLint config objects.

The factory exports its contracts and derived token vocabularies for inspection. The upstream plugin and its `shadcn/*` rule IDs remain unchanged. Node.js >=20.19, ESLint >=9.30 and Tailwind v4 are required; the host configuration must provide a JSX/TypeScript parser. This adapter has been tested with ESLint, not Oxlint.

## Known limits

- Upstream does not parse `light-dark()` color values for nearest-color suggestions. Token name validation still works. Color proximity also cannot determine semantic intent.
- Upstream cannot enumerate Zeron's referenced Button/Input size maps. The adapter supplies explicit, tested size guidance.
- Token exceptions are exact names derived from `@zeron/tokens`. Real Tailwind compilation tests separately prove that hairline, duration, and animation utilities exist.
- Height contracts cover the listed Tailwind groups, not every equivalent CSS spelling. Arbitrary CSS properties, ancestors, imported class values and unknown prop spreads need further coverage.
- `no-restyle` does not prove correct surface nesting, scroll ownership, responsive behavior, accessibility or visual fidelity. Existing browser and contract tests remain necessary.
- `no-restyle` cannot correlate a class with a component's runtime `variant`, `active`, `asChild`, or nested selector target. Zeron therefore enforces deterministic size ownership and leaves public presentation to semantic-color, focus, token, and runtime checks.
- The upstream class collector is internal. Future Zeron rules should use supported APIs or a separately tested collector instead of deep-importing private files.

See [the analysis](../../docs/plans/zeron-design-lint.md) and [the remediation plan](../../docs/plans/zeron-design-lint-remediation-plan.md).
