// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "../packages/ui/src/components/button";

afterEach(cleanup);

describe("Button tone", () => {
  it("applies warning semantics without changing the selected hierarchy", () => {
    render(<Button tone="warning" variant="tertiary">配置异常</Button>);

    const button = screen.getByRole("button", { name: "配置异常" });
    const background = button.querySelector('[data-slot="button-background"]');
    expect(button.getAttribute("data-tone")).toBe("warning");
    expect(button.classList.contains("text-fg-warning")).toBe(true);
    expect(background?.classList.contains("bg-warning-surface")).toBe(true);
    expect(background?.classList.contains("border-0")).toBe(true);
  });

  it("applies public content and label classes in normal and loading states", () => {
    render(
      <>
        <Button contentClassName="consumer-content" labelClassName="consumer-label">
          Ready
        </Button>
        <Button contentClassName="consumer-content" labelClassName="consumer-label" loading>
          Loading
        </Button>
      </>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.querySelector(".consumer-content")).not.toBeNull();
      expect(button.querySelector(".consumer-label")).not.toBeNull();
      expect(button.classList.contains("consumer-content")).toBe(false);
      expect(button.classList.contains("consumer-label")).toBe(false);
    }
  });
});
