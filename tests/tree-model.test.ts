import { describe, expect, it } from "vitest";
import { buildTreeModel, filteredKeys, matchedKeys, matchingAncestors, visibleRows } from "../packages/ui/src/components/tree/tree-model";
import { checkState, nextSelection } from "../packages/ui/src/components/tree/tree-selection";
import type { TreeNode } from "../packages/ui/src/components/tree/tree-types";

const items: readonly TreeNode[] = [
  {
    key: "product",
    label: "Product",
    selectable: false,
    children: [
      { key: "lin", label: "Lin" },
      { key: "zhou", label: "Zhou" },
      { key: "vendor", label: "Vendor", disabled: true, children: [{ key: "wu", label: "Wu" }] },
    ],
  },
];

describe("tree model", () => {
  it("indexes hierarchy, filters matches, and keeps their ancestor paths", () => {
    const model = buildTreeModel(items);
    const matched = matchedKeys(model, "zhou");
    expect([...matched]).toEqual(["zhou"]);
    expect([...filteredKeys(model, matched)]).toEqual(["zhou", "product"]);
    expect([...matchingAncestors(model, matched)]).toEqual(["product"]);
    expect(visibleRows(model, new Set(), filteredKeys(model, matched), matchingAncestors(model, matched)).map((row) => row.key))
      .toEqual(["product", "zhou"]);
  });

  it("rejects duplicate keys rather than silently replacing a node", () => {
    expect(() => buildTreeModel([{ key: "same", label: "A" }, { key: "same", label: "B" }]))
      .toThrow('Tree node key "same" is duplicated.');
  });

  it("cascades through eligible descendants and excludes disabled branches", () => {
    const model = buildTreeModel(items);
    const selected = nextSelection(model, [], "product", "multiple", "cascade", "leaf");
    expect(selected).toEqual(["lin", "zhou"]);
    expect(checkState(model, "product", new Set(["lin"]), "leaf", "cascade")).toBe("mixed");
    expect(nextSelection(model, selected, "product", "multiple", "cascade", "leaf")).toEqual([]);
  });
});
