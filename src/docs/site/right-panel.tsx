"use client";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useShapeContext,
  type ShapeVariant,
} from "@/lib/shape-context";
import { useThemeContext, type Theme } from "@/lib/theme-context";
import { useIcon, useIconContext, type IconVariant } from "@/lib/icon-context";
import { SurfaceProvider } from "@/lib/surface-context";
import { RightRailTarget } from "@/docs/right-rail";
import { Tooltip } from "@/components/ui/tooltip";
import { ColorPickerPopover } from "@/components/ui/color-picker";
import { rgbToHex, useBrandColor } from "@/docs/brand-playground";

/** The inner settings content — reused in the right column and mobile drawer. */
export function SettingsContent({ tooltipSide = "left" }: { tooltipSide?: "left" | "right" | "top" | "bottom" }) {
  const { theme, setTheme } = useThemeContext();
  const { shape, setShape } = useShapeContext();
  const { variant: iconVariant, availableVariants, isVariantLoading, setVariant: setIconVariant } = useIconContext();
  const { brandColor, setBrandColor } = useBrandColor();

  const MonitorIcon = useIcon("monitor");
  const SunIcon = useIcon("sun");
  const MoonIcon = useIcon("moon");
  const RectHorizIcon = useIcon("rectangle-horizontal");
  const CircleIcon = useIcon("circle");
  const PaintbrushIcon = useIcon("paintbrush");

  const themeOptions = [
    { label: "System", value: "system" as Theme, icon: MonitorIcon },
    { label: "Light", value: "light" as Theme, icon: SunIcon },
    { label: "Dark", value: "dark" as Theme, icon: MoonIcon },
  ];

  const shapeOptions = [
    { label: "Rounded", value: "rounded" as ShapeVariant, icon: RectHorizIcon },
    { label: "Pill", value: "pill" as ShapeVariant, icon: CircleIcon },
  ];

  const allIconStyleOptions: { label: string; value: IconVariant }[] = [
    { label: "Stroke Rounded", value: "stroke-rounded" },
    { label: "Stroke Standard", value: "stroke-standard" },
    { label: "Bulk Rounded", value: "bulk-rounded" },
    { label: "Duotone Rounded", value: "duotone-rounded" },
  ];
  const iconStyleOptions = allIconStyleOptions.filter((option) => availableVariants.includes(option.value));

  return (
    <div className="flex flex-col gap-2">
      {/* Theme and radius selects */}
      <div className="flex flex-col gap-1.5 py-3">
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">T</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Theme</span>
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger
                variant="borderless"
                size="md"
                className="min-w-0 w-auto"
                icon={themeOptions.find((o) => o.value === theme)?.icon}
              />
              <SelectContent>
                {themeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Brand</span>
          <ColorPickerPopover
            value={brandColor}
            format="hex"
            onValueChange={(_value, parsed) =>
              setBrandColor(rgbToHex({ r: parsed.r, g: parsed.g, b: parsed.b }))
            }
            swatches={["#0060D2", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#16A34A"]}
            triggerClassName="h-control-sm min-w-0 px-1.5 border-transparent hover:bg-hover"
          />
        </div>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">R</kbd>&ensp; to toggle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Radius</span>
            <Select value={shape} onValueChange={(v) => setShape(v as ShapeVariant)}>
              <SelectTrigger
                variant="borderless"
                size="md"
                className="min-w-0 w-auto"
                icon={shapeOptions.find((o) => o.value === shape)?.icon}
              />
              <SelectContent>
                {shapeOptions.map((o, i) => (
                  <SelectItem key={o.value} value={o.value} index={i} icon={o.icon}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
        <Tooltip content={<span>Press &ensp;<kbd className="font-mono opacity-50">I</kbd>&ensp; to cycle</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">Icons</span>
            <Select
              value={iconVariant}
              onValueChange={(value) => setIconVariant(value as IconVariant)}
              disabled={isVariantLoading}
            >
              <SelectTrigger
                variant="borderless"
                size="md"
                className="min-w-0 w-auto"
                icon={PaintbrushIcon}
              />
              <SelectContent>
                {iconStyleOptions.map((option, index) => (
                  <SelectItem key={option.value} value={option.value} index={index} icon={PaintbrushIcon}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Tooltip>
      </div>

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
export function RightPanel() {
  return (
    // max-xl:fixed — during the xl-fade-block fade-out the panel keeps
    // display:block for the transition (allow-discrete), which would hold its
    // 264px of flex space and make the content reflow a second time when
    // display finally flips to none. Fixed positioning below xl removes it
    // from flow at the breakpoint (single reflow) while it fades in place:
    // top-0/right-0 + mt-4/mr-2 land on the same 8px/16px inset as the pinned
    // sticky state. The wrapper carries the fade/sticky so pages can stack a
    // second panel (RightRailTarget) below the settings.
    // xl-fade-block sets display:block at ≥xl, so the flex column lives on an
    // inner wrapper (else it would override `flex` and drop the gap).
    <div className="shrink-0 w-64 sticky top-4 self-start mt-4 mr-2 xl-fade-block max-xl:fixed max-xl:top-0 max-xl:right-0 max-xl:z-40 max-xl:pointer-events-none">
      <div className="flex flex-col gap-3">
        <aside className="p-4 rounded-lg bg-muted">
          <SurfaceProvider role="raised">
            <div className="pl-1 pt-2 pb-2">
              <h2
                className="text-[16px] text-foreground leading-none font-semibold"
              >
                Make them yours
              </h2>
            </div>
            <SettingsContent tooltipSide="left" />
          </SurfaceProvider>
        </aside>

        {/* Page-owned slot — e.g. the Card doc's Playground controls. */}
        <RightRailTarget />
      </div>
    </div>
  );
}
