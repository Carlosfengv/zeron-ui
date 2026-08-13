export type SurfaceRole = "base" | "raised" | "floating" | "overlay" | "top";
export type ShadowRole = "none" | "raised" | "floating" | "overlay";

export const SURFACE_ROLES: SurfaceRole[] = [
  "base",
  "raised",
  "floating",
  "overlay",
  "top",
];

export const SURFACE_ROLE_BG: Record<SurfaceRole, string> = {
  base: "bg-surface-base",
  raised: "bg-surface-raised",
  floating: "bg-surface-floating",
  overlay: "bg-surface-overlay",
  top: "bg-surface-top",
};

export const SHADOW_ROLE: Record<ShadowRole, string> = {
  none: "",
  raised: "shadow-raised",
  floating: "shadow-floating",
  overlay: "shadow-overlay",
};

export function resolveSurface(
  parent: SurfaceRole,
  minimum: SurfaceRole,
): SurfaceRole {
  const parentIndex = SURFACE_ROLES.indexOf(parent);
  const minimumIndex = SURFACE_ROLES.indexOf(minimum);
  const nextIndex = Math.min(parentIndex + 1, SURFACE_ROLES.length - 1);
  return SURFACE_ROLES[Math.max(minimumIndex, nextIndex)];
}

export function surfaceClasses(
  surface: SurfaceRole,
  shadow: ShadowRole = "none",
): string {
  return [SURFACE_ROLE_BG[surface], SHADOW_ROLE[shadow]].filter(Boolean).join(" ");
}

/**
 * Semantic shadow lookup for components whose spatial separation is stable
 * even while their background surface is calculated relative to a parent.
 */
export function shadowClasses(role: ShadowRole): string {
  return SHADOW_ROLE[role];
}

/** Use for non-relative, public surface roles. */
export function semanticSurfaceClasses(
  surface: SurfaceRole,
  shadow?: ShadowRole
): string {
  return surfaceClasses(surface, shadow);
}
