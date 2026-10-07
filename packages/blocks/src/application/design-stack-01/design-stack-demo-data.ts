import type { CellSelectOption } from "@zeron/ui/data-grid";
import type { DesignStackItem, DesignStackLabels } from "./design-stack-types";

export const designStackCategories: CellSelectOption[] = [
  { value: "design", label: "Design", color: "purple" },
  { value: "issue-tracking", label: "Issue tracking", color: "blue" },
  { value: "hosting", label: "Hosting", color: "gray" },
  { value: "website", label: "Website", color: "pink" },
  { value: "video", label: "Video", color: "green" },
];

export const designStackDemoItems: DesignStackItem[] = [
  { id: "figma", tool: "Figma", category: "design", website: "https://figma.com", renews: "2026-03-12" },
  { id: "linear", tool: "Linear", category: "issue-tracking", website: "https://linear.app", renews: "2026-01-04" },
  { id: "vercel", tool: "Vercel", category: "hosting", website: "https://vercel.com", renews: "2026-08-21" },
  { id: "framer", tool: "Framer", category: "website", website: "https://framer.com", renews: "2026-05-02" },
  { id: "loom", tool: "Loom", category: "video", website: "https://loom.com", renews: "2026-11-18" },
];

export const designStackLabels: DesignStackLabels = {
  tool: "Tool", category: "Category", website: "Website", renews: "Renews",
  addRow: "Add row", newTool: "New tool", delete: "Delete", clear: "Clear",
  undo: "Undo", redo: "Redo", selectAll: "Select all tools",
  selectRow: (tool) => `Select ${tool || "untitled tool"}`,
  selected: (count) => `${count} selected`, editHint: "Double-click a cell to edit",
};
