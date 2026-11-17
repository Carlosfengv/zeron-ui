// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { defaultIcons, IconProvider, useIcon, useIconContext } from "@zeron/icons/context";
import { iconAliases } from "@zeron/icons/icon-catalog";
import { ProIconProvider } from "@zeron/icons/provider";
import { IconProvider as UIIconProvider, useIcon as useUIIcon } from "@zeron/ui/system/icon-context";
import { useDocIcon } from "@docs/icons/doc-icons";
import { navigationDocEntries } from "@docs/manifest";

const proImports = vi.hoisted(() => ({
  standard: vi.fn(),
  bulk: vi.fn(),
  duotone: vi.fn(),
}));

vi.mock("../packages/icons/src/icon-variants/stroke-standard", async () => {
  proImports.standard();
  return { strokeStandardIcons: (await import("@zeron/icons/context")).defaultIcons };
});
vi.mock("../packages/icons/src/icon-variants/bulk-rounded", async () => {
  proImports.bulk();
  return { bulkRoundedIcons: (await import("@zeron/icons/context")).defaultIcons };
});
vi.mock("../packages/icons/src/icon-variants/duotone-rounded", async () => {
  proImports.duotone();
  return { duotoneRoundedIcons: (await import("@zeron/icons/context")).defaultIcons };
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function LegacyInfo() {
  const Icon = useIcon("doc-info-item");
  return <Icon aria-label="Legacy slot" />;
}

function CurrentInfo() {
  const Icon = useUIIcon("info");
  return <Icon aria-label="Current slot" />;
}

const OldGlyph = ({ "aria-label": label }: React.SVGProps<SVGSVGElement>) => <svg aria-label={label} data-glyph="old" />;
const NewGlyph = ({ "aria-label": label }: React.SVGProps<SVGSVGElement>) => <svg aria-label={label} data-glyph="new" />;

it("resolves legacy names to the same free icons as their semantic slots", () => {
  expect(iconAliases["doc-input"]).toBe("text-input");
  expect(Object.keys(defaultIcons).filter((name) => name.startsWith("doc-")).sort())
    .toEqual(Object.keys(iconAliases).sort());
  for (const legacy of Object.keys(iconAliases) as (keyof typeof iconAliases)[]) {
    expect(defaultIcons[legacy]).toBe(defaultIcons[iconAliases[legacy]]);
  }
});

it.each([IconProvider, UIIconProvider])("shares override context across package entry points", (Provider) => {
  const { getByLabelText, rerender } = render(
    <Provider icons={{ "doc-info-item": OldGlyph }}><LegacyInfo /><CurrentInfo /></Provider>,
  );
  expect(getByLabelText("Legacy slot").getAttribute("data-glyph")).toBe("old");
  expect(getByLabelText("Current slot").getAttribute("data-glyph")).toBe("old");

  rerender(<Provider icons={{ "doc-info-item": OldGlyph, info: NewGlyph }}><LegacyInfo /><CurrentInfo /></Provider>);
  expect(getByLabelText("Legacy slot").getAttribute("data-glyph")).toBe("new");
  expect(getByLabelText("Current slot").getAttribute("data-glyph")).toBe("new");
});

function NavigationIcon({ icon }: { icon: (typeof navigationDocEntries)[number]["icon"] }) {
  const Icon = useDocIcon(icon);
  return <Icon aria-label={icon} />;
}

it("renders a doc-side icon for every navigation entry and keeps normal slot overrides", () => {
  const names = [...new Set(navigationDocEntries.map(({ icon }) => icon))];
  const { container, getByLabelText } = render(
    <IconProvider icons={{ file: NewGlyph, "doc-info-item": OldGlyph }}>
      {names.map((icon) => <NavigationIcon key={icon} icon={icon} />)}
    </IconProvider>,
  );
  expect(container.querySelectorAll("svg")).toHaveLength(names.length);
  expect(getByLabelText("file").getAttribute("data-glyph")).toBe("new");
  expect(getByLabelText("doc-info-item").hasAttribute("data-glyph")).toBe(false);
});

function VariantSwitch() {
  const { variant, setVariant } = useIconContext();
  return <button onClick={() => setVariant("bulk-rounded")}>{variant}</button>;
}

it("loads only the selected Pro style and preserves the aliases and overrides", async () => {
  const { getByRole, getByLabelText } = render(
    <ProIconProvider icons={{ "doc-info-item": OldGlyph }}>
      <VariantSwitch /><LegacyInfo /><CurrentInfo />
    </ProIconProvider>,
  );
  for (const load of Object.values(proImports)) expect(load).not.toHaveBeenCalled();
  fireEvent.click(getByRole("button", { name: "stroke-rounded" }));
  await waitFor(() => expect(getByRole("button", { name: "bulk-rounded" })).toBeDefined());
  expect(proImports.bulk).toHaveBeenCalledOnce();
  expect(proImports.standard).not.toHaveBeenCalled();
  expect(proImports.duotone).not.toHaveBeenCalled();
  expect(getByLabelText("Legacy slot").getAttribute("data-glyph")).toBe("old");
  expect(getByLabelText("Current slot").getAttribute("data-glyph")).toBe("old");
});
