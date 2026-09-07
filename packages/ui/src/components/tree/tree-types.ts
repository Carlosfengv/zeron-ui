import type { HTMLAttributes, ReactNode } from "react";
import type { IconComponent } from "#system/icon-context";

export type TreeKey = string;
export type TreeSelectionMode = "none" | "single" | "multiple";
export type TreeSelectionIndicator = "highlight" | "checkbox";
export type TreeCheckStrategy = "independent" | "cascade";

export interface TreeNode<T = unknown> {
  key: TreeKey;
  label: string;
  children?: readonly TreeNode<T>[];
  icon?: IconComponent;
  description?: string;
  keywords?: readonly string[];
  disabled?: boolean;
  disabledReason?: string;
  selectable?: boolean;
  data?: T;
}

export interface TreeChangeDetails<T = unknown> {
  reason: "pointer" | "keyboard";
  triggerKey: TreeKey;
  addedKeys: readonly TreeKey[];
  removedKeys: readonly TreeKey[];
  selectedNodes: readonly TreeNode<T>[];
  unresolvedKeys: readonly TreeKey[];
}

export interface TreeRenderContext<T = unknown> {
  node: TreeNode<T>;
  level: number;
  expanded: boolean;
  selected: boolean;
  checkState: boolean | "mixed";
  focused: boolean;
  disabled: boolean;
  matched: boolean;
}

type SelectionState<T> = {
  selectedKeys?: readonly TreeKey[];
  defaultSelectedKeys?: readonly TreeKey[];
  onSelectionChange?: (keys: readonly TreeKey[], details: TreeChangeDetails<T>) => void;
};

export type TreeSelectionProps<T> =
  | {
      selectionMode?: "none";
      selectionIndicator?: never;
      checkStrategy?: never;
      selectedKeys?: never;
      defaultSelectedKeys?: never;
      onSelectionChange?: never;
    }
  | (SelectionState<T> & {
      selectionMode: "single";
      selectionIndicator?: "highlight";
      checkStrategy?: never;
    })
  | (SelectionState<T> & {
      selectionMode: "multiple";
      selectionIndicator?: "highlight";
      checkStrategy?: "independent";
    })
  | (SelectionState<T> & {
      selectionMode: "multiple";
      selectionIndicator: "checkbox";
      checkStrategy?: "independent" | "cascade";
    });

export interface TreeMessages {
  loading: string;
  empty: string;
  noResults: string;
  error: string;
  retry: string;
  cascadeSearchHint: string;
  searchExpansionHint: string;
  readOnly: string;
  unavailable: string;
  fileTypeNotAllowed: string;
  expandNode: (label: string) => string;
  collapseNode: (label: string) => string;
  resultsCount: (count: number) => string;
}

export interface TreeBaseProps<T = unknown>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect" | "aria-label" | "aria-labelledby"> {
  items: readonly TreeNode<T>[];
  expandedKeys?: readonly TreeKey[];
  defaultExpandedKeys?: readonly TreeKey[];
  onExpandedChange?: (
    keys: readonly TreeKey[],
    details: { key: TreeKey; expanded: boolean; reason: "pointer" | "keyboard" },
  ) => void;
  variant?: "plain" | "bordered";
  density?: "compact" | "regular" | "comfortable";
  showLines?: boolean;
  indent?: number;
  selectionScope?: "all" | "leaf";
  disabled?: boolean;
  readOnly?: boolean;
  query?: string;
  filterNode?: (node: TreeNode<T>, normalizedQuery: string) => boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  messages?: Partial<TreeMessages>;
  renderIcon?: (context: TreeRenderContext<T>) => ReactNode;
  renderLabel?: (context: TreeRenderContext<T>) => ReactNode;
  renderTrailing?: (context: TreeRenderContext<T>) => ReactNode;
  renderActions?: (context: TreeRenderContext<T>) => ReactNode;
  onNodeAction?: (node: TreeNode<T>) => void;
}

export type TreeAccessibleName =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-labelledby": string; "aria-label"?: never };

export type TreeProps<T = unknown> = TreeBaseProps<T> & TreeSelectionProps<T> & TreeAccessibleName;

export const defaultTreeMessages: TreeMessages = {
  loading: "Loading tree",
  empty: "No items",
  noResults: "No matching items",
  error: "Unable to load this tree",
  retry: "Try again",
  cascadeSearchHint: "Selecting a parent includes all eligible descendants, including hidden results.",
  searchExpansionHint: "Matching paths stay expanded while searching.",
  readOnly: "Read only",
  unavailable: "Unavailable",
  fileTypeNotAllowed: "This file type cannot be selected",
  expandNode: (label) => `Expand ${label}`,
  collapseNode: (label) => `Collapse ${label}`,
  resultsCount: (count) => `${count} matching ${count === 1 ? "item" : "items"}`,
};

export type TreeRow<T = unknown> = {
  key: TreeKey;
  node: TreeNode<T>;
  parentKey: TreeKey | null;
  level: number;
  position: number;
  setSize: number;
  disabled: boolean;
};
