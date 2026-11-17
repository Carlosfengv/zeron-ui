// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { defaultIcons, IconProvider, useIconContext, type IconVariant } from "@zeron/icons/context";
import { ThemeProvider, useThemeContext } from "@zeron/ui/system/theme-context";
import { SiteShortcuts } from "@docs/components/shell/site/site-shortcuts";

const variants = ["stroke-rounded", "stroke-standard", "bulk-rounded"] as const satisfies readonly IconVariant[];

function ThemeStatus() {
  const { theme } = useThemeContext();
  return <output aria-label="Theme">{theme}</output>;
}

function IconStatus() {
  const { variant } = useIconContext();
  return <output aria-label="Icon style">{variant}</output>;
}

beforeEach(() => window.localStorage.clear());
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("light", "dark", "transitioning");
});

it("does not consume D or alter theme in a standalone ThemeProvider", () => {
  const { getByLabelText } = render(<ThemeProvider defaultTheme="light"><ThemeStatus /></ThemeProvider>);

  expect(fireEvent.keyDown(document, { key: "d" })).toBe(true);
  expect(getByLabelText("Theme").textContent).toBe("light");
});

it("does not consume I or request a variant in a standalone IconProvider", () => {
  const loadVariant = vi.fn(async () => defaultIcons);
  const { getByLabelText } = render(
    <IconProvider availableVariants={variants} loadVariant={loadVariant}><IconStatus /></IconProvider>,
  );

  expect(fireEvent.keyDown(document, { key: "i" })).toBe(true);
  expect(loadVariant).not.toHaveBeenCalled();
  expect(getByLabelText("Icon style").textContent).toBe("stroke-rounded");
});

it("leaves I available with a single variant and cleans up the listener on unmount", () => {
  const { getByLabelText, unmount } = render(
    <ThemeProvider defaultTheme="light">
      <IconProvider><SiteShortcuts /><IconStatus /></IconProvider>
    </ThemeProvider>,
  );

  expect(fireEvent.keyDown(document.body, { key: "i" })).toBe(true);
  expect(getByLabelText("Icon style").textContent).toBe("stroke-rounded");
  unmount();
  expect(fireEvent.keyDown(document.body, { key: "d" })).toBe(true);
});

it("cycles exactly one icon style and yields to controls and modified events", async () => {
  const loadVariant = vi.fn(async () => defaultIcons);
  const { getByLabelText, getByRole } = render(
    <ThemeProvider defaultTheme="light">
      <IconProvider availableVariants={variants} loadVariant={loadVariant}>
        <SiteShortcuts />
        <ThemeStatus />
        <IconStatus />
        <button onKeyDown={(event) => event.preventDefault()}>Handled keys</button>
        {createPortal(
          <div role="menu"><button role="menuitem" aria-label="Menu item">Inbox</button></div>,
          document.body,
        )}
      </IconProvider>
    </ThemeProvider>,
  );

  for (const modifier of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { isComposing: true }, { repeat: true }]) {
    for (const key of ["i", "d"]) {
      expect(fireEvent.keyDown(document.body, { key, ...modifier })).toBe(true);
    }
  }
  for (const key of ["i", "d"]) {
    fireEvent.keyDown(getByRole("button", { name: "Handled keys" }), { key });
    expect(fireEvent.keyDown(getByLabelText("Menu item"), { key })).toBe(true);
  }
  expect(loadVariant).not.toHaveBeenCalled();
  expect(getByLabelText("Theme").textContent).toBe("light");

  expect(fireEvent.keyDown(document.body, { key: "I" })).toBe(false);
  await waitFor(() => expect(getByLabelText("Icon style").textContent).toBe("stroke-standard"));
  expect(loadVariant).toHaveBeenCalledExactlyOnceWith("stroke-standard");
});
