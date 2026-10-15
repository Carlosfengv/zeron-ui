// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TimeWindowTimeline, type TimeWindowGroup } from "@zeron/ui/time-window-timeline";

afterEach(cleanup);
const ticks = [{ id: "first", start: 0, end: 50, label: "First" }, { id: "second", start: 50, end: 100, label: "Second" }];
const groups: TimeWindowGroup[] = [{ id: "group", label: "Resources", rows: [{ id: "row", label: "GPU pool", intervals: [
  { id: "current", start: -50, end: 150, label: "40% used", ariaLabel: "GPU pool: 40% used", value: 40 },
  { id: "outside", start: 150, end: 200, label: "Outside", ariaLabel: "Outside" },
], markers: [{ id: "inside", at: 50, label: "Reset at 50" }, { id: "boundary", at: 100, label: "Outside marker" }] }] }];

describe("TimeWindowTimeline", () => {
  it("clips intervals and meters against the complete window, while keeping accessible values intact", () => {
    const { container } = render(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={ticks} groups={groups} now={25} />);
    const meter = screen.getByRole("meter", { name: "GPU pool: 40% used" });
    expect(meter.getAttribute("aria-valuenow")).toBe("40");
    expect(meter.style.left).toBe("0%");
    expect(meter.style.width).toBe("100%");
    // 40% of [-50,150] ends at 30: 30% of the visible [0,100] range.
    expect(meter.querySelector(".bottom-1\\.5 > span")?.getAttribute("style")).toContain("width: 30%");
    expect(screen.queryByLabelText("Outside")).toBeNull();
    expect(screen.queryByLabelText("Outside marker")).toBeNull();
    expect(screen.getByLabelText("Reset at 50")).toBeTruthy();
    expect(container.querySelector<HTMLElement>('[data-slot="time-window-now"]')?.style.left).toBe("25%");
    expect(screen.getByRole("region", { name: "Quota" }).tabIndex).toBe(0);
    expect(screen.getByRole("table", { name: "Quota" })).toBeTruthy();
  });

  it("hides now at the exclusive boundary and reports an empty timeline", () => {
    const { container, rerender } = render(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={ticks} groups={groups} now={100} />);
    expect(container.querySelector('[data-slot="time-window-now"]')).toBeNull();
    rerender(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={ticks} groups={[]} emptyContent="No resources" />);
    expect(screen.getByRole("status").textContent).toBe("No resources");
  });

  it.each([NaN, Infinity, -1, 101])("rejects invalid meter value %s before rendering geometry", (value) => {
    const invalid = [{ ...groups[0], rows: [{ ...groups[0].rows[0], intervals: [{ ...groups[0].rows[0].intervals[0], value }] }] }];
    render(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={ticks} groups={invalid} />);
    expect(screen.getByRole("alert").textContent).toBe("Invalid timeline data");
    expect(screen.queryByRole("meter")).toBeNull();
  });

  it("rejects duplicate row IDs and overlapping ticks", () => {
    const { rerender } = render(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={ticks} groups={[groups[0], { ...groups[0], id: "second" }]} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<TimeWindowTimeline ariaLabel="Quota" start={0} end={100} ticks={[ticks[0], { ...ticks[1], start: 40 }]} groups={groups} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("rejects finite endpoints whose span overflows before rendering percentages", () => {
    render(<TimeWindowTimeline ariaLabel="Quota" start={-Number.MAX_VALUE} end={Number.MAX_VALUE} ticks={[]} groups={groups} />);
    expect(screen.getByRole("alert").textContent).toBe("Invalid timeline data");
    expect(screen.queryByRole("meter")).toBeNull();
  });
});
