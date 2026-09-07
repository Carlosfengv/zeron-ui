import { describe, expect, it } from "vitest";
import { buildTreeModel, subtreeKeys } from "../packages/ui/src/components/tree/tree-model";
import { checkStates, nextSelection, orderKeys } from "../packages/ui/src/components/tree/tree-selection";
import type { TreeNode } from "../packages/ui/src/components/tree/tree-types";

const hierarchy: readonly TreeNode[] = [{
  key: "team", label: "Team", selectable: false,
  children: [
    { key: "ada", label: "Ada" },
    { key: "blocked", label: "Blocked", disabled: true, children: [{ key: "hidden", label: "Hidden" }] },
    { key: "grace", label: "Grace" },
  ],
}];

describe("tree selection algorithms", () => {
  it("keeps independent parent and child selections separate", () => {
    const model = buildTreeModel([{ key: "parent", label: "Parent", children: [{ key: "child", label: "Child" }] }]);
    expect(nextSelection(model, [], "parent", "multiple", "independent", "all")).toEqual(["parent"]);
    expect(nextSelection(model, ["parent"], "child", "multiple", "independent", "all")).toEqual(["parent", "child"]);
  });

  it("derives cascade state in one hierarchy pass and respects disabled barriers", () => {
    const model = buildTreeModel(hierarchy);
    expect(nextSelection(model, [], "team", "multiple", "cascade", "leaf")).toEqual(["ada", "grace"]);
    const states = checkStates(model, new Set(["ada"]), "leaf", "cascade");
    expect(states.get("team")).toBe("mixed");
    expect(states.get("blocked")).toBe(false);
    expect(subtreeKeys(model, "team")).toEqual(["team", "ada", "blocked", "hidden", "grace"]);
  });

  it("preserves unknown selected keys in the deterministic callback order", () => {
    const model = buildTreeModel([{ key: "b", label: "B" }, { key: "a", label: "A" }]);
    expect(orderKeys(model, new Set(["a", "missing", "b"]))).toEqual(["b", "a", "missing"]);
  });

  it("accepts empty branches and does not mutate input nodes", () => {
    const items: readonly TreeNode[] = [{ key: "empty", label: "Empty", children: [] }];
    const frozen = Object.freeze(items.map((item) => Object.freeze({ ...item })));
    const model = buildTreeModel(frozen);
    expect(model.children.get("empty")).toEqual([]);
    expect(nextSelection(model, [], "empty", "multiple", "cascade", "leaf")).toEqual(["empty"]);
    expect(frozen[0]).toEqual({ key: "empty", label: "Empty", children: [] });
  });

  it("rejects an object cycle instead of recursing indefinitely", () => {
    const circular: TreeNode = { key: "root", label: "Root" };
    circular.children = [circular];
    expect(() => buildTreeModel([circular])).toThrow('Tree contains a circular reference at "root".');
  });
});
