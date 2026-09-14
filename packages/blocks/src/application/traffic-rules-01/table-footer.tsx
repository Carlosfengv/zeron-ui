"use client";

import { useMemo, useState } from "react";
import { getCoreRowModel, useReactTable, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import { DataTablePagination } from "@zeron/ui/data-table";

type FooterRow = { id: string };

export function TableFooter({ bordered = true, selected = 0, showSelection = false, total }: { bordered?: boolean; selected?: number; showSelection?: boolean; total: number }) {
  const data = useMemo<FooterRow[]>(() => Array.from({ length: total }, (_, index) => ({ id: `footer-row-${index}` })), [total]);
  const columns = useMemo<ColumnDef<FooterRow>[]>(() => showSelection ? [{ id: "select" }] : [{ accessorKey: "id" }], [showSelection]);
  const rowSelection = useMemo(() => Object.fromEntries(data.slice(0, selected).map((row) => [row.id, true])), [data, selected]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const table = useReactTable({
    columns,
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onPaginationChange: setPagination,
    state: { pagination, rowSelection },
  });

  return (
    <div className={bordered ? "border-t border-border px-3 py-2" : "mt-1 px-1 py-2"}>
      <DataTablePagination className="p-0 text-label" pageSizeOptions={[10, 20, 50]} table={table} />
    </div>
  );
}
