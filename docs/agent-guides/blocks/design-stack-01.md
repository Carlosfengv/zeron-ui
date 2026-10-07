---
schema_version: 1
name: design-stack-01
kind: block
status: stable
summary: Container 与 DataGrid 组合的设计工具清单，支持单元格编辑、多选删除、排序和撤销重做。
registry_import: "@/components/blocks/design-stack-01"
source: packages/blocks/src/application/design-stack-01/design-stack.tsx
registry: packages/blocks/registry.json
related:
  - container
  - data-grid
  - avatar
  - badge
  - button
  - checkbox
---

# Design Stack 01

Use as an embedded editable inventory. Container owns its frame, header and footer; DataGrid directly owns the floating surface, focus model and scrolling. No application shell is added.

```tsx
import { DesignStack, designStackDemoItems, useDesignStackHistory } from "@/components/blocks/design-stack-01";

export function ToolInventory() {
  const { items, onItemsChange, history } = useDesignStackHistory(designStackDemoItems);
  return <DesignStack items={items} onItemsChange={onItemsChange} history={history} />;
}
```

- Supply unique stable IDs and tool/category/website/renews strings. Dates use YYYY-MM-DD; an empty string represents an unset value. Category IDs match the supplied CellSelectOption array. Custom labels accept selectRow and selected formatters.
- items/onItemsChange are synchronous controlled state. Omit onItemsChange for read-only mode; edit, paste, add and delete are disabled. This block does not implement asynchronous persistence; host adapters own it.
- The optional history prop accepts canUndo/canRedo/onUndo/onRedo. useDesignStackHistory stores up to 100 cloned snapshots, skips no-op updates, clears redo on a new change, and exposes reset for host dataset replacement. Treat returned items as React state: use onItemsChange/reset rather than mutating them. Initial data is read once. Use a separate keyed block/history scope for a different inventory.
- Text, select, URL and date editing, row selection, search, paste, column menus and keyboard navigation remain owned by DataGrid. Text cells use ColumnMeta.leading for decorative Avatar content, keeping one editor and one focus target. URL cells use hideProtocol to shorten the label without changing the stored URL or target. useDataGrid.interactionRef includes the Container toolbar in the selection/focus boundary.
- The toolbar and Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z or Ctrl/Cmd+Y restore history. While editing, native editor shortcuts remain with the editor. Undo/redo clear stale row and cell selections. Sorted edits and deletion resolve stable row IDs rather than original positions.
- Selecting rows reveals Delete and Clear. Add row creates a UUID and focuses the new tool editor. The footer reports the focused visible field coordinate. The built-in grid Add row footer is omitted because this block owns the external action.
- Avatar uses size="sm" and shape="rounded" for Tool logos; the component automatically selects rounded-md for this compact size. It displays only trusted bundled @thesvg/icons artwork for Figma, Linear, Vercel, Framer and Loom, or a supplied logoSrc/fallback. Brand artwork retains its source colors; monochrome marks inherit semantic foreground. Never send untrusted SVG to dangerouslySetInnerHTML.
- Category dropdowns use SelectContent's public anchor with the cell wrapper and zero sideOffset, so they open at the cell's bottom edge. Keep native collision handling rather than compensating for trigger padding with negative offsets.
- Container, DataGrid, Avatar, Checkbox, Badge and Button keep their public geometry and state styling. Do not replace component internals, hardcode theme colors or enlarge controls to match the reference video's scale.
- The documentation demo is local memory only. Reloading resets it; no backend is implied.
