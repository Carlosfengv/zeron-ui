"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { usePresence, type MotionValue } from "motion/react";
import { spring } from "#system/springs";

const glyphs = "·.:+=*x#o/@%vm";
const glyphFont = "9.5px ui-monospace, monospace";
const glyphWidth = 5.8;
const glyphHeight = 7.4;
const glyphCenterOffset = glyphHeight * 0.42;
const dotSpacing = 4.9;
const dotRadius = 1.24;
const flightDuration = (spring.slow.duration + spring.fast.duration) * 1000;
const revealStart = flightDuration * 0.82;
const revealDuration = flightDuration + spring.fast.duration * 1000;
const releaseSpread = (revealDuration - flightDuration) * 0.9;
const revisionFade = spring.fast.duration * 1000;
const waveExit = spring.slow.exit.duration * 1000;
const animatedCharacterLimit = 48;
const graphemeSegmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : undefined;

type VoiceAnimation = "ascii" | "dots";

interface TextRange {
  from: number;
  to: number;
}

interface TextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GlyphTarget {
  xRatio: number;
  yRatio: number;
}

interface FlyingGlyph {
  target: GlyphTarget;
  delay: number;
  sway: number;
  crestPosition: number;
  origin?: {
    x: number;
    y: number;
    radius: number;
    character: string;
  };
}

interface CharacterMorph extends TextRange {
  regions: TextRegion[];
  flight?: { startedAt: number; glyphs: FlyingGlyph[]; retiredAt?: number };
}

function graphemes(text: string) {
  if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
  return Array.from(text);
}

function findVoiceTextChange(previous: string, next: string) {
  const before = graphemes(previous);
  const after = graphemes(next);
  let prefix = 0;
  let from = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) {
    from += after[prefix].length;
    prefix++;
  }

  let previousEnd = before.length;
  let nextEnd = after.length;
  let suffixLength = 0;
  while (previousEnd > prefix && nextEnd > prefix && before[previousEnd - 1] === after[nextEnd - 1]) {
    suffixLength += after[nextEnd - 1].length;
    previousEnd--;
    nextEnd--;
  }

  let offset = from;
  const characters: TextRange[] = [];
  for (const character of after.slice(prefix, nextEnd)) {
    const end = offset + character.length;
    if (character.trim()) characters.push({ from: offset, to: end });
    offset = end;
  }
  return { from, previousTo: previous.length - suffixLength, to: next.length - suffixLength, characters };
}

function sampleTextRegions(canvas: HTMLCanvasElement, editor: HTMLTextAreaElement, ranges: TextRange[]) {
  const document = editor.ownerDocument;
  const editorBox = editor.getBoundingClientRect();
  const canvasBox = canvas.getBoundingClientRect();
  const style = getComputedStyle(editor);
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const mirror = document.createElement("div");
  Object.assign(mirror.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    boxSizing: "border-box",
    left: `${editorBox.left + editor.clientLeft - editor.scrollLeft}px`,
    top: `${editorBox.top + editor.clientTop - editor.scrollTop}px`,
    width: `${editor.clientWidth}px`,
    padding: style.padding,
    font: style.font,
    fontFeatureSettings: style.fontFeatureSettings,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    wordSpacing: style.wordSpacing,
    direction: style.direction,
    textAlign: style.textAlign,
    textTransform: style.textTransform,
    whiteSpace: style.whiteSpace,
    overflowWrap: style.overflowWrap,
    wordBreak: style.wordBreak,
    tabSize: style.tabSize,
  });
  const node = document.createTextNode(editor.value);
  mirror.appendChild(node);
  document.body.appendChild(mirror);

  const range = document.createRange();
  try {
    const regions = ranges.map(({ from, to }) => {
      range.setStart(node, from);
      range.setEnd(node, to);
      return Array.from(range.getClientRects()).flatMap((rect): TextRegion[] => {
        const left = Math.max(rect.left, editorBox.left);
        const right = Math.min(rect.right, editorBox.left + editor.clientWidth);
        const top = Math.max(rect.top - 1, editorBox.top);
        const bottom = Math.min(rect.bottom + 1, editorBox.bottom);
        if (right <= left || bottom <= top) return [];
        return [{ x: left - canvasBox.left, y: top - canvasBox.top, width: right - left, height: bottom - top }];
      }).slice(-4);
    });
    return { font, regions };
  } finally {
    mirror.remove();
  }
}

