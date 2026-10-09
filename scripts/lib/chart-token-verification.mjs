import assert from "node:assert/strict";

const chartPalette = {
  light: ["#0060D2", "#06B6D4", "#F59E0B", "#10B981", "#8B5CF6", "#D4D4D4", "#EF4444"],
  dark: ["#1483FD", "#22D3EE", "#FBBF24", "#34D399", "#A78BFA", "#A3A3A3", "#F87171"],
};

/** Check shared geometry against live theme variables and the original data weights. */
export async function verifySegmentedBarGeometry(page, { scope = "body", requireBars = false } = {}) {
  const bars = await page.evaluate((scope) => {
    const host = document.querySelector(scope);
    if (!host) throw Error(`Missing chart scope: ${scope}`);
    const probe = document.createElement("div");
    probe.hidden = true;
    probe.style.borderRadius = "var(--radius-sm)";
    probe.style.columnGap = "calc(var(--spacing) * 0.5)";
    host.append(probe);
    const expectedRadius = getComputedStyle(probe).borderRadius;
    const expectedGap = parseFloat(getComputedStyle(probe).columnGap);
    probe.remove();
    return [...host.querySelectorAll('[data-slot="segmented-bar"], [data-slot="storage-usage-bar"]')]
      .filter((bar) => bar.getBoundingClientRect().width > 0 && bar.getBoundingClientRect().height > 0)
      .map((bar) => {
        const style = getComputedStyle(bar);
        const rect = bar.getBoundingClientRect();
        return {
          width: rect.width, radius: style.borderRadius, gap: parseFloat(style.columnGap), expectedRadius, expectedGap,
          hidden: [...bar.children].filter((segment) => segment.hidden).map((segment) => ({ width: segment.getBoundingClientRect().width, display: getComputedStyle(segment).display })),
          segments: [...bar.children].filter((segment) => !segment.hidden).map((segment) => {
            const bounds = segment.getBoundingClientRect();
            return { width: bounds.width, left: bounds.left - rect.left, weight: parseFloat(segment.style.flexGrow), radius: getComputedStyle(segment).borderRadius };
          }),
        };
      });
  }, scope);
  if (requireBars) assert.ok(bars.length > 0, "The consumer must render an actual segmented bar");
  for (const bar of bars) {
    assert.equal(bar.radius, bar.expectedRadius, "SegmentedBar uses the sm radius token");
    assert.equal(bar.gap, bar.expectedGap, "SegmentedBar uses gap-0.5");
    for (const segment of bar.hidden) {
      assert.equal(segment.width, 0, "Hidden segments consume no width");
      assert.equal(segment.display, "none", "Hidden segments consume no gap");
    }
    const weight = bar.segments.reduce((sum, segment) => sum + segment.weight, 0);
    const available = bar.width - Math.max(0, bar.segments.length - 1) * bar.gap;
    for (const [index, segment] of bar.segments.entries()) {
      assert.equal(segment.radius, bar.expectedRadius, "Each data and remainder segment uses sm");
      assert.ok(Math.abs(segment.width - available * segment.weight / weight) < 0.1, "Segment widths retain original data proportions after spacing");
      if (index > 0) {
        const previous = bar.segments[index - 1];
        assert.ok(Math.abs(segment.left - previous.left - previous.width - bar.gap) < 0.1, "Every visible pair has the expected gap");
      }
    }
  }
  return bars;
}

