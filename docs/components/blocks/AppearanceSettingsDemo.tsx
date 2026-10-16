"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { AppearanceSettings, appearanceSettingsZhLabels, defaultAppearanceSettings } from "@zeron/blocks/appearance-settings-01";

export function AppearanceSettingsDemo() {
  const locale = useLocale();
  const [value, setValue] = useState(defaultAppearanceSettings);
  return <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="m-auto w-full max-w-4xl shrink-0">
      <AppearanceSettings value={value} onValueChange={setValue} labels={locale === "zh-CN" ? appearanceSettingsZhLabels : undefined} />
    </div>
  </div>;
}
