// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FilterQueryInput, type FilterQuerySuggestionProvider } from "../packages/ui/src/components/filter-query-input";
import { createIconSlot } from "../packages/ui/src/system/icon-context";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    matches: false,
    media: query,
    removeEventListener: vi.fn(),
  })),
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: TestResizeObserver });
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });

afterEach(cleanup);

const StatusIcon = createIconSlot("hash");

const fields: readonly FilterField[] = [
  { id: "query", label: "Search", type: "text" },
  { id: "status", icon: StatusIcon, label: "Status", type: "multiSelect", options: [{ value: "200", label: "200" }, { value: "500", label: "500" }] },
  { id: "service", label: "Service", type: "select", options: [{ value: "api", label: "API" }] },
];

function Example({ providers }: { providers?: readonly FilterQuerySuggestionProvider[] }) {
  const [filters, setFilters] = React.useState<FilterClause[]>([]);
  return <FilterQueryInput fields={fields} filters={filters} freeText={{ fieldId: "query" }} messages={{ placeholder: "Search records" }} onFiltersChange={setFilters} suggestionProviders={providers} />;
}

function focusQuery(_name: string) {
  const input = screen.getByRole<HTMLInputElement>("combobox");
  fireEvent.focus(input);
  return input;
}

describe("FilterQueryInput", () => {
  it("keeps the default trigger on the 32px md control height", () => {
    render(<FilterQueryInput fields={fields} />);
    const input = screen.getByRole("combobox");
    const control = input.closest('[data-slot="input-group"]');
    expect(control?.getAttribute("data-size")).toBe("md");
    expect(control?.classList.contains("h-control-md")).toBe(true);
    expect(control?.parentElement?.classList.contains("h-auto")).toBe(true);
    expect(control?.parentElement?.classList.contains("h-full")).toBe(false);
  });

  it("renders configured field icons in the default filter suggestions", async () => {
    render(<FilterQueryInput fields={fields} />);
    focusQuery("Search with filters…");

    const statusSuggestion = await screen.findByRole("option", { name: "Status" });
    expect(statusSuggestion.querySelector("svg")).toBeTruthy();
  });

  it("renders the dropdown keyboard hints with Kbd components", async () => {
    render(<FilterQueryInput fields={fields} />);
    focusQuery("Search with filters…");
    await screen.findByRole("listbox");

    const keys = [...document.querySelectorAll<HTMLElement>('[data-slot="kbd"]')].map((key) => key.textContent);
    expect(keys).toEqual(["↑", "↓", "↵", "Esc"]);
    expect(screen.getByText("Navigate")).toBeTruthy();
    expect(screen.getByText("Apply")).toBeTruthy();
    expect(screen.getByText("Close")).toBeTruthy();
  });

  it("returns to field suggestions after a complete token and a trailing space", async () => {
    render(<Example />);
    const input = focusQuery("Search records");
    fireEvent.change(input, { target: { value: "status:500 " } });
    fireEvent.input(input, { target: { selectionStart: 11, value: "status:500 " } });

    await waitFor(() => expect(screen.getByText("Service")).toBeTruthy());
    expect(screen.queryByText("Status")).toBeNull();
  });

  it("keeps async provider suggestions inside cmdk item semantics and applies their replacement", async () => {
    const getSuggestions = vi.fn(async () => [{
      id: "custom:help",
      group: "Help",
      label: "Help",
      textValue: "Help",
      apply: () => ({ replacement: "status:" }),
    }]);
    const providers: readonly FilterQuerySuggestionProvider[] = [
      {
        id: "help",
        getSuggestions,
      },
    ];
    render(<Example providers={providers} />);
    focusQuery("Search records");

    const item = await screen.findByRole("option", { name: "Help" });
    expect(screen.getByText("Help", { selector: "[cmdk-group-heading]" })).toBeTruthy();
    expect(getSuggestions).toHaveBeenCalledTimes(1);
    fireEvent.click(item);
    expect(document.querySelector<HTMLInputElement>('input[placeholder="Search records"]')?.value).toBe("status:");
  });

  it("does not commit while an IME composition is active", () => {
    const onFiltersChange = vi.fn();
    render(<FilterQueryInput fields={fields} filters={[]} onFiltersChange={onFiltersChange} />);
    const input = focusQuery("Search with filters…");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "status:500" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it("uses field-level async suggestions and exposes facet counts", async () => {
    const loader = vi.fn(async () => ({
      options: [{ value: "500", label: "500" }],
      counts: new Map([["500", 7]]),
    }));
    render(
      <FilterQueryInput
        fields={[{ id: "status", label: "Status", type: "select" }]}
        queryFields={[{ fieldId: "status", loadSuggestions: loader }]}
      />,
    );
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status:" } });

    await waitFor(() => expect(loader).toHaveBeenCalled());
    expect(await screen.findByText("500")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("moves from a selected filter field to only that field's values", async () => {
    render(<FilterQueryInput fields={fields} />);
    const input = focusQuery("Search with filters…");
    fireEvent.click(await screen.findByRole("option", { name: "Status" }));

    expect(input.value).toBe("status:");
    expect(await screen.findByRole("option", { name: "200" })).toBeTruthy();
    expect(screen.getByText("Values", { selector: "[cmdk-group-heading]" })).toBeTruthy();
    expect(screen.queryByText("Filters", { selector: "[cmdk-group-heading]" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Status" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Service" })).toBeNull();
  });

  it("preserves earlier multi-select values when choosing the current suggestion", async () => {
    render(<FilterQueryInput fields={fields} />);
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status:200,5" } });

    fireEvent.click(await screen.findByRole("option", { name: "500" }));
    expect(input.value).toBe("status:200,500");
  });

  it("allows a text field to supply reusable value suggestions", async () => {
    render(
      <FilterQueryInput
        fields={[{ id: "host", label: "Host", type: "text" }]}
        queryFields={[{ fieldId: "host", loadSuggestions: async () => ({ options: [{ value: "api.example.com", label: "api.example.com" }] }) }]}
      />,
    );
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "host:api" } });

    expect(await screen.findByText("api.example.com")).toBeTruthy();
  });

  it("keeps existing values mounted while the same open query refreshes", async () => {
    const hostFields: readonly FilterField[] = [{ id: "host", label: "Host", type: "text" }];
    const initialLoader = vi.fn(async () => ({
      options: [{ value: "api.example.com", label: "api.example.com" }],
    }));
    let resolveRefresh!: (result: { options: { value: string; label: string }[] }) => void;
    const refreshLoader = vi.fn(() => new Promise<{ options: { value: string; label: string }[] }>((resolve) => {
      resolveRefresh = resolve;
    }));
    const { rerender } = render(
      <FilterQueryInput
        fields={hostFields}
        optionLoadDelay={0}
        queryFields={[{ fieldId: "host", loadSuggestions: initialLoader }]}
      />,
    );
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "host:" } });

    const existingOption = await screen.findByRole("option", { name: "api.example.com" });
    rerender(
      <FilterQueryInput
        fields={hostFields}
        optionLoadDelay={0}
        queryFields={[{ fieldId: "host", loadSuggestions: refreshLoader }]}
      />,
    );

    await waitFor(() => expect(refreshLoader).toHaveBeenCalled());
    expect(screen.getByRole("option", { name: "api.example.com" })).toBe(existingOption);
    expect(screen.queryByText("Loading options…")).toBeNull();

    await act(async () => {
      resolveRefresh({
        options: [
          { value: "api.example.com", label: "api.example.com" },
          { value: "edge.example.com", label: "edge.example.com" },
        ],
      });
    });

    expect(await screen.findByRole("option", { name: "edge.example.com" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "api.example.com" })).toBe(existingOption);
  });

  it("commits a complete typed token in immediate mode exactly once", async () => {
    const onFiltersChange = vi.fn();
    render(<FilterQueryInput commitMode="immediate" fields={fields} filters={[]} onFiltersChange={onFiltersChange} />);
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status:500" } });

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(1));
    expect(onFiltersChange.mock.calls[0]?.[0]).toMatchObject([{ field: "status", value: ["500"] }]);
  });

  it("re-parses and commits a selected history entry, then restores the closed summary", async () => {
    const onFiltersChange = vi.fn();
    const onHistoryChange = vi.fn();
    function HistoryExample() {
      const [filters, setFilters] = React.useState<FilterClause[]>([]);
      const [history, setHistory] = React.useState([{ id: "recent-status", query: "status:500", committedAt: 1 }]);
      return <FilterQueryInput
        fields={fields}
        filters={filters}
        history={history}
        onFiltersChange={(next) => { setFilters(next); onFiltersChange(next); }}
        onHistoryChange={(next) => { setHistory(next); onHistoryChange(next); }}
      />;
    }
    render(
      <HistoryExample />,
    );
    focusQuery("Search with filters…");
    fireEvent.click(await screen.findByText("status:500"));

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(1));
    expect(onFiltersChange.mock.calls[0]?.[0]).toMatchObject([{ field: "status", value: ["500"] }]);
    expect(screen.getByRole<HTMLInputElement>("combobox").value).toBe("status:500");
    expect(onHistoryChange).toHaveBeenCalled();
  });

  it("keeps matching recent searches visible while editing a structured query", async () => {
    render(
      <FilterQueryInput
        fields={fields}
        history={[
          { id: "status-history", query: "status:500", committedAt: Date.now() - 60_000 },
          { id: "service-history", query: "service:api", committedAt: Date.now() - 120_000 },
        ]}
      />,
    );
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status" } });

    expect(await screen.findByText("status:500")).toBeTruthy();
    expect(screen.queryByText("service:api")).toBeNull();
    expect(screen.getByText("Recent searches", { selector: "[cmdk-group-heading]" })).toBeTruthy();
    expect(screen.getByText(/minute ago/)).toBeTruthy();
    expect(screen.getByText("Clear history")).toBeTruthy();
  });

  it("reverts an unfinished draft and keeps focus on the input on Escape", async () => {
    render(<Example />);
    const input = focusQuery("Search records");
    fireEvent.change(input, { target: { value: "status:" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the open draft and exposes an external-filter conflict to custom UI", async () => {
    const slots = { footer: ({ state }: { state: { hasExternalConflict: boolean } }) => <span>{state.hasExternalConflict ? "Filters updated elsewhere" : "No conflict"}</span> };
    const { rerender } = render(<FilterQueryInput fields={fields} filters={[]} slots={slots} />);
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status:" } });

    rerender(<FilterQueryInput fields={fields} filters={[{ id: "external", field: "service", operator: "is", value: "api" }]} slots={slots} />);

    expect(await screen.findByText("Filters updated elsewhere")).toBeTruthy();
    expect(document.querySelector<HTMLInputElement>('input[placeholder="Search with filters…"]')?.value).toBe("status:");
  });

  it("uses configured shortcuts while keeping one stable native combobox", async () => {
    render(<FilterQueryInput data-testid="query-root" fields={fields} hotkey={["Alt+K"]} />);
    const input = screen.getByRole<HTMLInputElement>("combobox");
    expect(screen.getByTestId("query-root")).toBeTruthy();
    expect(input.getAttribute("aria-keyshortcuts")).toBe("Alt+K");
    expect(input.getAttribute("aria-expanded")).toBe("false");

    fireEvent.keyDown(document, { altKey: true, key: "k" });

    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(input);
  });

  it("keeps the editable input open when it receives a pointer press", async () => {
    render(<Example />);
    const input = focusQuery("Search records");

    fireEvent.click(input);

    expect(screen.getByRole("combobox")).toBe(input);
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("preserves the native text selection because opening does not replace the input", async () => {
    render(<FilterQueryInput fields={fields} />);
    const input = screen.getByRole<HTMLInputElement>("combobox");
    const originalInput = input;

    input.focus();
    await screen.findByRole("listbox");
    fireEvent.change(input, { target: { value: "status:500" } });
    expect(input.value).toBe("status:500");
    input.setSelectionRange(0, 6);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);

    expect(screen.getByRole("combobox")).toBe(originalInput);
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);
  });

  it("keeps native drag selection visible and isolates it from option pointer navigation", async () => {
    render(<FilterQueryInput fields={fields} />);
    const input = focusQuery("Search with filters…");
    const serviceOption = await screen.findByRole("option", { name: "Service" });
    const focus = vi.spyOn(input, "focus");
    const setPointerCapture = vi.fn();
    input.setPointerCapture = setPointerCapture;

    expect(input.className).toContain("selection:bg-brand");
    expect(input.className).toContain("selection:text-fg-on-brand");

    fireEvent.pointerDown(input, { button: 0, pointerType: "mouse" });
    expect(setPointerCapture).toHaveBeenCalled();
    fireEvent.pointerMove(serviceOption, { pointerType: "mouse" });

    expect(serviceOption.getAttribute("aria-selected")).toBe("false");
    expect(focus).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { button: 0, pointerType: "mouse" });
    fireEvent.pointerMove(serviceOption, { pointerType: "mouse" });

    expect(serviceOption.getAttribute("aria-selected")).toBe("true");
  });

  it("shows additional available fields after reopening a multi-condition query", async () => {
    render(<Example />);
    const input = focusQuery("Search records");
    fireEvent.change(input, { target: { value: "status:500" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input.getAttribute("aria-expanded")).toBe("false");
    fireEvent.pointerDown(input);

    expect(await screen.findByRole("option", { name: "Service" })).toBeTruthy();
  });

  it("blocks commits with more than one condition when multiple is false", async () => {
    const onFiltersChange = vi.fn();
    render(<FilterQueryInput fields={fields} filters={[]} multiple={false} onFiltersChange={onFiltersChange} />);
    const input = focusQuery("Search with filters…");
    fireEvent.change(input, { target: { value: "status:500 service:api" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect((await screen.findByRole("alert")).textContent).toContain("Only one filter can be applied here.");
    expect(onFiltersChange).not.toHaveBeenCalled();
  });
});
