import { FilterQueryInput, useFilterQueryInput } from "@zeron/ui/filter-query-input";
import type { FilterClause, FilterField } from "@zeron/ui/system/filter-core";

const fields: readonly FilterField[] = [
  { id: "status", label: "Status", type: "multiSelect", options: [{ value: "paid", label: "Paid" }] },
];

export function ConsumerExample({ filters, onFiltersChange }: {
  filters: readonly FilterClause[];
  onFiltersChange: (next: FilterClause[]) => void;
}) {
  const query = useFilterQueryInput({ fields, filters, onFiltersChange });
  query.getListboxProps();
  query.getOptionProps("field:status");

  return <FilterQueryInput
    fields={fields}
    filters={filters}
    onFiltersChange={onFiltersChange}
    queryFields={[{ fieldId: "status", key: "orderStatus", aliases: ["status"] }]}
  />;
}