/** Check compiled colors and live CSS overrides on real installed or workspace charts. */
export async function verifyChartTokenColors(page, { theme, scope = "body", requireMarks = true } = {}) {
  const result = await page.evaluate(({ theme, scope, palette }) => {
    const root = document.documentElement;
    const host = document.querySelector(scope);
    if (!host) throw Error(`Missing chart scope: ${scope}`);
    const probes = document.createElement("div");
    probes.hidden = true;
    probes.dataset.chartTokenProbes = "";
    host.append(probes);
    function color(value) {
      const probe = document.createElement("span");
      probe.style.backgroundColor = value;
      probes.append(probe);
      const resolved = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return resolved;
    }
    const paletteValues = palette.map((hex) => color(hex));
    const tokenValues = palette.map((_, index) => color(`var(--chart-${index + 1})`));
    const marks = [];
    const paintProperties = ["backgroundColor", "fill", "stroke", "stopColor"];
    for (const node of host.querySelectorAll("*")) {
      if (!node.style || node.closest("[data-chart-token-probes]")) continue;
      const aliases = new Map();
      const chart = node.closest("[data-chart]");
      for (const match of (chart?.querySelector("style")?.textContent ?? "").matchAll(/--(color-[^:;{}\s]+):\s*var\(--chart-([1-7])\)/gu)) aliases.set(`--${match[1]}`, Number(match[2]));
      for (const property of paintProperties) {
        const attribute = property === "stopColor" ? "stop-color" : property;
        const raw = node.style[property] || node.getAttribute(attribute) || "";
        const variable = raw.match(/^var\((--[^,)\s]+)\)$/u)?.[1];
        const slot = variable?.match(/^--chart-([1-7])$/u)?.[1] ?? aliases.get(variable);
        if (slot) marks.push({ node, property, slot: Number(slot), alpha: 100 });
      }
      for (const name of node.classList) {
        const match = name.match(/^bg-chart-([1-7])(?:\/(\d+))?$/u);
        if (match) marks.push({ node, property: "backgroundColor", slot: Number(match[1]), alpha: Number(match[2] ?? 100) });
      }
    }
    function check() {
      return marks.map(({ node, property, slot, alpha }) => {
        const expected = color(alpha === 100 ? `var(--chart-${slot})` : `color-mix(in oklab, var(--chart-${slot}) ${alpha}%, transparent)`);
        return { slot, property, alpha, expected, actual: getComputedStyle(node)[property] };
      });
    }
    const original = check();
    const independentBefore = ["brand", "fg-success", "fg-danger", "muted"].map((name) => color(`var(--${name})`));
    const overrides = [];
    try {
      for (const slot of new Set(marks.map((mark) => mark.slot))) {
        const name = `--chart-${slot}`;
        const value = root.style.getPropertyValue(name);
        const priority = root.style.getPropertyPriority(name);
        try {
          root.style.setProperty(name, "#E879F9");
          const paints = check();
          const changed = paints.filter((paint, index) => paint.slot === slot && paint.actual !== original[index].actual).length;
          const unrelatedChanged = paints.filter((paint, index) => paint.slot !== slot && paint.actual !== original[index].actual).length;
          const independent = ["brand", "fg-success", "fg-danger", "muted"].map((key) => color(`var(--${key})`));
          overrides.push({ slot, expectedChanges: marks.filter((mark) => mark.slot === slot).length, changed, unrelatedChanged, paints, independent });
        } finally {
          if (value) root.style.setProperty(name, value, priority);
          else root.style.removeProperty(name);
        }
      }
      return { theme, paletteValues, tokenValues, original, overrides, independentBefore };
    } finally {
      probes.remove();
    }
  }, { theme, scope, palette: chartPalette[theme] });
  assert.deepEqual(result.tokenValues, result.paletteValues, `${theme}: installed chart palette`);
  if (requireMarks) assert.ok(result.original.length > 0, "Actual charts must read global slots");
  for (const paint of result.original) assert.equal(paint.actual, paint.expected, `${theme}: ${paint.property} reads chart-${paint.slot}`);
  for (const override of result.overrides) {
    assert.equal(override.changed, override.expectedChanges, `All chart-${override.slot} marks update live`);
    assert.equal(override.unrelatedChanged, 0, "Other slots remain unchanged");
    assert.deepEqual(override.independent, result.independentBefore, "Brand, status and tracks remain independent");
    for (const paint of override.paints) assert.equal(paint.actual, paint.expected, `Overridden chart-${paint.slot}`);
  }
  return { theme, marks: result.original.length, slots: [...new Set(result.original.map((paint) => paint.slot))], overrides: result.overrides.map(({ slot, expectedChanges, changed, unrelatedChanged }) => ({ slot, expectedChanges, changed, unrelatedChanged })) };
}
