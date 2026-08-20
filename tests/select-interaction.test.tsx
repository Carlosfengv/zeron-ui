// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../packages/ui/src/components/select";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  value: (id: number) => window.clearTimeout(id),
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});

describe("Select item discovery", () => {
  it("derives proximity indexes from item order without caller-supplied indexes", () => {
    render(
      <Select defaultOpen defaultValue="tool">
        <SelectTrigger aria-label="来源" />
        <SelectContent>
          <SelectGroup>
            <SelectLabel>来源</SelectLabel>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="tool">工具调用</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-proximity-index]")
    );

    expect(items.map((item) => item.dataset.proximityIndex)).toEqual(["0", "1"]);
  });

  it("uses a rich item label in the closed trigger instead of its internal value", () => {
    render(
      <Select value="all">
        <SelectTrigger aria-label="来源" />
        <SelectContent>
          <SelectItem value="all" textValue="全部来源">
            <span>全部来源</span>
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByRole("combobox", { name: "来源" });
    expect(trigger.textContent).toContain("全部来源");
    expect(trigger.textContent).not.toContain("all");
  });

  it("accepts disabled as a native trigger property", () => {
    render(
      <Select>
        <SelectTrigger aria-label="禁用来源" disabled />
        <SelectContent>
          <SelectItem value="all">全部来源</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("combobox", { name: "禁用来源" })).toHaveProperty(
      "disabled",
      true
    );
  });
});
