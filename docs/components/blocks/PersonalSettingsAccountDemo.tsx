"use client";

import { useState } from "react";
import { UserAccount, type UserAccountProps } from "@zeron/blocks/user-account-01";
import {
  PersonalSettings,
  personalSettingsDemoData,
  personalSettingsDefaultPreferences,
} from "@zeron/blocks/personal-settings-01";

/** Loaded only for settings previews; account covers do not need the settings workspace. */
export default function PersonalSettingsAccountDemo({ account }: { account: UserAccountProps }) {
  const [preferences, setPreferences] = useState(personalSettingsDefaultPreferences);

  return (
    <PersonalSettings
      account={<UserAccount {...account} menuSide="bottom" />}
      defaultView="profile"
      data={{
        ...personalSettingsDemoData,
        profile: {
          ...personalSettingsDemoData.profile,
          displayName: account.user.name,
          email: account.user.email ?? "",
          avatarLabel: account.user.name.slice(0, 1),
        },
        preferences: {
          ...preferences,
          theme: account.theme ?? preferences.theme,
          language: account.locale ?? preferences.language,
        },
      }}
      localeOptions={account.localeOptions}
      actions={{
        onPreferencesChange: async (next) => {
          setPreferences(next);
          if (next.theme !== account.theme && (next.theme === "light" || next.theme === "dark" || next.theme === "system")) {
            await account.onThemeChange?.(next.theme);
          }
          if (next.language !== account.locale) await account.onLocaleChange?.(next.language);
        },
      }}
    />
  );
}
