// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Badge } from "../packages/ui/src/components/badge";
import { BadgeOverflow } from "../packages/ui/src/components/badge-overflow";
import { Button } from "../packages/ui/src/components/button";
import { CardTitle } from "../packages/ui/src/components/card";
import { NavItemLabel } from "../packages/ui/src/components/nav-item";
import { TabItem, Tabs, TabsList } from "../packages/ui/src/components/tabs";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

afterEach(cleanup);

describe("single-DOM-text components", () => {
  it("renders each TabItem label once while reserving its selected width with a pseudo-element", () => {
    const { container } = render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabItem value="overview" label="Overview" />
          <TabItem value="activity" label="Activity" />
        </TabsList>
      </Tabs>
    );

    expect(screen.getAllByText("Overview")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Overview" })).toBeTruthy();

    const label = container.querySelector("[data-label='Overview']");
    expect(label?.querySelectorAll("span")).toHaveLength(1);
    expect(label?.className).toContain("after:content-[attr(data-label)]");
  });

  it("renders a primitive CardTitle once and reserves its semibold width with generated content", () => {
    const { container } = render(<CardTitle>Fluid motion</CardTitle>);

    expect(screen.getAllByText("Fluid motion")).toHaveLength(1);

    const title = container.querySelector("[data-slot='card-title']");
    expect(title?.getAttribute("data-title")).toBe("Fluid motion");
    expect(title?.querySelectorAll("span")).toHaveLength(1);
    expect(title?.className).toContain("after:content-[attr(data-title)]");
  });

  it("does not clone Badge children inside CardTitle", () => {
    const { container } = render(
      <CardTitle>
        <Badge>Active</Badge>
      </CardTitle>
    );

    expect(screen.getAllByText("Active")).toHaveLength(1);
    expect(container.querySelectorAll("[data-slot='card-title'] [aria-hidden='true']")).toHaveLength(0);
  });

  it("does not clone interactive children inside CardTitle", () => {
    const onClick = vi.fn();
    render(
      <CardTitle>
        <Button onClick={onClick}>Open details</Button>
      </CardTitle>
    );

    const buttons = screen.getAllByRole("button", { name: "Open details" });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders NavItemLabel content once for both primitive and rich labels", () => {
    const { rerender } = render(<NavItemLabel>Projects</NavItemLabel>);
    expect(screen.getAllByText("Projects")).toHaveLength(1);

    rerender(
      <NavItemLabel>
        <Badge>New</Badge>
      </NavItemLabel>
    );
    expect(screen.getAllByText("New")).toHaveLength(1);
  });

  it("unmounts BadgeOverflow's measurement copies before text can be queried", () => {
    render(
      <BadgeOverflow
        items={["Design", "Engineering"]}
        renderBadge={(_, label) => <Badge>{label}</Badge>}
      />
    );

    expect(screen.getAllByText("Design")).toHaveLength(1);
    expect(screen.getAllByText("Engineering")).toHaveLength(1);
    expect(document.querySelector("[data-badge-overflow-measurement]")).toBeNull();
  });
});
