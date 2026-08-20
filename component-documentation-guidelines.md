# Component Documentation Guidelines

Checklist and conventions for documenting every new component in this project. Following this ensures consistency across all doc pages and compatibility with the shadcn registry.

---

## Checklist for a New Component

### 1. Component Source (`packages/ui/src/components/<component-name>.tsx`)

`@/components/ui/<component-name>` is the only public component entry and the
file under `packages/ui/src/components/` is the canonical implementation used by both the
site and Registry. Registry metadata belongs in `registry.json`; do not create
a parallel Registry source tree.

- [ ] `"use client"` directive at the top
- [ ] TypeScript props interface extending native HTML attributes where applicable
- [ ] `forwardRef` with `displayName` set
- [ ] CVA (`class-variance-authority`) for variant/size management if the component has visual variants
- [ ] Named exports for the component, sub-components, variant helper, and props type
- [ ] Any text that changes weight on state (selected/checked/active/open) uses the **ghost-span pattern** (see below) — never animate weight on text without reserving its width
- [ ] Any animation uses a tier from `@/lib/springs` — `spring.<tier>` to enter, `spring.<tier>.exit` to leave (see [motion-guidelines.md](motion-guidelines.md))
- [ ] Uses `@/` path aliases for all internal imports:
  ```ts
  import { cn } from "@/lib/utils";
  import { springs } from "@/lib/springs";
  import { fontWeights } from "@/lib/font-weight";
  import { useShape } from "@/lib/shape-context";
  import { useIcon } from "@/lib/icon-context";
  import type { IconComponent } from "@/lib/icon-context";
  import { useProximityHover } from "@/hooks/use-proximity-hover";
  ```

### 2. Registry Entry (`registry.json`)

Add an item to the `items` array:

```jsonc
{
  "name": "component-name",            // kebab-case, unique
  "type": "registry:ui",               // or registry:lib / registry:hook
  "title": "Component Name",           // human-readable
  "description": "One-two sentence description of what it does and key features.",
  "dependencies": ["framer-motion"],   // npm packages (only those not already in the project)
  "registryDependencies": ["utils"],   // other registry items this depends on
  "files": [
    {
      "path": "packages/ui/src/components/component-name.tsx",
      "type": "registry:ui",
      "target": "components/ui/component-name.tsx"
    }
    // add sub-component files here if any (e.g., menu-item.tsx for dropdown)
  ]
}
```

**Field rules:**
- `dependencies` = external npm packages (framer-motion, @base-ui/react, @hugeicons/react, class-variance-authority)
- `registryDependencies` = other items in this registry (utils, springs, font-weight, shape-context, icon-context, use-proximity-hover, or other components like button)
- Components that render icons depend on `icon-context` only — it brings the free HugeIcons Stroke Rounded defaults. Pro variants belong in the separate `pro-icon-provider` item and must never be added to individual components.
- Multi-file components list all files in the `files` array

### 3. Generated Registry JSON (`public/r/<component-name>.json`)

Run the registry build script (`pnpm registry:build`) to generate the JSON file. It must contain:
- `$schema: "https://ui.shadcn.com/schema/registry-item.json"`
- Full source code embedded in `files[].content`
- All metadata matching `registry.json`

> **Rebuild on every source edit, not just new components.** The JSONs in `public/r/` embed a *copy* of the source, so editing any Registry source — a component **or** a shared system file like `packages/ui/src/system/font-weight.ts` — leaves the published Registry stale until you re-run `pnpm registry:build`. Editing a shared system file only regenerates that item's JSON (e.g. `font-weight.json`); consumers reference it by `registryDependencies`, so they don't need rebuilding, but the item does. Commit the regenerated JSONs alongside the source, and rebuild before any `vercel --prod` deploy.

### 4. Component List Entry (`src/docs/components.ts`)

Add an entry to `componentList`:

```ts
{ slug: "component-name", name: "ComponentName", description: "Short description." }
```

- `slug` must match the folder name under `app/docs/`
- `description` should be concise (one sentence)

### 5. Documentation Page (`app/docs/<component-name>/page.tsx`)

This is the main deliverable. Structure:

```tsx
"use client";

import { useState } from "react";
import { ComponentName } from "@/components/ui/component-name";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";

// --- Code snippets as string constants ---
const basicCode = `import { ComponentName } from "./components";

