# Control composition and visual acceptance

Use this when replacing controls, adapting old component APIs or changing icon/label composition. Correct imports and working callbacks do not establish correct presentation. Preserve the installed component's structure, sizing, state feedback and accessible behavior, and verify the final rendered control in its real host.

## Button icons belong in their public slots

Inspect the installed Button API and rendered structure. In the current implementation, `children` becomes the content of a `button-label` span; `leadingIcon` and `trailingIcon` render beside that label in the internal flex row. Passing `<Icon />` and text together as children puts both inside the label, where a block-displayed SVG can stack above the text. Root `inline-flex` does not make descendants inside that label flex siblings, and root `whitespace-nowrap` does not fix this structural mistake.

For ordinary icon-and-text buttons, pass the verified icon component type to the supported icon prop, and keep children as the label:

```tsx
// AddIcon is a verified IconComponent from the project's icon provider.
<Button type="button" leadingIcon={AddIcon}>Create resource</Button>
```

Avoid this old-API forwarding pattern:

```tsx
<Button>{icon}{children}</Button>
```

Rules:

- Use `leadingIcon` / `trailingIcon` for ordinary labeled actions when the installed version supports them. They accept an icon component type in the current API, not an arbitrary React element such as `<AddIcon />`.
- Prefer migrating callers to that API. If a temporary adapter accepts an old `icon: ReactNode`, inspect its actual values and provide a narrowly typed project-side adapter that forwards the supported size/class/accessibility props, or record the unsupported shape. Do not cast arbitrary nodes to an icon component, drop props or retain a permanent generic old-API wrapper merely to avoid caller migration.
- For an icon-only action, use `iconOnly`, a single icon child and an accessible name. Do not put text into an icon-only button or use it to hide a label that no longer fits.
- For `asChild` links, keep one supported link child; put icons on the Button API and text inside the link. Inspect the final anchor and preserve link semantics. An extra wrapper or raw icon inside the link label can reproduce the same failure.
- Use the built-in `loading` behavior and verify width/height stability and repeat-action prevention. Test leading and trailing icons, disabled and link-button variants actually used in the migrated scope.
- Standard labeled actions should keep icon and text on one horizontal line, vertically aligned, with component-defined spacing and a readable label. An intentionally multiline/content-sized action needs an explicit product reason and a verified public component contract; it is not a repair for an accidentally stacked button.

Do not assume these props exist in every installed version or in unrelated controls. Check actual public types and component-specific guides before adapting.

## Standard labeled fields use Field

For a standard vertically stacked label and Input, Select or Textarea, use the installed `Field` and `FieldLabel` composition. Let Field own the spacing; keep the control's public size. Input renders the control surface and does not manage a sibling label.

```tsx
<Field>
  <FieldLabel>Session name</FieldLabel>
  <Input value={name} onChange={(event) => setName(event.target.value)} />
</Field>
```

Do not recreate this with a native inline `label` and `space-y-*`: the label can have a computed vertical margin without that margin separating the lines. Do not compensate with Input margins, padding or height overrides. Check the installed Field guide for its default gap and label treatment. Search/toolbars with an accessible name but no visible label, and checkbox/radio rows, retain their own documented composition.

In each affected dialog or form, measure the actual label-to-control gap and control height, and verify that clicking the label focuses the control. A passing typecheck or DOM test does not establish spacing.

### Keep multiple controls out of a shared Field context

A Field owns the label/identity of one logical control, not a whole row. An Input and Slider remain separate focus targets even when they edit the same value. Sharing one Field can give them the same generated ID. Give each independent field its own Field, arrange fields with FieldGroup, and name related groups with Fieldset / FieldsetLegend. Composites such as Slider retain their own public labeling API outside the Input's Field. A single InputGroup input with icons or action buttons can still be one field; do not split decorations into artificial fields.

Field spacing applies to its layout children. Keep the standard label and control/InputGroup in separate layout children rather than nesting both inside a div and assuming an outer gap reaches them. For controls that do not register with Field, connect the visible FieldLabel to the documented target id explicitly; use instance-safe IDs when composing repeated rows. Do not introduce a local span named FieldLabel or use a control label as a multi-field heading.

Verify unique control IDs and accessible names with the real controls mounted together, including repeated instances and open overlays. Check label focus, value synchronization, validation and disabled behavior. A mocked Slider cannot detect duplicate IDs introduced by its real Field integration. Retain legitimate compact sizes, accessible search/toolbars and intentional inline editors; do not wrap every Input in a vertical Field mechanically.

## Zeron owns migrated control and icon geometry

