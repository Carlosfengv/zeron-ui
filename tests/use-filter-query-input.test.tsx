// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useFilterQueryInput } from "../packages/ui/src/components/filter-query-core";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

afterEach(cleanup);

const fields: readonly FilterField[] = [
  { id: "status", label: "Status", type: "select", options: [{ value: "paid", label: "Paid" }] },
];

function HeadlessHarness({ onFiltersChange }: { onFiltersChange: (filters: FilterClause[]) => void }) {
  const query = useFilterQueryInput({ fields, defaultOpen: true, onFiltersChange });
  const suggestion = query.suggestions[0];

  return (
    <div>
      <input data-testid="input" {...query.getInputProps()} value={query.draftText} onChange={(event) => query.setDraftText(event.target.value, event.target.selectionStart ?? 0)} />
      <output data-testid="suggestion">{suggestion?.id ?? "none"}</output>
      <button type="button" onClick={() => suggestion && query.selectSuggestion(suggestion.id)}>select</button>
      <button type="button" onClick={() => query.setDraftText("status:paid", 11)}>write</button>
      <button type="button" onClick={() => query.commit()}>commit</button>
    </div>
  );
}

describe("useFilterQueryInput", () => {
  it("provides the complete query interaction without Zeron DOM", () => {
    const onFiltersChange = vi.fn();
    render(<HeadlessHarness onFiltersChange={onFiltersChange} />);

    expect(screen.getByTestId("input").getAttribute("role")).toBe("combobox");
    expect(screen.getByTestId("suggestion").textContent).toBe("field:status");

    fireEvent.click(screen.getByRole("button", { name: "select" }));
    expect((screen.getByTestId("input") as HTMLInputElement).value).toBe("status:");

    fireEvent.click(screen.getByRole("button", { name: "write" }));
    fireEvent.click(screen.getByRole("button", { name: "commit" }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      [expect.objectContaining({ field: "status", operator: "is", value: "paid" })],
      expect.objectContaining({ reason: "enter" }),
    );
  });
});
