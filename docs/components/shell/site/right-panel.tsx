"use client";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@zeron/ui/select";
import {
  useShapeContext,
  type ShapeVariant,
} from "@zeron/ui/system/shape-context";
import { useThemeContext, type Theme } from "@zeron/ui/system/theme-context";
import { useIcon, useIconContext, type IconVariant } from "@zeron/icons/context";
import { SurfaceProvider } from "@zeron/ui/system/surface-context";
import { RightRailTarget } from "@docs/components/shell/right-rail";
import { Tooltip } from "@zeron/ui/tooltip";
import { ColorPickerPopover } from "@zeron/ui/color-picker";
import { rgbToHex, useBrandColor } from "@docs/components/playground/brand-playground";
import { internalPathname, localizePathname } from "@docs/components/shell/site/locale-path";

/** The inner settings content — reused in the right column and mobile drawer. */
export function SettingsContent({
  tooltipSide = "left",
  localePrefix = "",
  showLanguage = false,
}: {
  tooltipSide?: "left" | "right" | "top" | "bottom";
  localePrefix?: string;
  showLanguage?: boolean;
}) {
  const t = useTranslations("settings");
  const pathname = usePathname();
  const router = useRouter();
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
    { label: t("system"), value: "system" as Theme, icon: MonitorIcon },
    { label: t("light"), value: "light" as Theme, icon: SunIcon },
    { label: t("dark"), value: "dark" as Theme, icon: MoonIcon },
  ];

  const shapeOptions = [
    { label: t("rounded"), value: "rounded" as ShapeVariant, icon: RectHorizIcon },
    { label: t("pill"), value: "pill" as ShapeVariant, icon: CircleIcon },
  ];

  const allIconStyleOptions: { label: string; value: IconVariant }[] = [
    { label: "Stroke Rounded", value: "stroke-rounded" },
    { label: "Stroke Standard", value: "stroke-standard" },
    { label: "Bulk Rounded", value: "bulk-rounded" },
    { label: "Duotone Rounded", value: "duotone-rounded" },
  ];
  const iconStyleOptions = allIconStyleOptions.filter((option) => availableVariants.includes(option.value));
  const selectedLocale = localePrefix ? "zh-CN" : "en";

  const changeLocale = (nextLocale: string) => {
    const target = localizePathname(internalPathname(pathname), nextLocale === "zh-CN" ? "/zh-cn" : "");
    const query = typeof window === "undefined" ? "" : window.location.search.slice(1);
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.replace(`${target}${query ? `?${query}` : ""}${hash}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5 py-3">
        <Tooltip content={<span>{t("pressToCycle", { key: "T" })}</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-label text-fg-muted">{t("theme")}</span>
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
            <span className="text-label text-fg-muted">{t("brand")}</span>
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
        <Tooltip content={<span>{t("pressToToggle", { key: "R" })}</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-label text-fg-muted">{t("radius")}</span>
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
        <Tooltip content={<span>{t("pressToCycle", { key: "I" })}</span>} side={tooltipSide}>
          <div className="flex items-center justify-between">
            <span className="text-label text-fg-muted">{t("icons")}</span>
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

      {showLanguage && (
        <div className="flex items-center justify-between py-3">
          <span className="text-label text-fg-muted">{t("language")}</span>
          <Select value={selectedLocale} onValueChange={changeLocale}>
            <SelectTrigger variant="borderless" size="md" className="min-w-0 w-auto" />
            <SelectContent>
              <SelectItem value="en" index={0}>{t("english")}</SelectItem>
              <SelectItem value="zh-CN" index={1}>{t("chinese")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

    </div>
  );
}

/** Desktop-only right column that mirrors the left sidebar styling. */
export function RightPanel({
  localePrefix = "",
  showLanguage = false,
}: {
  localePrefix?: string;
  showLanguage?: boolean;
}) {
  const t = useTranslations("settings");
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
        <aside className="rounded-control border-[0.5px] border-border-subtle bg-surface-floating p-4">
          <SurfaceProvider role="floating">
            <div className="pl-1 pt-2 pb-2">
              <h2
                className="text-title text-fg-default leading-none font-semibold"
              >
                {t("heading")}
              </h2>
            </div>
            <SettingsContent tooltipSide="left" localePrefix={localePrefix} showLanguage={showLanguage} />
          </SurfaceProvider>
        </aside>

        {/* Page-owned slot — e.g. the Card doc's Playground controls. */}
        <RightRailTarget />
      </div>
    </div>
  );
}