<ComponentName />`;

// --- Props table data ---
const componentProps: PropDef[] = [
  { name: "variant", type: '"a" | "b"', default: '"a"', description: "Visual style." },
  // ...
];

export default function ComponentNameDoc() {
  return (
    <DocPage
      title="ComponentName"
      description="One-two sentence description matching the registry."
    >
      <DocSection title="Basic">
        <ComponentPreview code={basicCode}>
          {/* Live interactive preview */}
          <ComponentName />
        </ComponentPreview>
      </DocSection>

      {/* One DocSection per feature/variant */}

      <DocSection title="API Reference">
        <PropsTable props={componentProps} />
      </DocSection>
    </DocPage>
  );
}
```

### 6. Motion System Page (`app/docs/motion/page.tsx`)

If the component animates, add it to the `SPEED_USAGE` array on the Motion page so its "Where each speed shows up" list stays complete, and keep [motion-guidelines.md](motion-guidelines.md) in sync. Pick the spring tier by the component's headline motion (small state flip → `fast`; panel/indicator that travels → `moderate`; surface that takes over the view → `slow`), enter on that tier, and exit one tier faster. See [motion-guidelines.md](motion-guidelines.md) for the full motion checklist.

---

## Animated Font Weight — Single-DOM-Text Pattern

When text gets heavier on an interactive state (selected, checked, active, open, interacting), reserve the heaviest width without duplicating the label in the DOM. `aria-hidden` removes a node from the accessibility tree, but it does not remove it from DOM text queries and it must never wrap cloned interactive content.

For a string or number label, use a `data-*` attribute and an invisible pseudo-element in the same grid cell:

```tsx
<span
  data-label={label}
  className="inline-grid after:col-start-1 after:row-start-1 after:invisible after:font-semibold after:content-[attr(data-label)]"
>
  <span className="col-start-1 row-start-1 transition-[color,font-weight] duration-fast">
    {label}
  </span>
</span>
```

