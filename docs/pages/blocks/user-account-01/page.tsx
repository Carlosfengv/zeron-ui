"use client";

import { useTranslations } from "next-intl";
import { UserAccountDemo } from "@docs/components/blocks/AccountBlocksDemo";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";

const code = `<UserAccount
  user={{ name: user.name, email: user.email }}
  theme={theme} onThemeChange={setTheme}
  locale={locale} localeOptions={supportedLocales} onLocaleChange={changeLocale}
  onSignOut={signOut}
  extraSections={[{ items: [
    { id: "notifications", label: "通知", closeOnClick: false },
    { id: "settings", label: "个人设置", closeOnClick: false },
  ] }]}
/>`;

export default function UserAccountBlockDoc() {
  const t = useTranslations("userAccountBlock");
  return <BlockDetailPage slug="user-account-01" registryName="user-account-01" title={t("title")} description={t("description")} code={code} preview={<UserAccountDemo />}>
    <BlockDetailSection title={t("integrationTitle")}><p className="text-body text-fg-muted">{t("integrationBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("statesTitle")}><p className="text-body text-fg-muted">{t("statesBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
