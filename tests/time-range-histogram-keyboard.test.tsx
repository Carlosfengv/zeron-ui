// @vitest-environment jsdom

import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TimeRangeHistogram } from "#components/time-range-histogram";

afterEach(cleanup);

test("a full histogram range can be narrowed and moved using the keyboard", () => {
  const updates: Array<{ start: number; end: number }> = [];
  function Fixture() {
    const [value, setValue] = useState({ start: 0, end: 300 });
    return <TimeRangeHistogram ariaLabel="Log range"
      data={[0, 100, 200].map((start) => ({ start, end: start + 100, label: String(start), count: 1 }))}
      series={[{ dataKey: "count", label: "Logs", color: "var(--chart-1)" }]}
      value={value} onValueChange={(range) => { updates.push(range); setValue(range); }} />;
  }
  render(<Fixture />);
  const slider = screen.getByRole("slider", { name: "Log range" });
  fireEvent.keyDown(slider, { key: "ArrowLeft", shiftKey: true });
  expect(updates.at(-1)).toEqual({ start: 0, end: 200 });
  fireEvent.keyDown(slider, { key: "ArrowRight" });
  expect(updates.at(-1)).toEqual({ start: 100, end: 300 });
  fireEvent.keyDown(slider, { key: "Home", shiftKey: true });
  expect(updates.at(-1)).toEqual({ start: 100, end: 200 });
});
