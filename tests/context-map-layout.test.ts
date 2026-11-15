import { describe, expect, it } from "vitest";
import { getCompactionFates, getContextBlocks, layoutContextMap } from "../packages/ui/src/components/context-map/data";
import type { ContextBlock } from "../packages/ui/src/components/context-map/data";

describe("Context Map layout", () => {
  it.each([[672, 272], [265, 213]])("preserves order and proportional area at %i × %i", (width, height) => {
    const weights = [6200, 14800, 9400, 17600, 152000];
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const tiles = layoutContextMap(weights, width, height);

    expect(tiles).toHaveLength(weights.length);
    for (const [index, tile] of tiles.entries()) {
      expect(tile.width * tile.height / (width * height)).toBeCloseTo(weights[index] / total, 8);
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.x + tile.width).toBeLessThanOrEqual(width + 1e-9);
      expect(tile.y + tile.height).toBeLessThanOrEqual(height + 1e-9);
      for (const other of tiles.slice(index + 1)) {
        const overlapX = Math.min(tile.x + tile.width, other.x + other.width) - Math.max(tile.x, other.x);
        const overlapY = Math.min(tile.y + tile.height, other.y + other.height) - Math.max(tile.y, other.y);
        expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(1e-9);
      }
    }
  });

  it("counts only valid tiles from the before snapshot in the compaction summary", () => {
    const blocks: ContextBlock[] = [
      { id: "system", kind: "system", label: "System", tokens: 600 },
      { id: "chat", kind: "chat", label: "Chat", tokens: 800 },
      { id: "output", kind: "result", label: "Result", tokens: 200 },
      { id: "output", kind: "result", label: "Duplicate", tokens: 300 },
      { id: "empty", kind: "file", label: "Empty", tokens: 0 },
      { id: "invalid", kind: "file", label: "Invalid", tokens: Infinity },
    ];
    const before = getContextBlocks(blocks);
    expect(before.map(({ id }) => id)).toEqual(["system", "chat", "output"]);
    expect(getCompactionFates(before, {
      before: blocks, summarized: ["chat", "missing"], dropped: ["output"],
    }).totals).toEqual({
      kept: { count: 1, tokens: 600 },
      summarized: { count: 1, tokens: 800 },
      dropped: { count: 1, tokens: 200 },
    });
  });
});
