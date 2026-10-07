import type { CellSelectOption } from "@zeron/ui/data-grid";

export interface DesignStackItem {
  id: string;
  tool: string;
  category: string;
  website: string;
  /** Calendar date in YYYY-MM-DD format, or an empty value. */
  renews: string;
  logoSrc?: string;
}

export interface DesignStackLabels {
  tool: string;
  category: string;
  website: string;
  renews: string;
  addRow: string;
  newTool: string;
  delete: string;
  clear: string;
  undo: string;
  redo: string;
  selectAll: string;
  selectRow: (tool: string) => string;
  selected: (count: number) => string;
  editHint: string;
}

export interface DesignStackProps {
  items: DesignStackItem[];
  /** Omit for a read-only grid. Updates are synchronous and host controlled. */
  onItemsChange?: (items: DesignStackItem[]) => void;
  title?: string;
  categories?: CellSelectOption[];
  labels?: Partial<DesignStackLabels>;
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  };
  height?: number;
  className?: string;
}
