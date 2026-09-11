// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SelectedProjectsTable } from "../docs/pages/components/data-table/data-table-examples";

afterEach(cleanup);

describe("DataTable selection demo", () => {
  it("replaces filters with bulk actions and restores them after clearing selection", () => {
    render(<SelectedProjectsTable />);

    expect(screen.getByText("3 projects selected")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Filter projects…")).toBeNull();
    expect(
      screen.getByRole("toolbar", {
        name: "Bulk actions for selected projects",
      })
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Clear project selection" })
    );

    expect(screen.queryByText("3 projects selected")).toBeNull();
    expect(screen.getByPlaceholderText("Filter projects…")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Atlas" }));

    expect(screen.getByText("1 project selected")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Filter projects…")).toBeNull();
  });

  it("applies an archive action to the selected mock rows", () => {
    render(<SelectedProjectsTable />);

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.queryByText("Canvas")).toBeNull();
    expect(screen.getByPlaceholderText("Filter projects…")).toBeTruthy();
  });

  it("updates the selected mock rows from the bulk status menu", async () => {
    render(<SelectedProjectsTable />);

    fireEvent.click(screen.getByRole("button", { name: "Change status" }));
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "Paused" })
    );

    for (const name of ["Atlas", "Beacon", "Canvas"]) {
      const row = screen
        .getByRole("checkbox", { name: `Select ${name}` })
        .closest("tr");

      expect(row).not.toBeNull();
      expect(within(row as HTMLTableRowElement).getByText("Paused")).toBeTruthy();
    }
    expect(screen.getByPlaceholderText("Filter projects…")).toBeTruthy();
  });
});
