// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxContent,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../packages/ui/src/components/combobox";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  configurable: true,
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

afterEach(cleanup);

const frameworks = ["Next.js", "SvelteKit", "Nuxt", "Astro"];

describe("Combobox interactions", () => {
  it("filters string items and renders the accessible empty state", async () => {
    render(
      <Combobox items={frameworks} defaultOpen>
        <ComboboxInput aria-label="Framework" />
        <ComboboxContent>
          <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    const input = screen.getByRole("combobox", { name: "Framework" });
    const emptyStatus = screen.getByRole("status");

    expect(emptyStatus.textContent).toBe("");
    expect(emptyStatus.className).toContain("empty:h-0");
    expect(emptyStatus.className).toContain("empty:p-0");

    fireEvent.change(input, { target: { value: "Svelte" } });

    await waitFor(() => {
      expect(screen.getByText("SvelteKit")).toBeTruthy();
      expect(screen.queryByText("Next.js")).toBeNull();
    });

    fireEvent.change(input, { target: { value: "Solid" } });

    await waitFor(() => {
      expect(screen.getByText("No frameworks found.")).toBeTruthy();
    });
  });

  it("preserves object values and their display labels", () => {
    const options = [
      { label: "Production", value: "prod" },
      { label: "Staging", value: "stage" },
    ];
    const onValueChange = vi.fn();

    render(
      <Combobox
        items={options}
        defaultOpen
        itemToStringLabel={(item) => item.label}
        itemToStringValue={(item) => item.value}
        onValueChange={onValueChange}
      >
        <ComboboxInput aria-label="Environment" />
        <ComboboxContent>
          <ComboboxList>
            {(item: (typeof options)[number]) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    fireEvent.click(screen.getByText("Production"));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(options[0]);
    expect(screen.getByRole("combobox", { name: "Environment" })).toHaveProperty(
      "value",
      "Production"
    );
  });

  it("exposes a composable clear action without an empty addon", async () => {
    render(
      <Combobox items={frameworks} defaultValue="Next.js">
        <ComboboxInput aria-label="Clearable framework" showTrigger={false}>
          <ComboboxClear aria-label="Clear framework" />
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    const input = screen.getByRole("combobox", { name: "Clearable framework" });
    expect(input).toHaveProperty("value", "Next.js");
    expect(document.querySelector('[data-slot="input-group-addon"]')).toBeNull();

    fireEvent.click(await screen.findByRole("button", { name: "Clear framework" }));

    expect(input).toHaveProperty("value", "");
    expect(document.activeElement).toBe(input);
  });

  it("supports controlled multiple values with removable chips", () => {
    function MultipleExample() {
      const [value, setValue] = useState<string[]>(["Next.js"]);
      const anchor = useComboboxAnchor();

      return (
        <Combobox
          items={frameworks}
          multiple
          value={value}
          onValueChange={setValue}
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(selected: string[]) => (
                <>
                  {selected.map((item) => (
                    <ComboboxChip key={item} removeAriaLabel={`Remove ${item}`}>
                      {item}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput aria-label="Frameworks" />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    }

    render(<MultipleExample />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Next.js" }));

    expect(screen.queryByText("Next.js")).toBeNull();
  });

  it("filters grouped object collections without leaving unmatched groups", async () => {
    const groups = [
      {
        label: "React",
        items: [{ label: "Next.js", value: "next" }],
      },
      {
        label: "Independent",
        items: [{ label: "Nuxt", value: "nuxt" }],
      },
    ];
    type Framework = (typeof groups)[number]["items"][number];

    render(
      <Combobox
        items={groups}
        defaultOpen
        itemToStringLabel={(item: Framework) => item.label}
        itemToStringValue={(item: Framework) => item.value}
      >
        <ComboboxInput aria-label="Grouped frameworks" />
        <ComboboxContent>
          <ComboboxList>
            {(group: (typeof groups)[number]) => (
              <ComboboxGroup key={group.label} items={group.items}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: Framework) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Grouped frameworks" }), {
      target: { value: "Nuxt" },
    });

    await waitFor(() => {
      expect(screen.getByText("Independent")).toBeTruthy();
      expect(screen.getByText("Nuxt")).toBeTruthy();
      expect(screen.queryByText("React")).toBeNull();
      expect(screen.queryByText("Next.js")).toBeNull();
    });
  });

  it("keeps control size and item density independent", () => {
    render(
      <Combobox items={frameworks} size="xl" itemDensity="compact" defaultOpen>
        <ComboboxInput aria-label="Sized framework" />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    expect(
      document.querySelector('[data-slot="combobox-input"]')?.getAttribute("data-size")
    ).toBe("xl");
    expect(screen.getByText("Next.js").closest('[data-slot="combobox-item"]')?.className).toContain(
      "h-control-md"
    );
  });

  it("preserves the Base UI render escape hatches", () => {
    render(
      <Combobox items={frameworks} defaultOpen>
        <ComboboxInput
          aria-label="Custom framework"
          render={<input data-testid="custom-combobox-input" />}
        />
        <ComboboxContent render={<div data-testid="custom-combobox-popup" />}>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );

    expect(screen.getByTestId("custom-combobox-input")).toBeTruthy();
    expect(screen.getByTestId("custom-combobox-popup")).toBeTruthy();
  });
});
