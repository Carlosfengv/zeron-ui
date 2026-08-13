"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  shapeTokenClasses,
  shapeTokenValues,
  type GeneratedShapeVariant,
} from "./design-tokens";

type ShapeVariant = GeneratedShapeVariant;

interface ShapeClasses {
  item: string;
  bg: string;
  focusRing: string;
  mergedBg: string;
  container: string;
  button: string;
  input: string;
  // Numeric counterparts of `bg` / `mergedBg`, in px. Needed where individual
  // corners are animated (e.g. the selected-background merge/split animation),
  // which requires per-corner numeric border-radii rather than a class.
  bgRadius: number;
  mergedRadius: number;
}

const shapeMap: Record<ShapeVariant, ShapeClasses> = {
  pill: {
    item: shapeTokenClasses.pill.control,
    bg: shapeTokenClasses.pill.control,
    // +2px over `item` because the focus ring sits 2px outside the element
    // (top/left -2, width/height +4); this keeps the corners concentric so a
    // pill element gets a pill ring (matches the rounded-mode 8px→10px bump).
    focusRing: shapeTokenClasses.pill.focus,
    mergedBg: shapeTokenClasses.pill.selection,
    container: shapeTokenClasses.pill.container,
    button: shapeTokenClasses.pill.control,
    input: shapeTokenClasses.pill.control,
    bgRadius: shapeTokenValues.pill.control,
    mergedRadius: shapeTokenValues.pill.selection,
  },
  rounded: {
    item: shapeTokenClasses.rounded.control,
    bg: shapeTokenClasses.rounded.control,
    focusRing: shapeTokenClasses.rounded.focus,
    mergedBg: shapeTokenClasses.rounded.selection,
    container: shapeTokenClasses.rounded.container,
    button: shapeTokenClasses.rounded.control,
    input: shapeTokenClasses.rounded.control,
    bgRadius: shapeTokenValues.rounded.control,
    mergedRadius: shapeTokenValues.rounded.selection,
  },
};

interface ShapeContextValue {
  shape: ShapeVariant;
  setShape: (shape: ShapeVariant) => void;
  classes: ShapeClasses;
}

const ShapeContext = createContext<ShapeContextValue | null>(null);

function useShape(): ShapeClasses {
  const ctx = useContext(ShapeContext);
  if (!ctx) return shapeMap.pill;
  return ctx.classes;
}

function useShapeContext() {
  const ctx = useContext(ShapeContext);
  if (!ctx) throw new Error("useShapeContext must be used within a ShapeProvider");
  return ctx;
}

function ShapeProvider({
  children,
  defaultShape = "pill",
}: {
  children: ReactNode;
  defaultShape?: ShapeVariant;
}) {
  const [shape, setShapeState] = useState<ShapeVariant>(defaultShape);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Run a state change under the `.transitioning` guard (added + reflow-flushed
  // first so the 180ms border-radius cross-fade applies). Clearing the previous
  // timeout first keeps a double-press from removing the class mid-fade.
  const transitionShape = useCallback((callback: () => void) => {
    const root = document.documentElement;
    root.classList.add("transitioning");
    void root.offsetHeight;
    callback();
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(
      () => root.classList.remove("transitioning"),
      200
    );
  }, []);

  const setShape = useCallback(
    (next: ShapeVariant) => {
      transitionShape(() => setShapeState(next));
    },
    [transitionShape]
  );

  // Publish every semantic radius on <html> so plain CSS and portalled content
  // stay in sync with the React shape context.
  useEffect(() => {
    const root = document.documentElement;
    for (const [role, value] of Object.entries(shapeTokenValues[shape])) {
      root.style.setProperty(`--${role}-radius`, `${value}px`);
    }
    // Backward-compatible alias used by the base focus fallback.
    root.style.setProperty("--shape-input-radius", `${shapeMap[shape].bgRadius}px`);
  }, [shape]);

  const value = useMemo(
    () => ({ shape, setShape, classes: shapeMap[shape] }),
    [shape, setShape]
  );

  return (
    <ShapeContext.Provider value={value}>
      {children}
    </ShapeContext.Provider>
  );
}

export { ShapeProvider, useShape, useShapeContext, shapeMap };
export type { ShapeVariant, ShapeClasses };