An old icon's explicit `size={24}`, `width`/`height`, `strokeWidth`, `style` or `w-*`/`h-*`/`size-*` classes are implementation details, not business behavior to preserve automatically. Remove overrides whose only purpose is matching the old design, including hardcoded color/fill, margins, padding, line height, transforms and radii on the control or its icon. Start with the selected Zeron control size and its icon contract. Keep the action's meaning, icon identity when appropriate, accessible name and callback.

- For `leadingIcon` / `trailingIcon`, pass a compatible icon component that honors the slot's size, stroke and class props. A wrapper that hardcodes the old dimensions after spreading those props is not compliant. Adapt a custom icon through the documented provider/type contract; do not blindly forward legacy element props over Zeron's supplied values.
- For `iconOnly` and other child-based icon slots, inspect the installed component's actual sizing behavior for the chosen control size. Use its documented icon sizing or provider defaults; do not assume every size variant overrides the child, retain an old fixed size accidentally, or erase intrinsic SVG `viewBox`/path geometry needed for rendering.
- Map old control sizes to the appropriate Zeron public size for the task; do not recreate their pixel dimensions with `style` or CSS. A shared `size` prop name does not prove the two design systems have the same values or behavior.
- Remove obsolete icon/control classes at callers, and remove their CSS only after confirming no remaining in-scope or out-of-scope consumer needs it. Inspect prop-spread order, icon adapters, inherited styles and global SVG rules so an old override cannot silently return.
- Branding artwork, standalone illustrations, chart marks and other business visuals can require dimensions of their own. Retain such a value only with a recorded purpose and compatible public boundary, or an explicit user requirement; the mere presence of an old hardcoded value is not justification. Do not apply control-icon sizing rules indiscriminately to all SVGs.

Verify computed dimensions, stroke and color against the installed Zeron component at the selected size and state, rather than against the old screenshot. A control that looks like Zeron but still overrides its geometry or state styling without a justified public customization fails contract acceptance.

## Diagnose structure before adding CSS

1. Inspect the actual Button import, wrapper/adapter and final DOM. Determine whether the icon and label occupy the intended sibling slots or were nested together by children, a link or a compatibility wrapper.
2. Inspect computed styles on the root, content row, label and SVG, and the rules supplying them. Check display, flex direction/wrap, whitespace, sizing, alignment, line height, overflow and inherited gap. Look for old global `button`, `span`, `svg` rules and legacy wrapper classes.
3. Verify that the consumer actually loads the installed theme and generates the component's Tailwind utilities from its source paths. Missing utilities are an integration problem, not a reason to restyle each control.
4. Fix the callsite/adapter, conflicting old CSS or source/theme integration at its owner. Do not patch managed internals, add global `button svg` rules, reach into `data-slot` selectors, or add `!important` to disguise the defect. Putting `flex` on the root alone cannot repair incorrect inner composition.
5. Verify the enclosing toolbar/form can accommodate the control. Where space is limited, wrap/reflow the group of whole controls through the layout contract; do not squeeze one standard button into a vertical icon/text stack, shrink typography or truncate an essential action label just to pass a width check.

Apply the same responsibility-based review to Input/Select icons, trigger arrows, checkbox/radio labels, badges and loading indicators. Use each control's own slots and sizing APIs rather than copying Button-specific props into other components.

## Required browser acceptance

Inventory distinct control compositions and shared-adapter callers in scope, including toolbar, table action, form footer, dialog, drawer and link-button locations. Review every affected page/state containing them, using representative controls for each composition and caller-specific constraints. Do not claim coverage from one unrelated demo screenshot.

- Verify narrow and wide layouts, long supported-language labels and constrained containers; open relevant overlays and tabs so hidden controls are actually inspected.
- For standard icon/text buttons, inspect computed layout and visible icon/text bounds: they must share a row, align vertically, retain expected spacing and remain within the control. An SVG found inside the label is a diagnostic to investigate, not by itself a universal failure rule for all custom compositions.
- Inspect normal, hover, keyboard focus, disabled and loading states where supported. Check focus visibility, stable geometry, no clipping/overlap and readable colors in the product's supported themes. Screenshots of only the default state do not cover these states.
- Check click/keyboard actions and accessible names separately from geometry. A DOM-only test environment cannot prove computed layout; browser measurements or visual comparison are required for layout claims.
- When browser automation is available, assert actual geometry for the affected standard compositions (for example, vertical alignment and non-overlapping icon/label bounds), using suitable tolerances for fonts and zoom. Keep intentional multiline actions distinct. Do not replace this with a regex that only checks for `leadingIcon`.

Any observed unintended stack, wrap, overflow, overlap, missing state feedback or broken size/alignment fails the relevant contract/browser check. Repair and recheck the affected callers before declaring them complete. If the browser or a required state is unavailable, record it as unchecked and report partial verification; do not substitute build success or an agent's assurance that the styles look correct.
