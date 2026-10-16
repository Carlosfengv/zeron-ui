"use client";

import { useId, type ReactNode } from "react";
import { badgeColors } from "@zeron/ui/badge-colors";
import { ColorSwatch } from "@zeron/ui/color-picker";
import { Container, ContainerBody, ContainerHeader } from "@zeron/ui/container";
import { RadioGroup, RadioGroupItem } from "@zeron/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Tabs, TabsList, TabItem } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { appearanceSettingsEnglishLabels } from "./appearance-settings-labels";
import type {
  AppearanceAccent,
  AppearanceDensity,
  AppearanceSettingsProps,
  AppearanceSettingsValue,
  AppearanceTheme,
} from "./appearance-settings-types";

const accentColors: Record<AppearanceAccent, string> = {
  brand: "var(--brand)",
  blue: badgeColors.blue,
  violet: badgeColors.violet,
  teal: badgeColors.teal,
  rose: badgeColors.rose,
  gray: badgeColors.gray,
};
const accents: readonly AppearanceAccent[] = ["brand", "blue", "violet", "teal", "rose", "gray"];

function ThemePreviewPane({ mode, accent }: { mode: "light" | "dark"; accent: AppearanceAccent }) {
  const accentStyle = { backgroundColor: accentColors[accent] };
  return (
    <div className={cn("flex min-w-0 flex-1", mode)}>
      <div className="flex w-3/10 flex-col gap-1.5 bg-surface-raised p-2.5 sm:p-3">
        <div className="h-1.5 w-4/5 rounded-full bg-fg-default/10" />
        <div className="h-1.5 w-3/5 rounded-full" style={accentStyle} />
        <div className="h-1.5 w-full rounded-full bg-fg-default/10" />
        <div className="h-1.5 w-2/3 rounded-full bg-fg-default/10" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 bg-surface-base p-3 sm:p-4">
        <div className="h-2 w-2/5 rounded-full bg-fg-default" />
        <div className="h-1.5 w-full rounded-full bg-fg-default/10" />
        <div className="h-1.5 w-4/5 rounded-full bg-fg-default/10" />
        <div className="mt-1 h-3.5 w-1/3 rounded" style={accentStyle} />
      </div>
    </div>
  );
}

/** Decorative UI only; selecting a preview never changes the host's theme. */
function ThemePreview({ theme, accent }: { theme: AppearanceTheme; accent: AppearanceAccent }) {
  return (
    <div aria-hidden="true" className="flex h-28 overflow-hidden rounded-lg border-hairline border-border sm:h-32">
      {theme === "system" ? (
        <>
          <ThemePreviewPane mode="light" accent={accent} />
          <ThemePreviewPane mode="dark" accent={accent} />
        </>
      ) : (
        <ThemePreviewPane mode={theme} accent={accent} />
      )}
    </div>
  );
}

