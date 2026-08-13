"use client";

import { ColorPicker, ColorPickerPopover } from "@zeron/ui/color-picker";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";
import {
  ControlledColorPickerExample,
  RemovableColorPickerExample,
} from "./color-picker-examples";

const basicCode = `import { ColorPicker } from "./components";

<ColorPicker defaultValue="#6B97FF" />`;

const popoverCode = `import { ColorPickerPopover } from "./components";

<ColorPickerPopover
  triggerLabel="Fill"
  defaultValue="#6B97FF"
/>`;

const swatchesCode = `import { ColorPicker } from "./components";

<ColorPicker
  defaultValue="#6B97FF"
  swatches={[
    "#000000",
    "#FFFFFF",
    "#FF3B30",
    "#F0F0F0",
    "#E5E5E5",
    "#D0D0D0",
    "rgba(0,0,0,0.5)",
  ]}
/>`;

const oklchCode = `import { ColorPicker } from "./components";

<ColorPicker defaultFormat="oklch" defaultValue="#6B97FF" />`;

const controlledCode = `import { useState } from "react";
import { ColorPicker } from "./components";

const [color, setColor] = useState("#6B97FF");

<ColorPicker
  value={color}
  onValueChange={(v) => setColor(v)}
/>
<p>Current: {color}</p>`;

const removeCode = `import { useState } from "react";
import { ColorPickerPopover } from "./components";

const [color, setColor] = useState<string | null>("#6B97FF");

color
  ? <ColorPickerPopover
      triggerLabel="Fill"
      triggerShowRemove
      onTriggerRemove={() => setColor(null)}
      value={color}
      onValueChange={(v) => setColor(v)}
    />
  : <button onClick={() => setColor("#6B97FF")}>+ Add fill</button>`;

const colorPickerProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled color value (any of the supported formats)." },
  { name: "defaultValue", type: "string", default: '"#6B97FF"', description: "Initial color when uncontrolled." },
  { name: "onValueChange", type: "(value, parsed) => void", description: "Fired on every change. Receives the formatted string and a parsed color object with all formats." },
  { name: "format", type: '"hex" | "rgb" | "hsl" | "oklch"', description: "Controlled format selection." },
  { name: "defaultFormat", type: '"hex" | "rgb" | "hsl" | "oklch"', default: '"hex"', description: "Initial format when uncontrolled." },
  { name: "onFormatChange", type: "(format) => void", description: "Fired when the user switches format." },
  { name: "swatches", type: "string[]", description: "Optional preset swatches. When omitted, the strip is hidden." },
  { name: "hideEyedropper", type: "boolean", default: "false", description: "Force-hide the eyedropper button (it is automatically hidden in unsupported browsers)." },
];

const popoverProps: PropDef[] = [
  { name: "triggerLabel", type: "string", description: "Optional label rendered alongside the color tile." },
  { name: "triggerLabelPosition", type: '"left" | "right"', default: '"left"', description: "Position of the label relative to the color tile." },
  { name: "triggerShowValue", type: "boolean", default: "true", description: "Show the hex value (without alpha) next to the tile." },
  { name: "triggerShowRemove", type: "boolean", default: "false", description: "Render an X button on the trigger." },
  { name: "onTriggerRemove", type: "() => void", description: "Fired when the X button is clicked." },
  { name: "triggerClassName", type: "string", description: "Custom classes on the trigger button." },
  { name: "...ColorPickerProps", type: "ColorPickerProps", description: "All ColorPicker props are forwarded to the panel." },
];

export default function ColorPickerDoc() {
  const t = useTranslations("colorPicker");
  const localizedColorPickerProps = colorPickerProps.map((prop) => ({ ...prop, description: t(prop.name) }));
  const localizedPopoverProps = popoverProps.map((prop) => ({
    ...prop,
    description: t(prop.name === "...ColorPickerProps" ? "forwardedProps" : prop.name),
  }));
  return (
    <DocPage
      title="Color Picker"
      slug="color-picker"
      description="Color picker with HEX, RGB, HSL, and OKLCH formats, alpha channel, optional swatches, and an eyedropper. Available as an inline panel or popover."
    >
      <DocSection title={t("default")}>
        <ComponentPreview code={basicCode}>
          <ColorPicker defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("popover")}>
        <ComponentPreview code={popoverCode}>
          <ColorPickerPopover triggerLabel="Fill" defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("withSwatches")}>
        <ComponentPreview code={swatchesCode}>
          <ColorPicker
            defaultValue="#6B97FF"
            swatches={[
              "#000000",
              "#FFFFFF",
              "#FF3B30",
              "#F0F0F0",
              "#E5E5E5",
              "#D0D0D0",
              "rgba(0,0,0,0.5)",
            ]}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("oklchFormat")}>
        <ComponentPreview code={oklchCode}>
          <ColorPicker defaultFormat="oklch" defaultValue="#6B97FF" />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("controlled")}>
        <ComponentPreview code={controlledCode}>
          <ControlledColorPickerExample />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("removableTrigger")}>
        <ComponentPreview code={removeCode}>
          <RemovableColorPickerExample />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("eyedropperSupport")}>
        <p className="text-body text-fg-muted">
          {t("eyedropperBody")}
        </p>
      </DocSection>

      <DocSection title={t("colorPickerProps")}>
        <PropsTable props={localizedColorPickerProps} />
      </DocSection>

      <DocSection title={t("popoverProps")}>
        <PropsTable props={localizedPopoverProps} />
      </DocSection>
    </DocPage>
  );
}
