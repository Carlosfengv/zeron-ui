import type { TreeModel } from "./tree-model";
import type { TreeKey, TreeNode } from "./tree-types";

export function eligibleKeys<T>(
  model: TreeModel<T>,
  key: TreeKey,
  selectionScope: "all" | "leaf",
): readonly TreeKey[] {
  const targets: TreeKey[] = [];
  const pending = [key];
  while (pending.length) {
    const candidateKey = pending.pop()!;
    const row = model.rowsByKey.get(candidateKey);
    if (row && !row.disabled && row.node.selectable !== false
      && (selectionScope === "all" || !(model.children.get(candidateKey)?.length))) {
      targets.push(candidateKey);
    }
    const children = model.children.get(candidateKey) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
  }
  return targets;
}

export function checkStates<T>(
  model: TreeModel<T>,
  selected: ReadonlySet<TreeKey>,
  selectionScope: "all" | "leaf",
  strategy: "independent" | "cascade",
): ReadonlyMap<TreeKey, boolean | "mixed"> {
  const states = new Map<TreeKey, boolean | "mixed">();
  if (strategy === "independent") {
    for (const row of model.rows) states.set(row.key, selected.has(row.key));
    return states;
  }

  const counts = new Map<TreeKey, { eligible: number; selected: number }>();
  for (const row of [...model.rows].reverse()) {
    const isLeaf = !(model.children.get(row.key)?.length);
    const selectable = !row.disabled && row.node.selectable !== false && (selectionScope === "all" || isLeaf);
    let eligible = selectable ? 1 : 0;
    let selectedCount = selectable && selected.has(row.key) ? 1 : 0;
    for (const childKey of model.children.get(row.key) ?? []) {
      const child = counts.get(childKey);
      if (!child) continue;
      eligible += child.eligible;
      selectedCount += child.selected;
    }
    counts.set(row.key, { eligible, selected: selectedCount });
    states.set(row.key, selectedCount === 0 ? false : selectedCount === eligible ? true : "mixed");
  }
  return states;
}

export function checkState<T>(
  model: TreeModel<T>,
  key: TreeKey,
  selected: ReadonlySet<TreeKey>,
  selectionScope: "all" | "leaf",
  strategy: "independent" | "cascade",
): boolean | "mixed" {
  if (strategy === "independent") return selected.has(key);
  return checkStates(model, selected, selectionScope, strategy).get(key) ?? false;
}

export function nextSelection<T>(
  model: TreeModel<T>,
  selectedKeys: readonly TreeKey[],
  key: TreeKey,
  mode: "single" | "multiple",
  strategy: "independent" | "cascade",
  selectionScope: "all" | "leaf",
): readonly TreeKey[] {
  const current = new Set(selectedKeys);
  const targets = strategy === "cascade"
    ? eligibleKeys(model, key, selectionScope)
    : eligibleKeys(model, key, selectionScope).includes(key) ? [key] : [];
  if (!targets.length) return selectedKeys;
  if (mode === "single") return [key];
  const everyTargetSelected = targets.every((target) => current.has(target));
  for (const target of targets) {
    if (everyTargetSelected) current.delete(target);
    else current.add(target);
  }
  return orderKeys(model, current);
}

export function orderKeys<T>(model: TreeModel<T>, keys: ReadonlySet<TreeKey>): readonly TreeKey[] {
  return model.rows.filter((row) => keys.has(row.key)).map((row) => row.key)
    .concat([...keys].filter((key) => !model.nodes.has(key)));
}

export function selectionDetails<T>(
  model: TreeModel<T>,
  previous: readonly TreeKey[],
  next: readonly TreeKey[],
  triggerKey: TreeKey,
  reason: "pointer" | "keyboard",
) {
  const before = new Set(previous);
  const after = new Set(next);
  return {
    reason,
    triggerKey,
    addedKeys: next.filter((key) => !before.has(key)),
    removedKeys: previous.filter((key) => !after.has(key)),
    selectedNodes: next.flatMap((key) => {
      const node: TreeNode<T> | undefined = model.nodes.get(key);
      return node ? [node] : [];
    }),
    unresolvedKeys: next.filter((key) => !model.nodes.has(key)),
  };
}
