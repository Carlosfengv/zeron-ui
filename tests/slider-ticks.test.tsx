// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Slider } from "@zeron/ui/slider";
import { Tooltip } from "@zeron/ui/tooltip";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(240);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("graduated Slider public contract", () => {
  it("bounds visual density without changing precise input values", () => {
    const { container, rerender } = render(<Slider variant="ticks" value={80.5} onChange={() => {}} max={1000} step={0.5} tickCount={41} label="摄入" showSteps />);
    expect(container.querySelectorAll('[data-slot="slider-ticks"] [data-slot="slider-tick"]')).toHaveLength(41);
    expect(screen.getByRole("slider", { name: "摄入" }).getAttribute("step")).toBe("0.5");
    expect(screen.getByRole("slider", { name: "摄入" }).getAttribute("aria-valuenow")).toBe("80.5");
    rerender(<Slider variant="ticks" value={80.5} onChange={() => {}} max={1000} step={0.5} tickCount={1000000} label="摄入" />);
    expect(container.querySelectorAll('[data-slot="slider-tick"]')).toHaveLength(202);
  });
  it("preserves classic presentation and gives ranges separate accessible thumbs", () => {
    const { container, rerender } = render(<Slider value={50} onChange={() => {}} />);
    expect(container.querySelector('[data-slot="slider-track"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="slider-ticks"]')).toBeNull();
    rerender(<Slider variant="ticks" value={[20, 80]} onChange={() => {}} label="范围" hideFill disabled tickCount={0} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByRole("slider", { name: "范围 minimum" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("slider", { name: "范围 maximum" })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="slider-tick"]')).toHaveLength(2);
    expect(container.querySelector('[data-slot="slider-ticks-fill"]')).toBeNull();
  });
  it("opens controlled tooltips without hovering and links their descriptions", async () => {
    const { container } = render(<Tooltip content="当前值 80 GB/day" forceOpen><span>Anchor</span></Tooltip>);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toBe("当前值 80 GB/day");
    expect(container.querySelector("span")?.getAttribute("aria-describedby")).toContain(tooltip.id);
    expect(container.contains(tooltip)).toBe(false);
  });
  it("shows the dragged endpoint even if the other endpoint has keyboard focus", async () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const { container } = render(<Slider variant="ticks" value={[20, 80]} onChange={() => {}} label="Range" showValue valuePosition="tooltip" renderTooltip={(value, index) => `${index}:${value}`} />);
    fireEvent.focus(screen.getByRole("slider", { name: "Range minimum" }));
    const track = container.querySelector('[data-slot="slider-track-control"]') as HTMLElement;
    track.setPointerCapture = vi.fn();
    track.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 240, bottom: 36, width: 240, height: 36, toJSON() {} });
    fireEvent.pointerDown(track, { clientX: 186, button: 0 });
    expect(await screen.findByText("1:80")).toBeTruthy();
  });
});