**Rules:**
- Use the component's existing typography API. If it uses variable-font settings, preserve its paired `wght` and `opsz` values; otherwise preserve its existing Tailwind weight classes.
- The `::after` pseudo-element is always set to the **heaviest** weight the visible text can reach, has `invisible`, and uses `content-[attr(data-label)]` (or an equivalently named `data-*` attribute).
- The pseudo-element and visible span share the cell via `after:col-start-1 after:row-start-1` and `col-start-1 row-start-1` inside an `inline-grid` (or `grid`/`inline-grid flex-1` when it must fill a row).
- For React elements, fragments, mixed children, or any interactive content, render the children exactly once. Do not clone them to stabilize width.
- The transition **must** include `font-variation-settings` in its property list (e.g. `transition-[color,font-variation-settings] duration-80`). Plain `transition-colors` / `transition-opacity` will *not* animate weight — it snaps. Use `duration-80` (the slider's value readout is the one intentional exception at `duration-100`).
- Skip width reservation when the weight is **static** for the lifetime of the node (e.g. table header vs body rows never change) or the element is already a **fixed-size box** (e.g. a `w-5 h-5` chip holding a single digit) — there is nothing to reflow.
- **Standard weight pairs:** resting `normal` → active `semibold` (400 → 550) is the default for selected/checked/active/open states. Use `medium` as the *resting* weight only when the component's default text is already medium and you want a smaller jump to `semibold` (e.g. ask-user options, 450 → 550). The slider's value readout is the lone `normal` → `medium` case. Don't invent new pairs — pick from these so the whole system animates at consistent magnitudes.
- **If you change variable-font tokens or introduce much larger text,** re-measure and re-tune the paired `opsz` values. Method: render the label in an offscreen `<span style="font-optical-sizing:none">`, measure `getBoundingClientRect().width` at the resting `wght/opsz` vs each candidate bold `opsz`, and pick the `opsz` that centers the closed→bold width delta on zero across representative labels (longer strings dominate the perceived shift).

Reference implementations: `tabs.tsx`, `card.tsx`.

---

## Documentation Page Conventions

### Imports

- Always use `@/` path aliases, never relative paths like `../../`
- Component: `@/components/ui/<component-name>`
- Doc utilities: `@/docs/ComponentPreview`, `@/docs/PropsTable`, `@/docs/DocPage`
- Icons: `@/lib/icon-context` (`useIcon`, `useIcons` hooks, `IconComponent` type)
  - Components with internal icons: `import { useIcon } from "@/lib/icon-context";`
  - Components accepting icon props: `import type { IconComponent } from "@/lib/icon-context";`
  - Doc pages: call `useIcon("icon-name")` inside the component function for each icon needed
  - Icon prop type is `IconComponent`, not `LucideIcon`
  - **Adding a new icon name**: add it to `IconName` in `packages/ui/src/system/icon-context.tsx`
    and its underlying HugeIcons definition to `packages/ui/src/system/icon-catalog.ts`. Every supported
    style module must import that definition so the style maps remain identical.
  - **Pro variants**: `pro-icon-provider` is optional and carries only package imports, never
    copied Pro SVG data or license keys. The default `icon-context` remains usable with the
    free Stroke Rounded package alone.

### Code Snippets

- Define as `const` string literals at the top of the file, before the component
- Use simplified import paths in snippets (e.g., `from "./components"`) since these are display-only
- Show only the relevant JSX, not full boilerplate
- Each snippet should be self-contained and copy-pasteable

### Sections

Every doc page must include these sections (in order):

1. **Feature sections** - One `<DocSection>` per distinct feature or variant group. Each wraps a `<ComponentPreview>` with:
   - `code` prop: the matching code snippet string
   - `children`: the live interactive preview
2. **API Reference** - Final section with `<PropsTable>` listing all public props

Typical section breakdown by component type:
- **Components with variants**: Variants, Sizes, With Icons, States (loading/disabled)
- **Group components**: Basic, Controlled, With descriptions/icons
- **Layout components**: Basic, Responsive, Custom content

### Props Table (`PropDef`)

```ts
interface PropDef {
  name: string;        // prop name
  type: string;        // TypeScript type as a string (use quotes for union literals)
  default?: string;    // default value as string, omit if required
  description: string; // one sentence
}
```

- List every public prop
- For sub-components with their own props, add a separate `<PropsTable>` under a sub-heading
- Use exact TypeScript union syntax: `'"primary" | "secondary"'`

### Live Previews

- Wrap interactive demos in `<div className="flex flex-wrap items-center gap-2">` (or `gap-3`, `flex-col` as needed)
- Use `useState` for interactive examples (toggles, loading states, selections)
- Keep previews focused: show the feature the section is about, nothing more

---

## Naming Conventions

| Item | Format | Example |
|---|---|---|
| Component file | kebab-case | `radio-group.tsx` |
| Component export | PascalCase | `RadioGroup` |
| Registry name | kebab-case | `radio-group` |
| Doc page folder | kebab-case | `app/docs/radio-group/` |
| Doc page file | `page.tsx` | `app/docs/radio-group/page.tsx` |
| Doc component list slug | kebab-case | `radio-group` |
| Props type | PascalCase + Props | `RadioGroupProps` |

---

## Quick Reference: File Locations

```
packages/ui/src/components/
  component-name.tsx          ← canonical public component source/entry

packages/ui/src/system/
  utils.ts                    ← shared utilities
  springs.ts                  ← animation tokens
  font-weight.ts              ← font weight tokens
  shape-context.tsx           ← shape provider (no key shortcut — that's docs-only)
  icon-context.tsx            ← icon slots, free HugeIcons defaults, IconProvider override
  icon-catalog.ts             ← stable slot-to-HugeIcons mapping shared by every style
  pro-icon-provider.tsx       ← optional lazy-loaded HugeIcons Pro variants

  hooks/
    use-proximity-hover.ts    ← proximity hook

src/docs/
  ComponentPreview.tsx         ← preview + code tabs
  PropsTable.tsx               ← props documentation table
  DocPage.tsx                  ← DocPage + DocSection wrappers
  components.ts                ← component list for sidebar nav
  highlight.ts                 ← Shiki syntax highlighting
  icon-map.tsx                 ← docs-only multi-library icon map (Tabler/Phosphor/…)
  icon-playground.tsx          ← docs-only library switcher provider + "I" shortcut
  shape-shortcut.tsx           ← docs-only "R" radius shortcut

app/docs/
  layout.tsx                   ← sidebar layout (reads componentList)
  page.tsx                     ← index page (lists all components)
  <component-name>/page.tsx    ← individual doc pages

registry.json                  ← shadcn registry source of truth
public/r/<name>.json           ← generated registry JSONs
components.json                ← shadcn CLI config
```
