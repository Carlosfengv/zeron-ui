// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppearanceSettings, appearanceSettingsZhLabels, defaultAppearanceSettings } from "../packages/blocks/src/application/appearance-settings-01";

afterEach(cleanup);

describe("appearance preferences", () => {
  it("emits the complete next preference without changing controlled state", () => {
    const onValueChange = vi.fn();
    const value = { ...defaultAppearanceSettings, motion: "reduce" as const, taskDensity: "compact" as const };
    const { rerender } = render(<AppearanceSettings value={value} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Teal" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...value, accent: "teal" });
    expect(screen.getByRole("button", { name: "Theme color" }).getAttribute("aria-pressed")).toBe("true");
    const next = onValueChange.mock.calls[0][0];
    rerender(<AppearanceSettings value={next} onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Teal" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("combobox").textContent).toContain("Reduce motion");
  });

  it("keeps sidebar and task density independent", () => {
    const onValueChange = vi.fn();
    render(<AppearanceSettings value={defaultAppearanceSettings} onValueChange={onValueChange} />);
    const sidebar = within(screen.getByRole("tablist", { name: "Sidebar density" }));
    const tasks = within(screen.getByRole("tablist", { name: "Task display" }));
    fireEvent.click(sidebar.getByRole("tab", { name: "Compact" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaultAppearanceSettings, sidebarDensity: "compact" });
    fireEvent.click(tasks.getByRole("tab", { name: "Compact" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaultAppearanceSettings, taskDensity: "compact" });
  });

  it("emits theme changes while leaving the host theme and controlled value intact", () => {
    const onValueChange = vi.fn();
    const hostTheme = document.documentElement.className;
    render(<AppearanceSettings value={defaultAppearanceSettings} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaultAppearanceSettings, theme: "dark" });
    expect(screen.getByRole("radio", { name: "Light" }).getAttribute("aria-checked")).toBe("true");
    expect(document.documentElement.className).toBe(hostTheme);
    fireEvent.click(screen.getByRole("radio", { name: "System" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaultAppearanceSettings, theme: "system" });
  });

  it("emits motion changes from the menu and renders the host's updated value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<AppearanceSettings value={defaultAppearanceSettings} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("combobox", { name: "Motion" }));
    const reduceMotion = await screen.findByRole("option", { name: "Reduce motion" });
    fireEvent.focus(reduceMotion);
    fireEvent.click(reduceMotion);
    expect(onValueChange).toHaveBeenLastCalledWith({ ...defaultAppearanceSettings, motion: "reduce" });
    rerender(<AppearanceSettings value={{ ...defaultAppearanceSettings, motion: "reduce" }} onValueChange={onValueChange} />);
    expect(screen.getByRole("combobox", { name: "Motion" }).textContent).toContain("Reduce motion");
  });

  it("prevents changes when disabled or when no callback is supplied", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<AppearanceSettings value={defaultAppearanceSettings} disabled onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Rose" }));
    fireEvent.click(screen.getAllByRole("tab", { name: "Compact" })[0]);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox").hasAttribute("disabled")).toBe(true);
    rerender(<AppearanceSettings value={defaultAppearanceSettings} />);
    expect(screen.getByRole("button", { name: "Rose" }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getAllByRole("tab", { name: "Compact" })[0].getAttribute("aria-disabled")).toBe("true");
  });

  it("supports localized labels and independent accessible names for multiple blocks", () => {
    const { container } = render(<>
      <AppearanceSettings value={defaultAppearanceSettings} labels={appearanceSettingsZhLabels} />
      <AppearanceSettings value={defaultAppearanceSettings} />
    </>);
    expect(screen.getByRole("heading", { name: "外观" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "青绿" })).toBeTruthy();
    const labels = screen.getAllByRole("combobox").map((control) => control.getAttribute("aria-labelledby"));
    expect(new Set(labels).size).toBe(2);
    for (const label of labels) expect(container.querySelector(`[id="${label}"]`)).toBeTruthy();
  });
});
