// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusOverview, type StatusOverviewContent } from "../packages/ui/src/components/status-overview";

afterEach(cleanup);

const timelineContent: StatusOverviewContent = {
  type: "timeline",
  start: 0,
  end: 300,
  items: [
    { id: "hour-1", status: "operational", ariaLabel: "00:00 operational" },
    { id: "hour-2", status: "degraded", ariaLabel: "01:00 degraded" },
    { id: "hour-3", status: "empty", ariaLabel: "02:00 no sample" },
  ],
  markers: [
    { at: 0, label: "Start" },
    { at: 150, label: "Middle" },
    { at: 300, label: "Now" },
  ],
};

function renderOverview(content: StatusOverviewContent = timelineContent, variant: "card" | "activity" | "chart" = "card") {
  return render(
    <StatusOverview
      variant={variant}
      ariaLabel="Service status history"
      content={content}
      emptyContent="No status data"
      label="Availability"
      summary={{ label: "Availability", value: "99.9%", status: "operational" }}
    />,
  );
}

describe("StatusOverview", () => {
  it("keeps an unlabeled activity rail accessible with results below", () => {
    render(<StatusOverview ariaLabel="Integration checks" label={null} variant="activity"
      content={{ type: "nodes", items: timelineContent.items, footer: <span>All checks passed</span> }} emptyContent="No checks" />);
    expect(screen.getByRole("grid", { name: "Integration checks" })).toBeTruthy();
    expect(document.querySelector('[data-slot="status-overview-label"]')).toBeNull();
    expect(screen.getByText("All checks passed")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("grid"), { key: "End" });
    const cells = screen.getAllByRole("gridcell");
    expect(screen.getByRole("grid").getAttribute("aria-activedescendant")).toBe(cells.at(-1)?.id);
  });
  it("renders one semantic segment for every input item and exposes a single grid tab stop", () => {
    renderOverview();

    const grid = screen.getByRole("grid", { name: "Service status history" });
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(3);
    expect(cells.map((cell) => cell.getAttribute("data-status"))).toEqual(["operational", "degraded", "empty"]);
    expect(grid.getAttribute("tabindex")).toBe("0");
    expect(cells.every((cell) => cell.getAttribute("tabindex") === null)).toBe(true);
    expect(grid.getAttribute("aria-activedescendant")).toBe(cells[0]?.id);
  });

  it.each(["card", "activity", "chart"] as const)("moves the active descendant in %s with keyboard commands without moving DOM focus", (variant) => {
    renderOverview(timelineContent, variant);
    const grid = screen.getByRole("grid", { name: "Service status history" });

    grid.focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(document.activeElement).toBe(grid);
    expect(grid.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("gridcell")[1]?.id);

    fireEvent.keyDown(grid, { key: "End" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("gridcell")[2]?.id);
    fireEvent.keyDown(grid, { key: "PageUp" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(screen.getAllByRole("gridcell")[0]?.id);
    fireEvent.keyDown(grid, { key: "Escape" });
    expect(document.activeElement).toBe(grid);
  });

  it("maps pointer positions, including gaps, to the nearest visual segment", () => {
    renderOverview();
    const grid = screen.getByRole("grid", { name: "Service status history" });
    const cells = screen.getAllByRole("gridcell");
    cells.forEach((cell, index) => {
      Object.defineProperty(cell, "getBoundingClientRect", {
        configurable: true,
        value: () => ({ bottom: 32, height: 32, left: index * 30, right: index * 30 + 20, top: 0, width: 20, x: index * 30, y: 0, toJSON: () => ({}) }),
      });
    });

    fireEvent.pointerMove(grid, { clientX: 56, pointerType: "mouse" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(cells[2]?.id);
  });

  it.each([
    { direction: "ltr", offset: -120, pitch: 6 },
    { direction: "rtl", offset: 1200, pitch: -6 },
  ])("locates dense $direction rails with bounded layout reads, including scrolled and out-of-range positions", ({ direction, offset, pitch }) => {
    renderOverview({ type: "nodes", items: Array.from({ length: 200 }, (_, index) => ({
      id: `node-${index}`, status: "operational", ariaLabel: `Node ${index}`,
    })) }, "chart");
    const grid = screen.getByRole("grid");
    grid.dir = direction;
    const cells = screen.getAllByRole("gridcell");
    let layoutReads = 0;
    cells.forEach((cell, index) => {
      Object.defineProperty(cell, "getBoundingClientRect", {
        configurable: true,
        value: () => {
          layoutReads += 1;
          const left = offset + index * pitch;
          return { bottom: 32, height: 32, left, right: left + 4, top: 0, width: 4, x: left, y: 0, toJSON: () => ({}) };
        },
      });
    });

    fireEvent.pointerMove(grid, { clientX: offset + 2 + 53.45 * pitch, pointerType: "mouse" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(cells[53]?.id);
    expect(layoutReads).toBeLessThan(10);

    fireEvent.pointerMove(grid, { clientX: offset + 2 - pitch, pointerType: "mouse" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(cells[0]?.id);
    fireEvent.pointerMove(grid, { clientX: offset + 2 + 200 * pitch, pointerType: "mouse" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(cells[199]?.id);
  });

  it("positions timeline markers in the shared canvas and suppresses invalid ranges", () => {
    const { rerender } = renderOverview();
    const markers = document.querySelectorAll<HTMLElement>('[data-slot="status-overview-marker"]');
    expect(markers).toHaveLength(3);
    expect(markers[0]?.style.left).toBe("0%");
    expect(markers[1]?.style.left).toBe("50%");
    expect(markers[2]?.style.left).toBe("100%");
    expect(document.querySelector('[data-slot="status-overview-rail-canvas"]')?.contains(markers[1]!)).toBe(true);

    rerender(
      <StatusOverview
        ariaLabel="Invalid history"
        content={{ ...timelineContent, start: 300, end: 0 }}
        emptyContent="No status data"
        label="Availability"
      />,
    );
    expect(document.querySelectorAll('[data-slot="status-overview-marker"]')).toHaveLength(0);
  });

  it("retains the active item by id when input order changes", () => {
    const { rerender } = renderOverview();
    const grid = screen.getByRole("grid", { name: "Service status history" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });

    rerender(
      <StatusOverview
        ariaLabel="Service status history"
        content={{ ...timelineContent, items: [timelineContent.items[2]!, timelineContent.items[1]!, timelineContent.items[0]!] }}
        emptyContent="No status data"
        label="Availability"
      />,
    );
    expect(grid.getAttribute("aria-activedescendant")).toBe(screen.getByRole("gridcell", { name: "01:00 degraded" }).id);
  });

  it.each(["card", "activity", "chart"] as const)("renders %s loading, empty, stale, unavailable, and error states without stale summary values", (variant) => {
    const { rerender } = render(
      <StatusOverview
        ariaLabel="Service status"
        variant={variant}
        content={timelineContent}
        emptyContent="No status data"
        label="Availability"
        state="loading"
        summary={{ label: "Availability", value: "99.9%", status: "operational" }}
      />,
    );
    expect(screen.getByLabelText("Service status").getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector('[data-slot="status-overview-skeleton"]')).toBeTruthy();
    expect(screen.queryByText("99.9%")).toBeNull();

    rerender(
      <StatusOverview
        ariaLabel="Service status"
        variant={variant}
        content={{ type: "nodes", items: [] }}
        emptyContent="No status data"
        label="Availability"
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("No status data");
    expect(screen.queryByRole("grid")).toBeNull();

    rerender(
      <StatusOverview
        ariaLabel="Service status"
        variant={variant}
        content={timelineContent}
        emptyContent="No status data"
        label="Availability"
        state="stale"
        statusMessage="Updated 8 minutes ago"
        summary={{ label: "Availability", value: "99.9%", status: "operational" }}
      />,
    );
    expect(screen.getByText("99.9%")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Updated 8 minutes ago");

    rerender(
      <StatusOverview
        ariaLabel="Service status"
        variant={variant}
        content={timelineContent}
        emptyContent="No status data"
        label="Availability"
        state="unavailable"
        statusMessage="Data source is unavailable"
        summary={{ label: "Availability", value: "99.9%", status: "operational" }}
      />,
    );
    expect(screen.queryByText("99.9%")).toBeNull();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Data source is unavailable");

    rerender(
      <StatusOverview
        ariaLabel="Service status"
        variant={variant}
        content={timelineContent}
        emptyContent="No status data"
        label="Availability"
        state="error"
        statusMessage="Could not load status"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Could not load status");
  });

  it("activity preserves full hit targets and distinguishes no activity from unknown samples", () => {
    renderOverview({ type: "nodes", items: [
      { id: "idle", status: "empty", ariaLabel: "Gateway：0 请求" },
      { id: "missing", status: "unknown", ariaLabel: "Gateway：未收到数据" },
    ] }, "activity");
    const idle = screen.getByRole("gridcell", { name: "Gateway：0 请求" });
    const unknown = screen.getByRole("gridcell", { name: "Gateway：未收到数据" });
    expect(idle.querySelector('[data-slot="status-overview-tick"]')?.getAttribute("aria-hidden")).toBe("true");
    expect(idle.className).not.toContain("bg-");
    expect(idle.querySelector("span")?.className).toContain("bg-border");
    expect(unknown.querySelector("span")?.className).toContain("h-3");
    fireEvent.keyDown(screen.getByRole("grid"), { key: "End" });
    expect(screen.getByRole("grid").getAttribute("aria-activedescendant")).toBe(unknown.id);
    expect(document.querySelector('[data-slot="status-overview-summary"] .sr-only')?.textContent).toBe("Availability");
  });
});
