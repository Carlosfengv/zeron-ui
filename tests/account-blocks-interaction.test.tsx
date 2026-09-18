// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserAccount } from "../packages/blocks/src/application/user-account-01/user-account";
import { PersonalSettings } from "../packages/blocks/src/application/personal-settings-01/personal-settings";
import { SidebarAccountMenu } from "../packages/ui/src/components/sidebar-account-menu";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("account actions", () => {
  it("keeps static notification and settings items open without selecting an action", () => {
    render(<UserAccount user={{ name: "Carlos" }} extraSections={[{ items: [
      { id: "notifications", label: "通知", closeOnClick: false },
      { id: "settings", label: "个人设置", closeOnClick: false },
    ] }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Carlos/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: "通知" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "个人设置" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables choices when a submenu becomes unavailable while open", async () => {
    const onValueChange = vi.fn();
    const sections = (disabled: boolean) => [{ items: [{
      id: "theme", label: "Theme", disabled,
      submenu: { value: "light", options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }], onValueChange },
    }] }];
    const { rerender } = render(<SidebarAccountMenu open primary="Carlos" description="Account" sections={sections(false)} />);
    fireEvent.click(screen.getByRole("menuitem", { name: "Theme" }));
    await screen.findByRole("menuitemradio", { name: "Dark" });
    rerender(<SidebarAccountMenu open primary="Carlos" description="Account" sections={sections(true)} />);
    const dark = screen.queryByRole("menuitemradio", { name: "Dark" });
    if (dark) {
      expect(dark.getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(dark);
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("respects locked settings navigation in the default account entrance", async () => {
    const onViewChange = vi.fn();
    render(<PersonalSettings lockedNavigation defaultView="keys" onViewChange={onViewChange} data={{ apiKeys: [] }} />);
    const trigger = document.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
    expect(trigger).not.toBeNull();
    fireEvent.click(trigger!);
    await waitFor(() => expect(screen.getByRole("menu")).toBeTruthy());
    expect(screen.queryByRole("menuitem", { name: "个人设置" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "偏好设置" })).toBeNull();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("hides unavailable actions and shows host-provided destinations and unread totals", () => {
    const onSettings = vi.fn();
    const onNotifications = vi.fn();
    render(<UserAccount open user={{ name: "Carlos" }} onOpenSettings={onSettings} notifications={{ unreadCount: 121, onOpen: onNotifications }} />);
    expect(screen.queryByRole("menuitem", { name: "退出登录" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "主题" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: /通知/ }));
    expect(onNotifications).toHaveBeenCalledOnce();
    expect(screen.getByText("99+")).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "个人设置" }));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it("prevents duplicate sign-out, reports failure and permits retry without clearing identity", async () => {
    let reject!: (error: Error) => void;
    const onSignOut = vi.fn(() => new Promise<void>((_, rejectPromise) => { reject = rejectPromise; }));
    render(<UserAccount open user={{ name: "Carlos" }} onSignOut={onSignOut} />);
    const signOut = screen.getByRole("menuitem", { name: "退出登录" });
    fireEvent.click(signOut);
    fireEvent.click(signOut);
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(signOut.getAttribute("aria-disabled")).toBe("true");
    await act(async () => { reject(new Error("Session invalidation failed")); });
    expect(screen.getByRole("alert").textContent).toContain("操作失败");
    expect(screen.getAllByText("Carlos").length).toBeGreaterThan(0);
    fireEvent.click(signOut);
    expect(onSignOut).toHaveBeenCalledTimes(2);
    await act(async () => { reject(new Error("Still unavailable")); });
  });

  it("disables all account entrances when the host operation is pending", () => {
    const onOpenSettings = vi.fn();
    render(<UserAccount open user={{ name: "Carlos" }} pendingAction="sign-out" theme="dark" onThemeChange={vi.fn()} onOpenSettings={onOpenSettings} />);
    const settings = screen.getByRole("menuitem", { name: "个人设置" });
    expect(settings.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(settings);
    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "主题" }).getAttribute("aria-disabled")).toBe("true");
  });
});