function createGlyphSampler(document: Document) {
  const raster = document.createElement("canvas");
  const ctx = raster.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, GlyphTarget[]>();

  return (text: string, rect: TextRegion, font: string): GlyphTarget[] => {
    const scale = Math.min(2, 64 / Math.max(rect.width, rect.height));
    const width = Math.ceil(rect.width * scale);
    const height = Math.ceil(rect.height * scale);
    const key = JSON.stringify([font, text, width, height]);
    const cached = cache.get(key);
    if (cached) return cached;
    if (!ctx || !width || !height) return [{ xRatio: 0.5, yRatio: 0.5 }];

    raster.width = width;
    raster.height = height;
    ctx.scale(scale, scale);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const metrics = ctx.measureText(text);
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
    const baseline = (rect.height + ascent - descent) / 2;
    ctx.fillText(text, rect.width / 2, baseline, rect.width);

    const pixels = ctx.getImageData(0, 0, width, height).data;
    const cell = Math.max(4, Math.ceil(Math.max(width, height) / 9));
    const targets: GlyphTarget[] = [];
    for (let top = 0; top < height; top += cell) {
      for (let left = 0; left < width; left += cell) {
        let weight = 0;
        let centerX = 0;
        let centerY = 0;
        for (let y = top; y < Math.min(top + cell, height); y++) {
          for (let x = left; x < Math.min(left + cell, width); x++) {
            const alpha = pixels[(y * width + x) * 4 + 3];
            weight += alpha;
            centerX += (x + 0.5) * alpha;
            centerY += (y + 0.5) * alpha;
          }
        }
        if (weight >= 192) {
          targets.push({ xRatio: centerX / (width * weight), yRatio: centerY / (height * weight) });
        }
      }
    }

    const maxTargets = 14;
    const sampled = targets.length > maxTargets
      ? Array.from({ length: maxTargets }, (_, index) => targets[Math.floor((index + 0.5) * targets.length / maxTargets)])
      : targets.length ? targets : [{ xRatio: 0.5, yRatio: 0.5 }];
    if (cache.size >= 128) cache.clear();
    cache.set(key, sampled);
    return sampled;
  };
}

function buildVoiceStack(width: number, height: number, strength: number, time: number, opacity: number, animation: VoiceAnimation) {
  const columnSpacing = animation === "dots" ? dotSpacing : glyphWidth;
  const rowSpacing = animation === "dots" ? dotSpacing * (0.93 + 0.12 * strength) : glyphHeight;
  const count = Math.floor(width * 0.86 / columnSpacing);
  const left = (width - count * columnSpacing) / 2;
  const seconds = time / 1000;
  const crest = 0.5 + Math.sin(seconds * 1.8) * 0.08;
  const maxHeight = Math.min(64, height * 0.56);
  const columns = Array.from({ length: count }, (_, index) => {
    const position = index / count;
    const distance = (position - crest) * 4.5;
    const envelope = Math.exp(-distance * distance);
    const ripple = 0.86 + Math.sin(index * 0.39 + seconds * 8) * 0.11 + Math.sin(index * 1.5 - seconds * 4) * 0.07;
    const rows = (3 + envelope * (9 + strength * (maxHeight - 9)) * ripple) / rowSpacing;
    return { index, x: left + index * columnSpacing, rows, envelope };
  });
  return { columns, rowSpacing, baseY: height - 3 + (1 - opacity) * 4, glyphPhase: seconds * 8 };
}

