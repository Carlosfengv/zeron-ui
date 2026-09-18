"use client";

import { lazy, Suspense, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { UserAccount, type UserAccountProps } from "@zeron/blocks/user-account-01";
import type { ZaiopsOperationsProps } from "@zeron/blocks/zaiops-operations-01";
import { useIcon } from "@zeron/ui/system/icon-context";
import { Button } from "@zeron/ui/button";
import { useThemeContext } from "@zeron/ui/system/theme-context";
import { internalPathname, localizePathname } from "@docs/components/shell/site/locale-path";

const localeOptions = [{ value: "zh-CN", label: "简体中文" }, { value: "en", label: "English" }];
const PersonalSettingsAccountDemo = lazy(() => import("./PersonalSettingsAccountDemo"));
const ZaiopsOperations = lazy(() => import("@zeron/blocks/zaiops-operations-01").then((module) => ({ default: module.ZaiopsOperations })));

function AccountBlocksDemo({ mode, className, centered = true }: { mode: "account" | "operations" | "settings"; className?: string; centered?: boolean }) {
  const { theme, setTheme } = useThemeContext();
  const locale = useLocale();
  const english = locale === "en";
  const pathname = usePathname();
  const router = useRouter();
  const [signedOut, setSignedOut] = useState(false);
  const BellIcon = useIcon("bell");
  const SettingsIcon = useIcon("settings");
  const changeLocale = (next: string) => {
    const target = localizePathname(internalPathname(pathname), next === "en" ? "/en" : "");
    router.replace(`${target}${window.location.search}${window.location.hash}`);
  };
  const account: UserAccountProps = {
    user: { name: "Carlos", email: "carlos@example.com" }, theme, onThemeChange: setTheme,
    locale, localeOptions, onLocaleChange: changeLocale,
    onSignOut: () => setSignedOut(true),
    extraSections: [{ items: [
      { id: "notifications", label: english ? "Notifications" : "通知", icon: BellIcon, closeOnClick: false, trailing: <span className="text-label tabular-nums text-fg-brand">1</span> },
      { id: "settings", label: english ? "Personal settings" : "个人设置", icon: SettingsIcon, closeOnClick: false },
    ] }],
    labels: english ? { theme: "Appearance", light: "Light", dark: "Dark", system: "System", language: "Language", settings: "Personal settings", notifications: "Notifications", signOut: "Sign out", working: "Working…", actionError: "Could not complete the action. Try again." } : undefined,
  };
  if (signedOut) return <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-4"><p role="status" className="text-body text-fg-muted">{english ? "The demo session has ended. No real account was signed out." : "演示会话已退出，未操作真实登录账号。"}</p><Button onClick={() => setSignedOut(false)} variant="secondary">{english ? "Restart demo" : "重新体验"}</Button></div>;
  if (mode === "account") {
    return <div className={centered ? "flex h-full w-full flex-1 items-center justify-center" : "w-full"}><div className="w-64 max-w-full"><UserAccount {...account} /></div></div>;
  }
  return (
    <Suspense fallback={<p role="status" className="p-4 text-body text-fg-muted">{english ? "Loading preview…" : "正在加载预览…"}</p>}>
      {mode === "operations"
        ? <ZaiopsOperations account={account} className={className} />
        : <PersonalSettingsAccountDemo account={account} />}
    </Suspense>
  );
}

export function UserAccountDemo({ centered = true }: { centered?: boolean }) { return <AccountBlocksDemo mode="account" centered={centered} />; }
export function PersonalSettingsDemo() { return <AccountBlocksDemo mode="settings" />; }
export function ZaiopsOperationsDemo({ className }: Pick<ZaiopsOperationsProps, "className">) { return <AccountBlocksDemo mode="operations" className={className} />; }
