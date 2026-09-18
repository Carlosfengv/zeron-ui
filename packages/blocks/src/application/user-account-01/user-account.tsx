"use client";

import { useRef, useState, type ReactNode } from "react";
import { SidebarAccountMenu, type SidebarAccountMenuProps, type SidebarAccountMenuSection } from "@zeron/ui/sidebar-account-menu";
import { useIcon } from "@zeron/ui/system/icon-context";
export type UserAccountTheme = "system" | "light" | "dark";

export interface UserAccountLabels {
  theme: string;
  light: string;
  dark: string;
  system: string;
  language: string;
  settings: string;
  notifications: string;
  signOut: string;
  working: string;
  actionError: string;
}

export interface UserAccountProps {
  user: { name: string; email?: string; avatar?: ReactNode };
  theme?: UserAccountTheme;
  onThemeChange?: (theme: UserAccountTheme) => void | Promise<void>;
  locale?: string;
  localeOptions?: readonly { value: string; label: string }[];
  onLocaleChange?: (locale: string) => void | Promise<void>;
  onOpenSettings?: () => void;
  onSignOut?: () => void | Promise<void>;
  /** Optional application-owned notification action; the block does not supply a notification panel. */
  notifications?: { unreadCount: number; onOpen: () => void };
  extraSections?: SidebarAccountMenuSection[];
  /** External pending/error state can be shared by multiple account entrances. */
  pendingAction?: string | null;
  error?: string | null;
  labels?: Partial<UserAccountLabels>;
  className?: string;
  menuSide?: SidebarAccountMenuProps["menuSide"];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const defaultLabels: UserAccountLabels = {
  theme: "主题", light: "浅色", dark: "深色", system: "跟随系统", language: "语言",
  settings: "个人设置", notifications: "通知", signOut: "退出登录", working: "处理中…",
  actionError: "操作失败，请重试。",
};

/** Controlled account preferences and application actions; no auth, storage or routing assumptions. */
export function UserAccount({ user, theme, onThemeChange, locale, localeOptions, onLocaleChange, onOpenSettings, onSignOut, notifications, extraSections = [], pendingAction, error, labels, className, menuSide, open, onOpenChange }: UserAccountProps) {
  const copy = { ...defaultLabels, ...labels };
  const [localPending, setLocalPending] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const busy = Boolean(pendingAction || localPending);
  const ThemeIcon = useIcon("sun");
  const LanguageIcon = useIcon("globe");
  const SettingsIcon = useIcon("settings");
  const BellIcon = useIcon("bell");
  const MoreIcon = useIcon("ellipsis");
  const ChevronRight = useIcon("chevron-right");
  const run = async (action: string, callback: () => void | Promise<void>) => {
    if (inFlight.current || pendingAction) return;
    inFlight.current = true;
    setLocalPending(action);
    setLocalError(null);
    try { await callback(); }
    catch { setLocalError(copy.actionError); }
    finally { inFlight.current = false; setLocalPending(null); }
  };
  const preferences: SidebarAccountMenuSection = { items: [] };
  if (theme && onThemeChange) preferences.items.push({
    id: "theme", label: copy.theme, icon: ThemeIcon, disabled: busy,
    trailing: <ChevronRight aria-hidden className="size-4" />,
    submenu: { value: theme, options: [
      { value: "system", label: copy.system }, { value: "light", label: copy.light }, { value: "dark", label: copy.dark },
    ], onValueChange: (value) => { if (value === "system" || value === "light" || value === "dark") void run("theme", () => onThemeChange(value)); } },
  });
  if (locale && localeOptions?.length && onLocaleChange) preferences.items.push({
    id: "language", label: copy.language, icon: LanguageIcon, disabled: busy,
    trailing: <ChevronRight aria-hidden className="size-4" />,
    submenu: { value: locale, options: [...localeOptions], onValueChange: (value) => { void run("locale", () => onLocaleChange(value)); } },
  });
  const destinations: SidebarAccountMenuSection = { items: [] };
  if (notifications) destinations.items.push({
    id: "notifications", label: copy.notifications, icon: BellIcon, onSelect: notifications.onOpen,
    trailing: notifications.unreadCount > 0 ? <span className="text-label tabular-nums text-fg-brand">{notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}</span> : undefined,
  });
  if (onOpenSettings) destinations.items.push({ id: "settings", label: copy.settings, icon: SettingsIcon, onSelect: onOpenSettings });
  const sections = [preferences, destinations, ...extraSections];
  if (onSignOut) sections.push({ items: [{ id: "sign-out", label: copy.signOut, disabled: busy, closeOnClick: false, onSelect: () => { void run("sign-out", onSignOut); } }] });
  const visibleSections = sections.filter((section) => section.items.length).map((section) => ({
    ...section, items: section.items.map((item) => ({ ...item, disabled: busy || item.disabled })),
  }));
  return <div className="min-w-0" aria-busy={busy}>
    <SidebarAccountMenu primary={user.name} description={user.email} avatar={user.avatar} sections={visibleSections} className={className} menuSide={menuSide} open={open} onOpenChange={onOpenChange} triggerTrailing={<MoreIcon aria-hidden className="size-4" />} />
    {busy && <p role="status" className="px-2 py-1 text-label text-fg-muted">{copy.working}</p>}
    {(error || localError) && <p role="alert" className="px-2 py-1 text-label text-fg-danger">{error || localError}</p>}
  </div>;
}
