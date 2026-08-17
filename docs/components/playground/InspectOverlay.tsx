"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "framer-motion";
import { spring } from "@zeron/ui/system/springs";
import { Tooltip } from "@zeron/ui/tooltip";

// ---------------------------------------------------------------------------
// Inspect overlay — a design-inspector layer for ComponentPreview. It sits
// over the whole preview *frame*: pixel rulers run along the top (above the
// Preview/Code + Inspect toggles) and left, fitting the frame's outer border.
// On hover it measures the deepest element under the cursor — crosshair guide
// lines at its box edges, a green box-model overlay (padding + flex/grid gaps),
// and an FF tooltip with the tag, selector, display, size, padding, and margin.
// Only the content region captures the pointer, so the toggles stay clickable
// and the component underneath is frozen while you inspect it.
// ---------------------------------------------------------------------------

const BLUE = "#6B97FF"; // --focus-ring "clarity" blue
const GREEN = "rgba(153, 255, 201, 0.35)"; // #99FFC9, subtle
const GREEN_LINE = "rgba(83, 214, 145, 0.9)";
// Near-black green for the strip labels — the mint fill reads as pale mint in
// light mode but a medium sea-green over dark surfaces, so a dark label keeps
// contrast in both.
const CONTENT_FILL = "rgba(120, 132, 232, 0.20)";
const BAND = "rgba(107, 151, 255, 0.16)";

/** Space reserved at the top/left of the frame for the rulers. */
export const RULER_TOP = 18;
export const RULER_LEFT = 22;

