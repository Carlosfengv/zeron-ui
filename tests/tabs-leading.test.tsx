// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TabItem, TabPanel, Tabs, TabsList } from "../packages/ui/src/components/tabs";
import { Badge } from "../packages/ui/src/components/badge";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("keeps status tabs named and selectable with decorative leading content", () => {
  render(<Tabs defaultValue="all"><TabsList labelVisibility="active">
    <TabItem value="all" label="All" />
    <TabItem value="failed" label="Failed" badge={6} icon={() => <svg data-testid="unused-icon" />}
      leading={<Badge aria-hidden variant="plain" status="danger" />} />
  </TabsList><TabPanel value="all">All integrations</TabPanel><TabPanel value="failed">Failed integrations</TabPanel></Tabs>);
  const failed = screen.getByRole("tab", { name: /^Failed\s*6$/ });
  expect(screen.queryByTestId("unused-icon")).toBeNull();
  expect(failed.querySelector('[data-slot="badge"]')?.getAttribute("aria-hidden")).toBe("true");
  expect(failed.querySelector('[data-slot="badge"][data-variant="plain"] [data-slot="badge-label"]')).toBeNull();
  fireEvent.click(failed);
  expect(failed.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tabpanel").textContent).toBe("Failed integrations");
});
