// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import english from "../docs/content/en/components/data-table.json";
import chinese from "../docs/content/zh-CN/components/data-table.json";
import { ProjectsTable } from "../docs/pages/components/data-table/data-table-examples";
import {
  DataTable,
  type DataTableTableProps,
  useDataTable,
} from "../packages/ui/src/components/data-table";

afterEach(cleanup);

interface Report {
  id: string;
  name: string;
}

const rows: Report[] = [{ id: "report-1", name: "Recovery report" }];
const columns: ColumnDef<Report, unknown>[] = [
  { accessorKey: "name", header: "Report" },
];

interface ReportsTableProps {
  data?: Report[];
  isLoading?: boolean;
  tableProps?: DataTableTableProps;
}

function ReportsTable({
  data = rows,
  isLoading = false,
  tableProps,
}: ReportsTableProps) {
  const { table } = useDataTable({ columns, data });

  return (
    <DataTable
      aria-label="Report controls"
      className="reports-container"
      id="reports-container"
      isLoading={isLoading}
      loadingMessage="Loading reports"
      showPagination={false}
      table={table}
      tableProps={tableProps}
    >
      <h2 id="reports-title">Reports</h2>
      <p id="reports-description">Completed recovery operations</p>
    </DataTable>
  );
}

describe("DataTable accessible table attributes", () => {
  it("names the semantic table independently of its surrounding controls", () => {
    render(
      <ReportsTable
        tableProps={{
          "aria-label": "Reports",
          className: "table-fixed",
          id: "reports-table",
        }}
      />
    );

    const table = screen.getByRole("table", { name: "Reports" });
    expect(table.id).toBe("reports-table");
    expect(table.classList.contains("table-fixed")).toBe(true);
    expect(table.classList.contains("reports-container")).toBe(false);
    expect(table.querySelector("tbody")?.textContent).toContain("Recovery report");
    const root = document.getElementById("reports-container");
    expect(root?.getAttribute("aria-label")).toBe("Report controls");
    expect(root?.classList.contains("reports-container")).toBe(true);
    expect(root?.getAttribute("tableProps")).toBeNull();
  });

  it("connects the table to visible labels and descriptions", () => {
    render(
      <ReportsTable
        tableProps={{
          "aria-label": "Fallback reports label",
          "aria-labelledby": "reports-title",
          "aria-describedby": "reports-description",
        }}
      />
    );

    const table = screen.getByRole("table", {
      name: "Reports",
      description: "Completed recovery operations",
    });
    expect(table.getAttribute("aria-labelledby")).toBe("reports-title");
    expect(
      screen.queryByRole("table", { name: "Fallback reports label" })
    ).toBeNull();
  });

  it("preserves the table name through loading, empty, and populated states", () => {
    const { rerender } = render(
      <ReportsTable
        isLoading
        tableProps={{ "aria-label": "Reports", "aria-busy": true }}
      />
    );
    const table = screen.getByRole("table", { name: "Reports" });
    const status = screen.getByRole("status");
    expect(table.getAttribute("aria-busy")).toBe("true");
    expect(status.textContent).toBe("Loading reports");
    expect(table.contains(status)).toBe(false);
    expect(status.closest('[aria-busy="true"]')).toBeNull();
    expect(screen.queryByRole("cell", { name: "Recovery report" })).toBeNull();

    rerender(
      <ReportsTable
        data={[]}
        tableProps={{ "aria-label": "Reports", "aria-busy": false }}
      />
    );
    expect(screen.getByRole("table", { name: "Reports" })).toBe(table);
    expect(table.getAttribute("aria-busy")).toBe("false");
    expect(table.textContent).toContain("No results.");

    rerender(<ReportsTable tableProps={{ "aria-label": "Reports" }} />);
    expect(screen.getByRole("table", { name: "Reports" })).toBe(table);
    expect(table.getAttribute("aria-busy")).toBeNull();
    expect(screen.getByRole("cell", { name: "Recovery report" })).toBeTruthy();
  });

  it("keeps table content and the measurement ref owned by DataTable", () => {
    expectTypeOf<
      Extract<
        keyof DataTableTableProps,
        "children" | "dangerouslySetInnerHTML" | "ref"
      >
    >().toEqualTypeOf<never>();
  });

  it.each([
    { locale: "en", messages: english, name: "Project Directory" },
    { locale: "zh-CN", messages: chinese, name: "项目目录" },
  ])("localizes the live documentation table in $locale", ({ locale, messages, name }) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <ProjectsTable />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("table", { name })).toBeTruthy();
  });
});
