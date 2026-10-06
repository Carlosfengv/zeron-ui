export type DockEdge = "left" | "right" | "top" | "bottom";
export interface Point { x: number; y: number }
export interface Viewport { left: number; top: number; width: number; height: number }
export interface ControlSize { width: number; height: number }
export interface DockPosition { edge: DockEdge; fraction: number }

export const floatingPreviewInset = 16;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function limits(viewport: Viewport, size: ControlSize) {
  const remainingWidth = Math.max(0, viewport.width - size.width);
  const remainingHeight = Math.max(0, viewport.height - size.height);
  const insetX = Math.min(floatingPreviewInset, remainingWidth / 2);
  const insetY = Math.min(floatingPreviewInset, remainingHeight / 2);
  return {
    left: viewport.left + insetX, right: viewport.left + remainingWidth - insetX,
    top: viewport.top + insetY, bottom: viewport.top + remainingHeight - insetY,
  };
}

export function clampFloatingPosition(point: Point, viewport: Viewport, size: ControlSize): Point {
  const bounds = limits(viewport, size);
  return { x: clamp(point.x, bounds.left, bounds.right), y: clamp(point.y, bounds.top, bounds.bottom) };
}

export function positionForDock(dock: DockPosition, viewport: Viewport, size: ControlSize): Point {
  const bounds = limits(viewport, size);
  const fraction = clamp(dock.fraction, 0, 1);
  if (dock.edge === "left" || dock.edge === "right") {
    return { x: bounds[dock.edge], y: bounds.top + (bounds.bottom - bounds.top) * fraction };
  }
  return { x: bounds.left + (bounds.right - bounds.left) * fraction, y: bounds[dock.edge] };
}

/** Dock to the nearest edge while retaining the position along that edge. */
export function nearestFloatingDock(point: Point, viewport: Viewport, size: ControlSize): DockPosition {
  const bounds = limits(viewport, size);
  const position = clampFloatingPosition(point, viewport, size);
  const distances: [DockEdge, number][] = [
    ["left", position.x - bounds.left], ["right", bounds.right - position.x],
    ["top", position.y - bounds.top], ["bottom", bounds.bottom - position.y],
  ];
  const edge = distances.reduce((closest, candidate) => candidate[1] < closest[1] ? candidate : closest)[0];
  const vertical = edge === "left" || edge === "right";
  const distance = vertical ? bounds.bottom - bounds.top : bounds.right - bounds.left;
  const offset = vertical ? position.y - bounds.top : position.x - bounds.left;
  return { edge, fraction: distance > 0 ? offset / distance : 0.5 };
}