interface Strip {
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

interface Target {
  left: number;
  top: number;
  width: number;
  height: number;
  content: { left: number; top: number; width: number; height: number };
  padStrips: Strip[];
  gapStrips: Strip[];
  /** Headline: the data-slot name when present (e.g. "card-header"), else the
   *  raw tag (e.g. "SPAN"). */
  anchor: string;
  meta: string;
  padding: string;
  paddingToken: string | null;
  margin: string;
  marginToken: string | null;
  gap: string | null;
  gapToken: string | null;
  radius: string;
  radiusToken: string | null;
  background: string | null;
  backgroundToken: string | null;
  heightToken: string | null;
  /** Type metrics — only set when the element directly wraps text. */
  font: {
    size: string; // "14px / 20px" (font-size / line-height)
    family: string; // first family name, e.g. "Inter"
    weight: string; // computed CSS weight, optionally followed by diagnostic variable axes
    tracking: string; // letter-spacing
    color: string; // resolved text color as hex
    typeToken: string | null;
    colorToken: string | null;
  } | null;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Convert a computed `rgb()/rgba()` color to a #rrggbb hex string. */
function rgbToHex(rgb: string): string {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(rgb);
  if (!m) return rgb;
  const hex = (n: string) =>
    Math.round(parseFloat(n)).toString(16).padStart(2, "0");
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}

/** Collapse a T R B L set into the shortest CSS shorthand. */
function boxShorthand(t: number, r: number, b: number, l: number): string {
  const R = Math.round;
  if (t === r && r === b && b === l) return `${R(t)}px`;
  if (t === b && l === r) return `${R(t)}px ${R(r)}px`;
  return `${R(t)}px ${R(r)}px ${R(b)}px ${R(l)}px`;
}

/** Preserve non-length computed values such as `margin-inline: auto`. */
function computedBoxShorthand(t: string, r: string, b: string, l: string): string {
  if (t === r && r === b && b === l) return t;
  if (t === b && l === r) return `${t} ${r}`;
  if (l === r) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

function arePixelLengths(...values: string[]): boolean {
  return values.every((value) => /^-?(?:[\d.]+|[\d.]+e[+-]?\d+)px$/i.test(value));
}

/**
 * Tailwind v4 derives spacing utilities from the single `--spacing` theme
 * variable: `p-4`, for example, compiles to `calc(var(--spacing) * 4)`.
 * The browser exposes the resolved pixels in computed styles, so restore the
 * documented token notation alongside that value for the inspector.
 */
function spacingToken(px: number): string | null {
  const step = px / 4;
  if (!Number.isFinite(step) || Math.abs(step - Math.round(step * 100) / 100) > 0.001) {
    return null;
  }
  const normalized = Math.round(step * 100) / 100;
  return `--spacing(${normalized})`;
}

/** Collapse four Tailwind spacing references with the same rules as CSS box shorthand. */
function boxTokenShorthand(t: number, r: number, b: number, l: number): string | null {
  const tokens = [spacingToken(t), spacingToken(r), spacingToken(b), spacingToken(l)];
  if (tokens.some((token) => token === null)) return null;
  const [top, right, bottom, left] = tokens as [string, string, string, string];
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && left === right) return `${top} ${right}`;
  if (left === right) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

const radiusTokens = new Map<number, string>([
  [2, "--radius-xs"],
  [4, "--radius-sm"],
  [6, "--radius-md"],
  [8, "--radius-lg"],
  [12, "--radius-xl"],
  [16, "--radius-2xl"],
  [24, "--radius-3xl"],
  [32, "--radius-4xl"],
]);

function radiusToken(px: number): string | null {
  // Tailwind's `rounded-full` is generated from an infinite radius rather
  // than a `--radius-*` theme variable, so name the utility itself.
  if (px > 10_000) return "rounded-full";
  return radiusTokens.get(Math.round(px)) ?? null;
}

function radiusTokenShorthand(t: number, r: number, b: number, l: number): string | null {
  const tokens = [radiusToken(t), radiusToken(r), radiusToken(b), radiusToken(l)];
  if (tokens.some((token) => token === null)) return null;
  const [top, right, bottom, left] = tokens as [string, string, string, string];
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && left === right) return `${top} ${right}`;
  if (left === right) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

function valueWithToken(value: string, token: string | null) {
  return token ? `${value} · ${token}` : value;
}

const typographyTokenByMetrics = new Map<string, string>([
  ["12px / 16px", "--font-size-label · --line-height-label"],
  ["14px / 20px", "--font-size-body · --line-height-body"],
  ["18px / 26px", "--font-size-title · --line-height-title"],
  ["24px / 32px", "--font-size-heading · --line-height-heading"],
]);

function cssVariableInValue(value: string): string | null {
  return /var\(\s*(--[\w-]+)/.exec(value)?.[1] ?? null;
}

function isThemeVariable(variable: string): boolean {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() !== "";
}

/**
 * Recover a semantic variable from the unprefixed Tailwind utility that set
 * it. Computed styles intentionally resolve `var()` calls, so this preserves
 * provenance for the inspector. Text styles can be inherited; backgrounds
 * cannot, hence the caller chooses whether to walk parent elements.
 */
function tokenFromUtility(
  element: HTMLElement,
  utility: "text" | "bg",
  inherited: boolean,
): string | null {
  for (let node: HTMLElement | null = element; node; node = inherited ? node.parentElement : null) {
    const inlineValue = node.style.getPropertyValue(
      utility === "text" ? "color" : "background-color",
    );
    const inlineToken = cssVariableInValue(inlineValue);
    if (inlineToken && isThemeVariable(inlineToken)) return inlineToken;

    for (const className of node.classList) {
      // State and responsive variants do not necessarily apply while the
      // overlay owns the pointer. Only show a token for an unprefixed utility.
      const utilityClass = className.replace(/^!/, "");
      if (utilityClass.includes(":")) continue;

      const arbitraryToken = cssVariableInValue(utilityClass);
      if (utilityClass.startsWith(`${utility}-[`) && arbitraryToken && isThemeVariable(arbitraryToken)) {
        return arbitraryToken;
      }

      if (!utilityClass.startsWith(`${utility}-`)) continue;
      const tokenName = utilityClass.slice(utility.length + 1).split("/")[0];
      const token = `--${tokenName}`;
      if (isThemeVariable(token)) return token;
    }
  }
  return null;
}

function heightTokenFromUtility(element: HTMLElement, renderedHeight: number): string | null {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    for (const className of node.classList) {
      const utility = className.replace(/^!/, "");
      if (utility.includes(":")) continue;
      const match = /^(?:min-|max-)?h-(control|badge)-(xs|sm|md|lg|xl)$/.exec(utility);
      // A background layer often occupies its control parent's whole box. In
      // that case retain the parent's height token, but don't assign it to a
      // smaller text child merely because it inherits the same component.
      if (match && Math.abs(node.getBoundingClientRect().height - renderedHeight) < 0.5) {
        return `--${match[1]}-height-${match[2]}`;
      }
    }
  }
  return null;
}

function isTransparent(color: string): boolean {
  return color === "transparent" || /^rgba?\(0,\s*0,\s*0(?:,\s*0)?\)$/.test(color);
}

export function InspectOverlay({
  frameRef,
  contentRef,
}: {
  frameRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [capture, setCapture] = useState<Box | null>(null);
  const [comp, setComp] = useState<Box | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const rafRef = useRef(0);

  // Track the frame's interior size (for the ruler span) and where the content
  // region sits within it (so only that region captures the pointer).
  useEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;
    const measure = () => {
      const fRect = frame.getBoundingClientRect();
      const iLeft = fRect.left + frame.clientLeft;
      const iTop = fRect.top + frame.clientTop;
      const cRect = content.getBoundingClientRect();
      setSize({ w: frame.clientWidth, h: frame.clientHeight });
      setCapture({
        left: cRect.left - iLeft,
        top: cRect.top - iTop,
        width: cRect.width,
        height: cRect.height,
      });
      // The rendered component (the content region's first child) anchors the
      // ruler's 0,0 and defines where numbers show vs. where the ruler dims.
      const compEl = content.firstElementChild as HTMLElement | null;
      const rRect = compEl ? compEl.getBoundingClientRect() : cRect;
      setComp({
        left: rRect.left - iLeft,
        top: rRect.top - iTop,
        width: rRect.width,
        height: rRect.height,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(content);
    const compEl = content.firstElementChild;
    if (compEl) ro.observe(compEl);
    return () => ro.disconnect();
  }, [frameRef, contentRef]);

  const compute = useCallback(
    (clientX: number, clientY: number) => {
      const frame = frameRef.current;
      const content = contentRef.current;
      if (!frame || !content) return;
      const fRect = frame.getBoundingClientRect();
      const iLeft = fRect.left + frame.clientLeft;
      const iTop = fRect.top + frame.clientTop;

      // Deepest element under the cursor that belongs to the component (skip the
      // overlay's own UI and the content wrapper itself).
      const stack = document.elementsFromPoint(clientX, clientY);
      const el = stack.find(
        (e) =>
          content.contains(e) &&
          e !== content &&
          !e.closest("[data-inspect-ui]")
      ) as HTMLElement | undefined;

      if (!el) {
        setTarget(null);
        return;
      }

      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const pt = parseFloat(cs.paddingTop) || 0;
      const pr = parseFloat(cs.paddingRight) || 0;
      const pb = parseFloat(cs.paddingBottom) || 0;
      const pl = parseFloat(cs.paddingLeft) || 0;
      const mt = parseFloat(cs.marginTop) || 0;
      const mr = parseFloat(cs.marginRight) || 0;
      const mb = parseFloat(cs.marginBottom) || 0;
      const ml = parseFloat(cs.marginLeft) || 0;
      const rtl = parseFloat(cs.borderTopLeftRadius) || 0;
      const rtr = parseFloat(cs.borderTopRightRadius) || 0;
      const rbr = parseFloat(cs.borderBottomRightRadius) || 0;
      const rbl = parseFloat(cs.borderBottomLeftRadius) || 0;
      const marginValues = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft] as const;
      const radiusValues = [
        cs.borderTopLeftRadius,
        cs.borderTopRightRadius,
        cs.borderBottomRightRadius,
        cs.borderBottomLeftRadius,
      ] as const;

      const left = r.left - iLeft;
      const top = r.top - iTop;
      const width = r.width;
      const height = r.height;

      const padStrips: Strip[] = [];
      if (pt > 0) padStrips.push({ left, top, width, height: pt, label: String(Math.round(pt)) });
      if (pb > 0) padStrips.push({ left, top: top + height - pb, width, height: pb, label: String(Math.round(pb)) });
      if (pl > 0) padStrips.push({ left, top: top + pt, width: pl, height: height - pt - pb, label: String(Math.round(pl)) });
      if (pr > 0) padStrips.push({ left: left + width - pr, top: top + pt, width: pr, height: height - pt - pb, label: String(Math.round(pr)) });

      const gapStrips: Strip[] = [];
      const isFlex = cs.display.includes("flex") || cs.display.includes("grid");
      if (isFlex) {
        const kids = Array.from(el.children).map((k) => k.getBoundingClientRect());
        for (let i = 0; i < kids.length - 1; i++) {
          const a = kids[i];
          const b = kids[i + 1];
          const hGap = b.left - a.right;
          const vGap = b.top - a.bottom;
          if (hGap > 1) {
            gapStrips.push({
              left: a.right - iLeft,
              top: Math.min(a.top, b.top) - iTop,
              width: hGap,
              height: Math.max(a.height, b.height),
              label: String(Math.round(hGap)),
            });
          } else if (vGap > 1) {
            gapStrips.push({
              left: Math.min(a.left, b.left) - iLeft,
              top: a.bottom - iTop,
              width: Math.max(a.width, b.width),
              height: vGap,
              label: String(Math.round(vGap)),
            });
          }
        }
      }

      const tag = el.tagName.toLowerCase();
      const slot = el.getAttribute("data-slot");
      // Lead with the semantic part name when there is one; fall back to the
      // raw tag otherwise.
      const anchor = slot ?? el.tagName;

      const flexDir = cs.display.includes("flex")
        ? ` ${cs.flexDirection.startsWith("column") ? "col" : "row"}`
        : "";
      // The tag leads the meta line only when the anchor is a slot name —
      // otherwise the anchor already *is* the tag, so listing it again repeats.
      const meta = `${slot ? `${tag} · ` : ""}${cs.display}${flexDir} · ${Math.round(width)} × ${Math.round(height)}`;

      const gapVal = Math.max(parseFloat(cs.columnGap) || 0, parseFloat(cs.rowGap) || 0);

      // Type metrics, but only when this element directly wraps text (a title,
      // label, paragraph) — not a layout container that merely inherits a font.
      const wrapsText = Array.from(el.childNodes).some(
        (n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0
      );
      let font: Target["font"] = null;
      if (wrapsText) {
        const sizePx = Math.round(parseFloat(cs.fontSize));
        const lh =
          cs.lineHeight === "normal"
            ? "normal"
            : `${Math.round(parseFloat(cs.lineHeight))}px`;
        const family = cs.fontFamily
          .split(",")[0]
          .replace(/["']/g, "")
          .trim();
        const tracking =
          cs.letterSpacing === "normal" || cs.letterSpacing === "0px"
            ? "0"
            : cs.letterSpacing;
        // Standard font-weight is the primary value. Keep variable axes as
        // read-only diagnostic context for external or specially animated text.
        const fvs = cs.fontVariationSettings;
        let weight = cs.fontWeight;
        if (fvs && fvs !== "normal") {
          const wght = /wght["'\s]+([\d.]+)/.exec(fvs)?.[1];
          const opsz = /opsz["'\s]+([\d.]+)/.exec(fvs)?.[1];
          const parts = [
            wght ? `wght ${wght}` : null,
            opsz ? `opsz ${opsz}` : null,
          ].filter(Boolean);
          if (parts.length) weight = `${weight} (${parts.join(" · ")})`;
        }
        font = {
          size: `${sizePx}px / ${lh}`,
          family,
          weight,
          tracking,
          color: rgbToHex(cs.color),
          typeToken: typographyTokenByMetrics.get(`${sizePx}px / ${lh}`) ?? null,
          colorToken: tokenFromUtility(el, "text", true),
        };
      }

      const background = isTransparent(cs.backgroundColor) ? null : rgbToHex(cs.backgroundColor);

      setTarget({
        left,
        top,
        width,
        height,
        content: {
          left: left + pl,
          top: top + pt,
          width: Math.max(0, width - pl - pr),
          height: Math.max(0, height - pt - pb),
        },
        padStrips,
        gapStrips,
        anchor,
        meta,
        padding: boxShorthand(pt, pr, pb, pl),
        paddingToken: boxTokenShorthand(pt, pr, pb, pl),
        margin: computedBoxShorthand(...marginValues),
        marginToken: arePixelLengths(...marginValues) ? boxTokenShorthand(mt, mr, mb, ml) : null,
        gap: isFlex && gapVal > 0 ? `${Math.round(gapVal)}px` : null,
        gapToken: isFlex && gapVal > 0 ? spacingToken(gapVal) : null,
        radius: computedBoxShorthand(...radiusValues),
        radiusToken: arePixelLengths(...radiusValues) ? radiusTokenShorthand(rtl, rtr, rbr, rbl) : null,
        background,
        backgroundToken: background ? tokenFromUtility(el, "bg", false) : null,
        heightToken: heightTokenFromUtility(el, height),
        font,
      });
    },
    [frameRef, contentRef]
  );

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const { clientX, clientY } = e;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => compute(clientX, clientY));
    },
    [compute]
  );

  const clear = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setTarget(null);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const { w, h } = size;
  // The rulers overlay the content instead of reserving a gutter, so the demo
  // never shifts when Inspect toggles. Each ruler occupies the first strip of
  // the content region: the top ruler over [capTop, topStripEnd], the left
  // ruler over [capLeft, leftStripEnd]. The top ruler's ticks still tuck up
  // under the fixed header (masked by its z-40 background). The strip ends are
  // where the other ruler's band starts — used to clear the shared corner.
  const capTop = capture?.top ?? 0;
  const capLeft = capture?.left ?? 0;
  const topStripEnd = capTop + RULER_TOP;
  const leftStripEnd = capLeft + RULER_LEFT;

  // Ruler grid: ticks every 8px anchored at the component's 0,0. Numbers show
  // only at 8px multiples that fall inside the component; ticks continue over
  // the surrounding background at low contrast, without numbers.
  const STEP = 8;
  const LABEL_STEP = 32;
  const { xTicks, yTicks } = useMemo(() => {
    const make = (origin: number, extent: number, total: number) => {
      const out: { pos: number; value: number; inComp: boolean; labeled: boolean }[] = [];
      if (!comp || total <= 0) return out;
      const startK = Math.ceil((0 - origin) / STEP);
      const endK = Math.floor((total - origin) / STEP);
      for (let k = startK; k <= endK; k++) {
        const pos = origin + k * STEP;
        const value = k * STEP;
        const inComp = value >= 0 && value <= extent + 0.5;
        out.push({ pos, value, inComp, labeled: inComp && value % LABEL_STEP === 0 });
      }
      return out;
    };
    return {
      xTicks: make(comp?.left ?? 0, comp?.width ?? 0, w),
      yTicks: make(comp?.top ?? 0, comp?.height ?? 0, h),
    };
  }, [comp, w, h]);

  return (
    <motion.div
      data-inspect-ui
      className="absolute inset-0 z-30 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: spring.moderate.exit }}
      transition={spring.moderate}
    >
      {/* Pointer-capturing region — only over the content, so the header
          toggles stay clickable and the component underneath is frozen. */}
      {capture && (
        <div
          className="absolute pointer-events-auto cursor-crosshair"
          style={{ left: capture.left, top: capture.top, width: capture.width, height: capture.height }}
          onMouseMove={onMove}
          onMouseLeave={clear}
        />
      )}

      {/* Box-model overlay for the hovered element. */}
      {target && (
        <>
          <div
            className="absolute"
            style={{
              left: target.content.left,
              top: target.content.top,
              width: target.content.width,
              height: target.content.height,
              background: CONTENT_FILL,
            }}
          />
          {target.padStrips.map((s, i) => (
            <div
              key={`p${i}`}
              className="absolute flex items-center justify-center"
              style={{ left: s.left, top: s.top, width: s.width, height: s.height, background: GREEN }}
            >
              <span className="text-label font-mono font-semibold leading-none text-fg-default">
                {s.label}
              </span>
            </div>
          ))}
          {target.gapStrips.map((s, i) => (
            <div
              key={`g${i}`}
              className="absolute flex items-center justify-center"
              style={{ left: s.left, top: s.top, width: s.width, height: s.height, background: GREEN, outline: `1px dashed ${GREEN_LINE}`, outlineOffset: -1 }}
            >
              <span className="text-label font-mono font-semibold leading-none text-fg-default">
                {s.label}
              </span>
            </div>
          ))}
          {/* Crosshair guides at the four box edges */}
          {[target.left, target.left + target.width].map((x, i) => (
            <div key={`vx${i}`} className="absolute top-0 bottom-0" style={{ left: x, width: 1, background: BLUE, opacity: 0.55 }} />
          ))}
          {[target.top, target.top + target.height].map((y, i) => (
            <div key={`hy${i}`} className="absolute left-0 right-0" style={{ top: y, height: 1, background: BLUE, opacity: 0.55 }} />
          ))}
        </>
      )}

      {/* Top ruler — sits in the gutter just below the header. The ticks run up
          past the top of the gutter (negative y) so they tuck under the opaque
          header (z-40); the numbers sit below the ticks with ~2px of breathing
          room above them. overflow:visible lets the ticks bleed under. */}
      <motion.div
        className="absolute inset-0"
        initial={{ y: -4 }}
        animate={{ y: 0 }}
        exit={{ y: -4, transition: spring.moderate.exit }}
        transition={spring.moderate}
      >
        <svg width={w} height={RULER_TOP} className="absolute left-0" style={{ top: capTop, overflow: "visible" }}>
          {target && <rect x={Math.max(target.left, leftStripEnd)} y={0} width={target.width - Math.max(0, leftStripEnd - target.left)} height={RULER_TOP} fill={BAND} />}
          {xTicks.filter((t) => t.pos >= leftStripEnd).map((t, i) => (
            <line key={i} x1={t.pos} y1={-6} x2={t.pos} y2={6} stroke={BLUE} strokeWidth={1} opacity={t.inComp ? (t.labeled ? 0.9 : 0.45) : 0.16} />
          ))}
          {xTicks.filter((t) => t.labeled && t.pos >= leftStripEnd).map((t, i) => (
            <text key={`l${i}`} x={t.pos} y={16} fontSize={9} fill={BLUE} fontFamily="monospace" textAnchor="middle">
              {t.value}
            </text>
          ))}
        </svg>
      </motion.div>

      {/* Left ruler — ticks sit on the outer (left) edge; the rotated numbers
          sit on the inner (right) edge next to the content, mirroring the top
          ruler where the numbers face the content. */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: -4 }}
        animate={{ x: 0 }}
        exit={{ x: -4, transition: spring.moderate.exit }}
        transition={spring.moderate}
      >
        <svg width={RULER_LEFT} height={h} className="absolute top-0" style={{ left: capLeft, overflow: "visible" }}>
          {target && <rect x={0} y={Math.max(target.top, topStripEnd)} width={RULER_LEFT} height={target.height - Math.max(0, topStripEnd - target.top)} fill={BAND} />}
          {yTicks.filter((t) => t.pos >= topStripEnd).map((t, i) => (
            <line key={i} x1={0} y1={t.pos} x2={6} y2={t.pos} stroke={BLUE} strokeWidth={1} opacity={t.inComp ? (t.labeled ? 0.9 : 0.45) : 0.16} />
          ))}
          {yTicks.filter((t) => t.labeled && t.pos >= topStripEnd).map((t, i) => (
            <text
              key={`l${i}`}
              x={16}
              y={t.pos}
              fontSize={9}
              fill={BLUE}
              fontFamily="monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(-90 16 ${t.pos})`}
            >
              {t.value}
            </text>
          ))}
        </svg>
      </motion.div>

      {/* Info tooltip — the FF Tooltip, anchored to the hovered element. */}
      {target && (
        <Tooltip
          forceOpen
          side="top"
          sideOffset={8}
          content={
            <div className="font-mono text-label leading-[1.55] normal-case tracking-normal">
              <div className="font-semibold" style={{ color: BLUE }}>
                {target.anchor}
              </div>
              <div>{target.meta}</div>
              {target.heightToken && <div>height {valueWithToken(`${Math.round(target.height)}px`, target.heightToken)}</div>}
              {target.background && <div>background {valueWithToken(target.background, target.backgroundToken)}</div>}
              <div>
                padding {valueWithToken(target.padding, target.paddingToken)}
              </div>
              <div>
                margin {valueWithToken(target.margin, target.marginToken)}
              </div>
              {target.gap && <div>gap {valueWithToken(target.gap, target.gapToken)}</div>}
              {target.radius !== "0px" && (
                <div>radius {valueWithToken(target.radius, target.radiusToken)}</div>
              )}
              {target.font && (
                <>
                  <div>font {valueWithToken(target.font.size, target.font.typeToken)}</div>
                  <div>
                    {target.font.family} · {target.font.weight}
                  </div>
                  <div>
                    tracking {target.font.tracking} · color {valueWithToken(target.font.color, target.font.colorToken)}
                  </div>
                </>
              )}
            </div>
          }
          className="!px-3.5 !py-4 max-w-[240px]"
        >
          <div
            className="absolute"
            style={{ left: target.left, top: target.top, width: Math.max(1, target.width), height: Math.max(1, target.height) }}
          />
        </Tooltip>
      )}
    </motion.div>
  );
}
