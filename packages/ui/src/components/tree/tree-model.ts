import type { TreeKey, TreeNode, TreeRow } from "./tree-types";

export interface TreeModel<T> {
  nodes: ReadonlyMap<TreeKey, TreeNode<T>>;
  parents: ReadonlyMap<TreeKey, TreeKey | null>;
  rows: readonly TreeRow<T>[];
  rowsByKey: ReadonlyMap<TreeKey, TreeRow<T>>;
  children: ReadonlyMap<TreeKey, readonly TreeKey[]>;
}

export function buildTreeModel<T>(items: readonly TreeNode<T>[]): TreeModel<T> {
  const nodes = new Map<TreeKey, TreeNode<T>>();
  const parents = new Map<TreeKey, TreeKey | null>();
  const rows: TreeRow<T>[] = [];
  const rowsByKey = new Map<TreeKey, TreeRow<T>>();
  const children = new Map<TreeKey, readonly TreeKey[]>();
  const visiting = new Set<TreeNode<T>>();

  const walk = (
    siblings: readonly TreeNode<T>[],
    parentKey: TreeKey | null,
    level: number,
    ancestorDisabled: boolean,
  ): TreeKey[] => {
    const siblingKeys: TreeKey[] = [];
    siblings.forEach((node, index) => {
      if (!node.key) throw new Error("Tree node keys must be non-empty strings.");
      if (!node.label) throw new Error(`Tree node \"${node.key}\" must have a non-empty label.`);
      if (visiting.has(node)) throw new Error(`Tree contains a circular reference at \"${node.key}\".`);
      if (nodes.has(node.key)) throw new Error(`Tree node key \"${node.key}\" is duplicated.`);

      visiting.add(node);
      nodes.set(node.key, node);
      parents.set(node.key, parentKey);
      const row: TreeRow<T> = {
        key: node.key,
        node,
        parentKey,
        level,
        position: index + 1,
        setSize: siblings.length,
        disabled: ancestorDisabled || Boolean(node.disabled),
      };
      rows.push(row);
      rowsByKey.set(node.key, row);
      const childKeys = node.children?.length
        ? walk(node.children, node.key, level + 1, ancestorDisabled || Boolean(node.disabled))
        : [];
      children.set(node.key, childKeys);
      siblingKeys.push(node.key);
      visiting.delete(node);
    });
    return siblingKeys;
  };

  walk(items, null, 1, false);
  return { nodes, parents, rows, rowsByKey, children };
}

/** Returns one branch in preorder without retaining descendant lists for every node. */
export function subtreeKeys<T>(model: TreeModel<T>, key: TreeKey): readonly TreeKey[] {
  if (!model.nodes.has(key)) return [];
  const result: TreeKey[] = [];
  const pending = [key];
  while (pending.length) {
    const current = pending.pop()!;
    result.push(current);
    const children = model.children.get(current) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
  }
  return result;
}

export function matchedKeys<T>(
  model: TreeModel<T>,
  query: string,
  filterNode?: (node: TreeNode<T>, normalizedQuery: string) => boolean,
): ReadonlySet<TreeKey> {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return new Set(model.nodes.keys());
  const matched = new Set<TreeKey>();
  for (const row of model.rows) {
    const defaultMatch = [row.node.label, ...(row.node.keywords ?? [])]
      .some((value) => value.toLocaleLowerCase().includes(normalized));
    if (filterNode ? filterNode(row.node, normalized) : defaultMatch) matched.add(row.key);
  }
  return matched;
}

export function filteredKeys<T>(model: TreeModel<T>, directMatches: ReadonlySet<TreeKey>): ReadonlySet<TreeKey> {
  const visible = new Set<TreeKey>();
  for (const key of directMatches) {
    let current: TreeKey | null | undefined = key;
    while (current) {
      visible.add(current);
      current = model.parents.get(current);
    }
  }
  return visible;
}

export function visibleRows<T>(
  model: TreeModel<T>,
  expanded: ReadonlySet<TreeKey>,
  included: ReadonlySet<TreeKey>,
  forcedExpanded: ReadonlySet<TreeKey>,
): readonly TreeRow<T>[] {
  const visible: TreeRow<T>[] = [];
  const openParents = new Set<TreeKey>();
  for (const row of model.rows) {
    if (!included.has(row.key)) continue;
    if (row.parentKey && !openParents.has(row.parentKey)) continue;
    visible.push(row);
    if (row.node.children?.length && (expanded.has(row.key) || forcedExpanded.has(row.key))) openParents.add(row.key);
  }
  return visible;
}

export function matchingAncestors<T>(model: TreeModel<T>, directMatches: ReadonlySet<TreeKey>): ReadonlySet<TreeKey> {
  const ancestors = new Set<TreeKey>();
  for (const key of directMatches) {
    let current = model.parents.get(key);
    while (current) {
      ancestors.add(current);
      current = model.parents.get(current);
    }
  }
  return ancestors;
}
