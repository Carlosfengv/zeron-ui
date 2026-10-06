// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { RadioGroup, RadioItem } from "@zeron/ui/radio-group";

const preference = vi.hoisted(() => ({ reduce: false }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...await importOriginal<typeof import("framer-motion")>(),
  useReducedMotion: () => preference.reduce,
}));

it("hydrates a selected radio when reduced motion is only known in the browser", async () => {
  const content = <RadioGroup value="monthly"><RadioItem index={0} value="monthly" label="月付" /><RadioItem index={1} value="annual" label="年付" /></RadioGroup>;
  const container = document.createElement("div");
  preference.reduce = false;
  container.innerHTML = renderToString(content);
  document.body.append(container);
  preference.reduce = true;
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, content); });
    expect(errors.mock.calls.filter((call) => /hydration|hydrated|didn't match/i.test(String(call[0])))).toEqual([]);
    expect(container.querySelector('[data-slot="radio-group-indicator"] span')?.getAttribute("style")).toContain("opacity:1");
  } finally {
    await act(async () => root?.unmount());
    container.remove(); preference.reduce = false; errors.mockRestore();
  }
});