function SettingRow({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4 border-b-hairline border-border py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div className="min-w-0 space-y-1">
      <h3 id={id} className="break-words text-body font-medium text-fg-default">{title}</h3>
      <p id={`${id}-description`} className="break-words text-body text-fg-muted">{description}</p>
    </div>
    <div className="min-w-0 max-w-full shrink-0">{children}</div>
  </div>;
}

interface DensityChoiceProps {
  id: string;
  value: AppearanceDensity;
  onValueChange: (value: AppearanceDensity) => void;
  disabled: boolean;
  comfortable: string;
  compact: string;
}

function DensityChoice({ id, value, onValueChange, disabled, comfortable, compact }: DensityChoiceProps) {
  return (
    <Tabs
      variant="pill"
      color="default"
      value={value}
      onValueChange={(next) => {
        if (next === "comfortable" || next === "compact") onValueChange(next);
      }}
    >
      <TabsList
        aria-labelledby={id}
        aria-describedby={`${id}-description`}
        className="max-w-full overflow-x-auto"
      >
        <TabItem value="comfortable" label={comfortable} disabled={disabled} />
        <TabItem value="compact" label={compact} disabled={disabled} />
      </TabsList>
    </Tabs>
  );
}

/** Embeddable, controlled appearance preferences; no global theme or storage side effects. */
export function AppearanceSettings({
  value,
  onValueChange,
  disabled = false,
  labels: suppliedLabels,
  className,
  ...props
}: AppearanceSettingsProps) {
  const id = useId();
  const labels = { ...appearanceSettingsEnglishLabels, ...suppliedLabels };
  const inactive = disabled || !onValueChange;
  const Sun = useIcon("sun");
  const Moon = useIcon("moon");
  const Monitor = useIcon("monitor");
  const themes = [
    { value: "light", Icon: Sun },
    { value: "dark", Icon: Moon },
    { value: "system", Icon: Monitor },
  ] as const;

  function update(patch: Partial<AppearanceSettingsValue>) {
    if (!inactive) onValueChange?.({ ...value, ...patch });
  }

  return <Container className={cn("w-full", className)} data-block="appearance-settings" {...props}>
    <ContainerHeader className="py-3">
      <div className="min-w-0 space-y-2">
        <h2 className="break-words text-title font-semibold text-fg-default">{labels.title}</h2>
        <p className="break-words text-body text-fg-muted">{labels.description}</p>
      </div>
    </ContainerHeader>
    <ContainerBody>
      <div className="space-y-8">
        <section aria-labelledby={`${id}-theme`} className="space-y-4">
          <h3 id={`${id}-theme`} className="border-b-hairline border-border pb-3 text-body font-semibold text-fg-default">{labels.theme}</h3>
          <RadioGroup value={value.theme} onValueChange={(theme) => {
            if (theme === "light" || theme === "dark" || theme === "system") update({ theme });
          }}
            disabled={inactive} aria-labelledby={`${id}-theme`} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themes.map(({ value: theme, Icon }) => <label key={theme}
              className={cn("flex min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-border bg-surface-floating p-3 transition-colors duration-fast motion-reduce:transition-none has-focus-visible:ring-2 has-focus-visible:ring-focus-ring has-focus-visible:ring-offset-2",
                value.theme === theme ? "border-brand ring-2 ring-brand/15" : "hover:bg-hover",
                inactive && "cursor-default opacity-50") }>
              <ThemePreview theme={theme} accent={value.accent} />
              <span className="flex items-center gap-2 text-body font-medium text-fg-default">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span id={`${id}-theme-${theme}`} className="min-w-0 flex-1 break-words">{labels[theme]}</span>
                <RadioGroupItem value={theme} aria-labelledby={`${id}-theme-${theme}`} />
              </span>
            </label>)}
          </RadioGroup>
        </section>

        <section aria-labelledby={`${id}-accent-section`}>
          <h3 id={`${id}-accent-section`} className="border-b-hairline border-border pb-3 text-body font-semibold text-fg-default">{labels.accentColor}</h3>
          <SettingRow id={`${id}-accent`} title={labels.accent} description={labels.accentDescription}>
            <div role="group" aria-labelledby={`${id}-accent`} aria-describedby={`${id}-accent-description`} className="flex flex-wrap gap-3 p-1">
              {accents.map((accent) => <ColorSwatch key={accent} color={accentColors[accent]} size={32}
                aria-label={labels.accentNames[accent]} aria-pressed={value.accent === accent}
                selected={value.accent === accent} aria-disabled={inactive || undefined} tabIndex={inactive ? -1 : 0}
                className="focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50"
                onClick={() => update({ accent })} />)}
            </div>
          </SettingRow>
        </section>

        <section aria-labelledby={`${id}-density`}>
          <h3 id={`${id}-density`} className="border-b-hairline border-border pb-3 text-body font-semibold text-fg-default">{labels.density}</h3>
          <SettingRow id={`${id}-sidebar`} title={labels.sidebarDensity} description={labels.sidebarDescription}>
            <DensityChoice id={`${id}-sidebar`} value={value.sidebarDensity} onValueChange={(sidebarDensity) => update({ sidebarDensity })}
              disabled={inactive} comfortable={labels.comfortable} compact={labels.compact} />
          </SettingRow>
          <SettingRow id={`${id}-task`} title={labels.taskDisplay} description={labels.taskDescription}>
            <DensityChoice id={`${id}-task`} value={value.taskDensity} onValueChange={(taskDensity) => update({ taskDensity })}
              disabled={inactive} comfortable={labels.comfortable} compact={labels.compact} />
          </SettingRow>
          <SettingRow id={`${id}-motion`} title={labels.motion} description={labels.motionDescription}>
            <div className="w-56 max-w-full">
              <Select value={value.motion} onValueChange={(motion) => {
                if (motion === "system" || motion === "reduce" || motion === "full") update({ motion });
              }} disabled={inactive}>
                <SelectTrigger aria-labelledby={`${id}-motion`} aria-describedby={`${id}-motion-description`} />
                <SelectContent>
                  <SelectItem value="system">{labels.followSystem}</SelectItem>
                  <SelectItem value="reduce">{labels.reduceMotion}</SelectItem>
                  <SelectItem value="full">{labels.fullMotion}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingRow>
        </section>
      </div>
    </ContainerBody>
  </Container>;
}