type VoiceStack = ReturnType<typeof buildVoiceStack>;
type StackColumn = VoiceStack["columns"][number];

function stackGlyph(index: number, row: number, frame: number) {
  return glyphs[(index * 13 + row * 17 + frame * (row % 2 + 1)) % glyphs.length];
}

function stackGlyphPhase(stack: VoiceStack, column: StackColumn, row: number) {
  return stack.glyphPhase + ((column.index * 11 + row * 7) % 19) / 19;
}

function stackDotSize(column: StackColumn, row: number) {
  const texture = 0.5 + Math.sin(column.index * 5.17 + row * 2.3) * 0.5;
  return 0.35 + texture * texture * (0.8 + column.envelope * 0.45);
}

function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawVoiceStack(ctx: CanvasRenderingContext2D, stack: VoiceStack, opacity: number, lift: number, animation: VoiceAnimation) {
  for (const column of stack.columns) {
    const rows = column.rows * (1 - lift * column.envelope);
    for (let row = 0; row < rows; row++) {
      const rowOpacity = opacity * (0.18 + column.envelope * 0.78) * (1 - 0.6 * row / (rows + 1));
      const coverage = smoothstep(rows - row);
      const y = stack.baseY - row * stack.rowSpacing;
      if (animation === "dots") {
        ctx.globalAlpha = rowOpacity * coverage;
        drawDot(ctx, column.x, y, dotRadius * stackDotSize(column, row) * Math.sqrt(coverage));
      } else {
        const phase = stackGlyphPhase(stack, column, row);
        const frame = Math.floor(phase);
        const mix = smoothstep((phase - frame - 0.72) / 0.28);
        const alpha = rowOpacity * coverage;
        ctx.globalAlpha = alpha * (1 - mix);
        ctx.fillText(stackGlyph(column.index, row, frame), column.x, y);
        if (mix > 0) {
          ctx.globalAlpha = alpha * mix;
          ctx.fillText(stackGlyph(column.index, row, frame + 1), column.x, y);
        }
      }
    }
  }
}

function findCrest(stack: VoiceStack) {
  let peak = 0;
  for (const column of stack.columns) peak = Math.max(peak, column.rows);
  return stack.columns.filter((column) => column.rows >= peak * 0.76);
}

function createFlightGlyphs(targets: GlyphTarget[]): FlyingGlyph[] {
  const center = 0.35 + Math.random() * 0.3;
  return targets.map((target, index) => {
    const fraction = index / Math.max(1, targets.length - 1);
    return {
      target,
      delay: fraction * releaseSpread,
      sway: (Math.random() - 0.5) * 22,
      crestPosition: center + (fraction - 0.5) * 0.36,
    };
  });
}

function sampleCrestOrigin(stack: VoiceStack, crest: StackColumn[], glyph: FlyingGlyph, lift: number, animation: VoiceAnimation) {
  const column = crest[Math.round(glyph.crestPosition * (crest.length - 1))];
  if (!column) return undefined;
  const rows = column.rows * (1 - lift * column.envelope);
  const row = Math.max(0, Math.ceil(rows - 0.32) - 1);
  const phase = stackGlyphPhase(stack, column, row);
  return {
    x: column.x,
    y: stack.baseY - row * stack.rowSpacing - (animation === "ascii" ? glyphCenterOffset : 0),
    radius: dotRadius * stackDotSize(column, row) * Math.sqrt(smoothstep(rows - row)),
    character: stackGlyph(column.index, row, Math.floor(phase + 0.14)),
  };
}

