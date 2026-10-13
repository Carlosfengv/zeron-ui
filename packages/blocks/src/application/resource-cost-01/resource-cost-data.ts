import type { ExpandedState } from "@tanstack/react-table";
import type { ResourceCostAvailability, ResourceCostItem, ResourceCostKind, ResourceCostRow } from "./resource-cost-types";

const availabilityRank: Record<ResourceCostAvailability, number> = { available: 0, reserved: 1, provisioning: 2, limited: 3 };
const resourceKinds = new Set<ResourceCostKind>(["cluster", "pool", "gpu", "compute", "storage", "network"]);
const zero = BigInt(0); const two = BigInt(2); const ten = BigInt(10);

function decimalParts(value: number) {
  const [mantissa, exponent = "0"] = value.toString().split("e");
  const [whole, fraction = ""] = mantissa.split(".");
  return { coefficient: BigInt(whole + fraction), exponent: Number(exponent) - fraction.length };
}

/** Decimal HALF_UP avoids binary floating-point ties such as 1.005 * 100. */
function minorCost(quantity: number, unitCost: number, fractionDigits: number) {
  const quantityParts = decimalParts(quantity);
  const priceParts = decimalParts(unitCost);
  const numerator = quantityParts.coefficient * priceParts.coefficient;
  const exponent = quantityParts.exponent + priceParts.exponent + fractionDigits;
  if (exponent >= 0) return numerator * ten ** BigInt(exponent);
  const denominator = ten ** BigInt(-exponent);
  return (numerator * two + denominator) / (denominator * two);
}

function mainCurrencyUnits(minor: bigint, fractionDigits: number) {
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Resource cost exceeds supported precision.");
  const value = Number(minor) / 10 ** fractionDigits;
  if (minorCost(1, value, fractionDigits) !== minor) throw new Error("Resource cost cannot be represented precisely.");
  return value;
}

function validateFractionDigits(fractionDigits: number) {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 20) throw new Error("Invalid currency precision.");
}

export function getResourceCostTotal(rows: readonly ResourceCostRow[], fractionDigits = 2) {
  validateFractionDigits(fractionDigits);
  return mainCurrencyUnits(rows.reduce((sum, row) => sum + minorCost(1, row.totalCost, fractionDigits), zero), fractionDigits);
}

/** Round leaf prices to currency precision before aggregating. Never sum parent costs again. */
export function calculateResourceCosts(items: readonly ResourceCostItem[], fractionDigits = 2): ResourceCostRow[] {
  validateFractionDigits(fractionDigits);
  const ids = new Set<string>();
  function visit(item: ResourceCostItem): { row: ResourceCostRow; minor: bigint } {
    if (typeof item.id !== "string" || !item.id.trim() || ids.has(item.id)) throw new Error("Resource IDs must be unique nonempty strings.");
    ids.add(item.id);
    if (typeof item.name !== "string" || typeof item.code !== "string" || !resourceKinds.has(item.kind) ||
      (item.availability !== undefined && !Object.hasOwn(availabilityRank, item.availability))) throw new Error("Invalid resource type or availability.");
    if (!Number.isFinite(item.quantity) || item.quantity < 0 ||
      !Number.isInteger(item.readyInDays ?? 0) || (item.readyInDays ?? 0) < 0) throw new Error("Invalid resource quantity or lead time.");
    const visitedChildren = item.children?.length ? item.children.map(visit) : undefined;
    const children = visitedChildren?.map(({ row }) => row);
    if (!children && (!Number.isFinite(item.unitCost) || item.unitCost! < 0)) throw new Error("Leaf resources require a nonnegative finite unit price.");
    const minor = visitedChildren
      ? visitedChildren.reduce((sum, child) => sum + child.minor, zero)
      : minorCost(item.quantity, item.unitCost!, fractionDigits);
    const availability = children
      ? children.reduce<ResourceCostAvailability>((worst, row) => availabilityRank[row.availability] > availabilityRank[worst] ? row.availability : worst, "available")
      : item.availability ?? "available";
    const row = { ...item, children, isGroup: Boolean(children), totalCost: mainCurrencyUnits(minor, fractionDigits), availability,
      readyInDays: children ? children.reduce((max, child) => Math.max(max, child.readyInDays), 0) : item.readyInDays ?? 0,
      leafCount: children ? children.reduce((sum, row) => sum + row.leafCount, 0) : 1,
      riskCount: children ? children.reduce((sum, row) => sum + row.riskCount, 0) : Number(availability === "limited" || availability === "provisioning") };
    return { row, minor };
  }
  const visited = items.map(visit);
  mainCurrencyUnits(visited.reduce((sum, item) => sum + item.minor, zero), fractionDigits);
  return visited.map(({ row }) => row);
}

/** Retain matching descendants and their ancestors, without changing original aggregate costs. */
export function filterResourceCosts(rows: readonly ResourceCostRow[], search: string, availability: ResourceCostAvailability | "all", ancestorMatches = false): ResourceCostRow[] {
  const term = search.trim().toLocaleLowerCase();
  return rows.flatMap((row) => {
    const matchesSearch = ancestorMatches || !term || `${row.name} ${row.code}`.toLocaleLowerCase().includes(term);
    const children = row.children ? filterResourceCosts(row.children, search, availability, matchesSearch) : undefined;
    const matchesStatus = availability === "all" || row.availability === availability;
    if (!children?.length && !(matchesSearch && matchesStatus && !row.isGroup)) return [];
    return [{ ...row, children }];
  });
}

export function resourceCostExpansion(rows: readonly ResourceCostRow[], depth: number | "all"): ExpandedState {
  if (depth === "all") return true;
  const maxDepth = depth;
  const expanded: Record<string, boolean> = {};
  function visit(items: readonly ResourceCostRow[], level: number) {
    for (const item of items) {
      if (item.children?.length && level < maxDepth) {
        expanded[item.id] = true;
        visit(item.children, level + 1);
      }
    }
  }
  visit(rows, 0);
  return expanded;
}
