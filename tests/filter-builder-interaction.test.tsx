// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FilterBuilder } from "../packages/ui/src/components/filter-builder/filter-builder";
import type { FilterClause, FilterField } from "../packages/ui/src/components/filter-builder/filter-types";

afterEach(cleanup);

const customField: FilterField = {
  id: "rating",
  label: "Rating",
  type: "custom",
  renderEditor: ({ onClauseChange }) => (
    <button
      onClick={() => onClauseChange({
        value: 4,
        meta: { dimensionKey: "quality" },
      })}
      type="button"
    >
      Set quality rating
    </button>
  ),
};

const customClause: FilterClause = {
  id: "rating-filter",
  field: "rating",
  operator: "equals",
  value: 3,
};

describe("FilterBuilder host extensions", () => {
  it("does not offer unsupported logic modes", () => {
    render(<FilterBuilder fields={[]} supportedLogic={["and"]} />);

    expect(screen.queryByText("Match any")).toBeNull();
    expect(screen.queryByText("Match all")).toBeNull();
  });

  it("corrects a controlled logic value that the backend does not support", async () => {
    const onLogicChange = vi.fn();
    render(
      <FilterBuilder
        fields={[]}
        logic="or"
        onLogicChange={onLogicChange}
        supportedLogic={["and"]}
      />,
    );

    await waitFor(() => {
      expect(onLogicChange).toHaveBeenCalledWith("and");
    });
  });

  it("commits a custom editor value and metadata in one update", () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterBuilder
        fields={[customField]}
        filters={[customClause]}
        onFiltersChange={onFiltersChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set quality rating" }));

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).toHaveBeenLastCalledWith([{
      ...customClause,
      value: 4,
      meta: { dimensionKey: "quality" },
    }]);
  });

  it("uses a custom read-only value renderer when available", () => {
    const renderEditor = vi.fn(() => <span>Editor</span>);
    const renderValue = vi.fn(() => <span>Quality: 3</span>);
    const field: FilterField = {
      ...customField,
      renderEditor,
      renderValue,
    };

    render(
      <FilterBuilder
        fields={[field]}
        filters={[{ ...customClause, meta: { dimensionKey: "quality" } }]}
        readOnly
      />,
    );

    expect(screen.getByText("Quality: 3")).toBeTruthy();
    expect(renderValue).toHaveBeenCalledWith(3, {
      clause: { ...customClause, meta: { dimensionKey: "quality" } },
      meta: { dimensionKey: "quality" },
    });
    expect(renderEditor).not.toHaveBeenCalled();
  });
});
