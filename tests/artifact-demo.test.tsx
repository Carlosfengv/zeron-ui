// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ArtifactDemo } from "../docs/components/blocks/ArtifactDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("../docs/components/blocks/ChatDemoParts", () => ({
  ChatDemoModelControls: () => null,
  ChatDemoContextControl: () => null,
  ChatDemoResponseContent: ({ text, children }: { text: string; children?: ReactNode }) => <>{text}{children}</>,
}));
vi.mock("../packages/blocks/src/application/artifact-01/artifact-content", () => ({
  ArtifactContent: ({ revision }: { revision: { content: string } }) => <pre>{revision.content}</pre>,
}));
class TestResizeObserver { observe() {} unobserve() {} disconnect() {} }
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
  Object.defineProperty(window, "matchMedia", { configurable: true, value: (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("creates the first Markdown revision without an identical hidden predecessor", async () => {
  render(<ArtifactDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Write a launch plan" }));
  await screen.findByText(/Your launch plan includes goals/);
  expect(screen.getByRole("button", { name: "Version 1 of 1" })).toBeDefined();
  expect(screen.queryByRole("tab", { name: "Changes" })).toBeNull();
  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("aria-selected")).toBe("true");
});

it("stops generation, retries the same revision and replays a clean history", async () => {
  const { container } = render(<ArtifactDemo />);
  fireEvent.click(screen.getByRole("button", { name: "Add a yearly toggle" }));
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(screen.getByRole("alert").textContent).toContain("Generation stopped");
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(container.querySelector("iframe")?.getAttribute("srcdoc")).toContain("function billing("), { timeout: 4000 });
  expect(screen.getByRole("button", { name: "Version 2 of 2" })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay" }));
  expect(screen.getByRole("button", { name: "Version 1 of 1" })).toBeDefined();
  expect(container.querySelector("iframe")?.getAttribute("srcdoc")).not.toContain("function billing(");
});
