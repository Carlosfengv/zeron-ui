// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../packages/ui/src/components/badge";
import { InlineNotice, InlineNoticeContent } from "../packages/ui/src/components/inline-notice";
import { Alert, AlertTitle, AlertAction } from "../packages/ui/src/components/alert";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function deferred() {
  let resolve!: () => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("shared feedback primitives", () => {
  it.each(["neutral", "info", "success", "warning", "danger"] as const)("keeps %s readable and static", (status) => {
    const { container } = render(<Badge variant="plain" status={status}>Healthy</Badge>);
    expect(screen.getByText("Healthy")).toBeTruthy();
    expect(container.querySelector("[data-status]")?.getAttribute("data-status")).toBe(status);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector("[data-slot=badge-marker]")?.getAttribute("aria-hidden")).toBe("true");
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    expect(badge.style.backgroundColor).toBe("");
    expect(badge.classList.contains("border")).toBe(false);
    expect(badge.classList.contains("h-auto")).toBe(true);
    expect(badge.classList.contains("px-0")).toBe(true);
  });
  it("replaces the dot with an icon and supports standalone accessible markers", () => {
    const { container, rerender } = render(<Badge variant="plain" status="success" leadingIcon={<svg />} role="img" aria-label="Ready" />);
    expect(screen.getByRole("img", { name: "Ready" })).toBeTruthy();
    expect(container.querySelector("[data-slot=badge-marker]")).toBeNull();
    expect(container.querySelector("[data-slot=badge-label]")).toBeNull();
    expect(container.querySelector("[data-slot=badge-icon]")?.getAttribute("aria-hidden")).toBe("true");
    rerender(<Badge variant="dot" status="danger" leadingIcon={<svg />}>Failed</Badge>);
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(container.querySelector("[data-slot=badge-marker]")).toBeNull();
  });
  it("uses InlineNotice for long activity text and respects reduced motion", () => {
    const { container } = render(<InlineNotice variant="emphasized" tone="info"><span aria-hidden="true" className="animate-spin motion-reduce:animate-none"><svg /></span><InlineNoticeContent>Refreshing previous results with a long explanation</InlineNoticeContent></InlineNotice>);
    expect(screen.getByText(/Refreshing previous results/)).toBeTruthy();
    expect(container.querySelector(".animate-spin")?.classList.contains("motion-reduce:animate-none")).toBe(true);
    expect(container.querySelector("[data-slot=inline-notice-content]")?.classList.contains("break-words")).toBe(true);
    expect(screen.queryByRole("status")).toBeNull();
  });
  it.each(["danger", undefined] as const)("keeps dot badges unfilled when an icon replaces the marker (%s)", (status) => {
    const { container, rerender } = render(<Badge variant="dot" status={status} color="violet">Failed</Badge>);
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    const originalBorder = badge.style.borderColor;
    const markerColor = (container.querySelector("[data-slot=badge-marker]") as HTMLElement).style.backgroundColor;
    rerender(<Badge variant="dot" status={status} color="violet" leadingIcon={<svg />}>Failed</Badge>);
    expect(badge.style.backgroundColor).toBe("");
    expect(badge.style.color).toBe("");
    expect(badge.style.borderColor).toBe(originalBorder);
    expect((container.querySelector("[data-slot=badge-icon]") as HTMLElement).style.color).toBe(markerColor);
  });
  it("composes confirmed failure and retry with Alert and explicit announcement ownership", () => {
    const retry = vi.fn();
    const { container, rerender } = render(<Alert status="danger" role="group"><AlertTitle>Failed</AlertTitle><AlertAction><button onClick={retry}>Retry</button></AlertAction></Alert>);
    expect(container.querySelector("[data-slot=alert]")).toBeTruthy();
    expect(container.querySelector("[data-slot=empty]")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
    rerender(<Alert status="danger"><AlertTitle>New failure</AlertTitle></Alert>);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});