function drawCharacterMasks(ctx: CanvasRenderingContext2D, characters: CharacterMorph[], time: number, surface: string) {
  ctx.fillStyle = surface;
  for (const { flight, regions } of characters) {
    const elapsed = flight ? time - flight.startedAt : 0;
    ctx.globalAlpha = 1 - smoothstep((elapsed - revealStart) / (revealDuration - revealStart));
    for (const rect of regions) ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}

function cubicCoordinate(from: number, lift: number, approach: number, to: number, phase: number) {
  const back = 1 - phase;
  return back ** 3 * from + 3 * back * back * phase * lift + 3 * back * phase * phase * approach + phase ** 3 * to;
}

function drawCharacterFlights(
  ctx: CanvasRenderingContext2D, characters: CharacterMorph[], stack: VoiceStack, lift: number,
  time: number, ink: string, animation: VoiceAnimation,
) {
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineCap = "round";
  ctx.lineWidth = 0.8;
  let crest: StackColumn[] | undefined;

  for (const { flight, regions } of characters) {
    const rect = regions[0];
    if (!flight || !rect) continue;
    const fade = flight.retiredAt == null ? 1 : 1 - smoothstep((time - flight.retiredAt) / revisionFade);
    for (const glyph of flight.glyphs) {
      const progress = (time - flight.startedAt - glyph.delay) / flightDuration;
      if (progress < 0 || progress >= 1) continue;
      if (!glyph.origin && flight.retiredAt == null) {
        glyph.origin = sampleCrestOrigin(stack, crest ??= findCrest(stack), glyph, lift, animation);
      }
      const origin = glyph.origin;
      if (!origin) continue;

      // Launch along the crest's upward direction and approach the actual ink of the letter.
      const targetX = rect.x + rect.width * glyph.target.xRatio;
      const targetY = rect.y + rect.height * glyph.target.yRatio;
      const liftHeight = Math.max(12, (origin.y - targetY) * 0.78 + glyph.sway * 1.35);
      const liftX = origin.x + glyph.sway;
      const liftY = origin.y - liftHeight;
      const approachX = targetX + (origin.x - targetX) * 0.16;
      const approachY = targetY - Math.min(12, liftHeight * 0.23) - glyph.sway * 0.8;
      const travel = smoothstep(progress / 0.94);
      const x = cubicCoordinate(origin.x, liftX, approachX, targetX, travel);
      const y = cubicCoordinate(origin.y, liftY, approachY, targetY, travel);
      const landing = smoothstep((progress - 0.5) / 0.44);
      const opacity = fade * 0.86 * smoothstep(progress / 0.15) * (1 - smoothstep((progress - 0.83) / 0.17));

      const tail = smoothstep((progress - 0.034) / 0.94);
      const dx = x - cubicCoordinate(origin.x, liftX, approachX, targetX, tail);
      const dy = y - cubicCoordinate(origin.y, liftY, approachY, targetY, tail);
      const trailLength = Math.hypot(dx, dy);
      if (trailLength > 0.8) {
        const lengthRatio = Math.min(1, 12 / trailLength);
        ctx.globalAlpha = opacity * 0.24 * smoothstep((trailLength - 0.8) / 3);
        ctx.beginPath();
        ctx.moveTo(x - dx * lengthRatio, y - dy * lengthRatio);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      const dotOpacity = animation === "dots" ? 1 : landing;
      if (dotOpacity < 1) {
        ctx.globalAlpha = opacity * (1 - dotOpacity);
        ctx.fillText(origin.character, x, y + glyphCenterOffset);
      }
      if (dotOpacity > 0) {
        ctx.globalAlpha = opacity * dotOpacity;
        drawDot(ctx, x, y, origin.radius + (0.64 - origin.radius) * landing);
      }
    }
  }
}

function InputMessageVoiceWave({
  animation,
  level,
  listening,
  editorRef,
  committedDraftRef,
  draft,
  paintRef,
}: {
  animation: VoiceAnimation;
  level: MotionValue<number>;
  listening: boolean;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  committedDraftRef: RefObject<string | null>;
  draft: string;
  paintRef: RefObject<(() => void) | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  const motionState = useRef({ animation, listening, isPresent, safeToRemove });
  const drawing = useRef(false);
  const initialDraft = useRef(draft);

  useLayoutEffect(() => {
    motionState.current = { animation, listening, isPresent, safeToRemove };
  }, [animation, listening, isPresent, safeToRemove]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const editor = editorRef.current;
    const editorCard = canvas.parentElement?.parentElement;
    // Computed styles stay live through theme changes, even when the canvas size is unchanged.
    const canvasStyles = getComputedStyle(canvas);
    const cardStyles = editorCard ? getComputedStyle(editorCard) : undefined;
    drawing.current = true;
    const sampleGlyph = createGlyphSampler(canvas.ownerDocument);
    const canMeasureText = typeof Range !== "undefined" && typeof Range.prototype.getClientRects === "function";
    let width = 0;
    let height = 0;
    let lastFrame: number | undefined;
    let frame: number;
    let strength = 0;
    let waveOpacity = 0;
    let lift = 0;
    let lastText = initialDraft.current;
    let characters: CharacterMorph[] = [];
    let retiring: CharacterMorph[] = [];
    let nextReleaseAt = 0;
    let exitStartedAt: number | undefined;
    let removalRequested = false;
    let layoutChanged = true;
    let editorFont = "";

    function invalidateLayout() {
      layoutChanged = true;
    }

    function resize() {
      if (!canvas || !ctx) return;
      const previousWidth = width;
      const previousHeight = height;
      ({ width, height } = canvas.getBoundingClientRect());
      const pixelRatio = Math.min(canvas.ownerDocument.defaultView?.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * pixelRatio);
      const pixelHeight = Math.round(height * pixelRatio);
      const layoutResized = width !== previousWidth || height !== previousHeight;
      if (!layoutResized && canvas.width === pixelWidth && canvas.height === pixelHeight) return false;
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.font = glyphFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      if (layoutResized) {
        layoutChanged = true;
        for (const { flight } of characters.concat(retiring)) {
          for (const glyph of flight?.glyphs ?? []) {
            if (!glyph.origin) continue;
            glyph.origin.x *= previousWidth > 0 ? width / previousWidth : 1;
            glyph.origin.y += height - previousHeight;
          }
        }
      }
      return true;
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const now = Math.max(timestamp, lastFrame ?? timestamp);
      const state = motionState.current;
      const animateText = state.isPresent || (committedDraftRef.current !== null && editor?.value === committedDraftRef.current);
      if (!animateText) {
        characters = [];
        retiring = [];
        nextReleaseAt = 0;
        if (editor) lastText = editor.value;
      }
      const textChanged = animateText && canMeasureText && editor && editor.value !== lastText;
      const elapsed = lastFrame == null ? 16 : now - lastFrame;
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);

      characters = characters.filter(({ flight }) => !flight || now - flight.startedAt < revealDuration);
      if (retiring.length) {
        retiring = retiring.filter(({ flight }) => flight?.retiredAt != null && now - flight.retiredAt < revisionFade);
      }
      if (editor && textChanged) {
        const change = findVoiceTextChange(lastText, editor.value);
        const shift = change.to - change.previousTo;
        // Revisions only replace the affected characters. Flights for identical text keep their original timing.
        characters = characters.flatMap((character) => {
          if (character.to <= change.from) return [character];
          if (character.from >= change.previousTo) {
            return [{ ...character, from: character.from + shift, to: character.to + shift }];
          }
          if (character.flight) {
            character.flight.retiredAt = now;
            retiring.push(character);
          }
          return [];
        });
        const retainedFlights = characters.filter(({ flight }) => flight);
        const waiting = characters.filter(({ flight }) => !flight);
        waiting.push(...change.characters.slice(-animatedCharacterLimit).map((range) => ({ ...range, regions: [] })));
        characters = [...retainedFlights, ...waiting.slice(-animatedCharacterLimit)];
        lastText = editor.value;
        layoutChanged = true;
      }

      if (editor && characters.length && layoutChanged) {
        const { font, regions } = sampleTextRegions(canvas, editor, characters);
        for (const [index, character] of characters.entries()) character.regions = regions[index];
        characters = characters.filter((character) => character.regions.length);
        editorFont = font;
        layoutChanged = false;
      }

      if (state.isPresent || characters.length || retiring.length) {
        exitStartedAt = undefined;
        removalRequested = false;
      } else {
        exitStartedAt ??= now;
      }
      const exitProgress = exitStartedAt == null ? 1 : 1 - (now - exitStartedAt) / waveExit;
      if (exitProgress <= 0) {
        if (!removalRequested) {
          removalRequested = true;
          state.safeToRemove?.();
        }
        return;
      }

      const listeningNow = state.isPresent && state.listening;
      const smoothing = 1 - Math.exp(-elapsed / (spring.fast.duration * 1000));
      strength += ((listeningNow ? level.get() : 0) - strength) * smoothing;
      waveOpacity += ((listeningNow ? 1 : 0.28) - waveOpacity) * smoothing;
      const stack = buildVoiceStack(width, height, strength, now, waveOpacity, state.animation);
      let targetLift = 0;
      for (const { flight } of characters) {
        if (flight) targetLift = Math.max(targetLift, Math.sin((now - flight.startedAt) / revealDuration * Math.PI) * 0.23);
      }
      lift += (targetLift - lift) * smoothing;

      const queued = characters.filter(({ flight }) => !flight);
      if (queued.length) {
        const interval = Math.max(12, Math.min(44, 310 / queued.length));
        if (nextReleaseAt < now - 30) nextReleaseAt = now;
        for (const character of queued) {
          if (nextReleaseAt > now) break;
          const text = lastText.slice(character.from, character.to);
          const targets = sampleGlyph(text, character.regions[0], editorFont);
          character.flight = { startedAt: nextReleaseAt, glyphs: createFlightGlyphs(targets) };
          nextReleaseAt += interval;
        }
      }

      const ink = canvasStyles.color;
      ctx.fillStyle = ink;
      drawVoiceStack(ctx, stack, waveOpacity * exitProgress, lift, state.animation);
      if (characters.length) drawCharacterMasks(ctx, characters, now, cardStyles?.backgroundColor ?? "transparent");
      const flights = retiring.length ? retiring.concat(characters) : characters;
      if (flights.length) drawCharacterFlights(ctx, flights, stack, lift, now, ink, state.animation);
      ctx.globalAlpha = 1;
    }

    resize();
    const observer = new ResizeObserver((entries) => {
      const editorResized = entries.some(({ target }) => target === editor);
      if (editorResized) invalidateLayout();
      const canvasResized = resize();
      if (canvasResized || editorResized) draw(performance.now());
    });
    observer.observe(canvas);
    if (editor) {
      observer.observe(editor);
      editor.addEventListener("scroll", invalidateLayout, { passive: true });
    }
    // The textarea already contains the new transcript at this point. Paint its mask
    // in that same commit so the complete text cannot flash before the first flight.
    paintRef.current = () => {
      invalidateLayout();
      resize();
      draw(performance.now());
    };
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      draw(time);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      drawing.current = false;
      paintRef.current = null;
      editor?.removeEventListener("scroll", invalidateLayout);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [committedDraftRef, editorRef, level, paintRef]);

  useEffect(() => {
    if (!isPresent && !drawing.current) safeToRemove?.();
  }, [isPresent, safeToRemove]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] text-fg-default"
    >
      <canvas ref={canvasRef} data-slot="input-message-voice-wave" data-animation={animation} className="block size-full" />
    </div>
  );
}

export { findVoiceTextChange, InputMessageVoiceWave };
export type { VoiceAnimation };
