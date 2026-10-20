import { groupedDataTableDemoItems, type GroupedDataTableDemoItem } from "../grouped-data-table-01/grouped-data-table-demo-data";

export type SectionedDataTableDemoItem = GroupedDataTableDemoItem;

/** Share fixture definitions while keeping each demo's mutable records independent. */
export const sectionedDataTableDemoItems: SectionedDataTableDemoItem[] =
  groupedDataTableDemoItems.map((item) => ({ ...item }));
