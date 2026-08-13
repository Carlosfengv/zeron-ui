"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SurfaceRole } from "#system/surface-classes";
export { resolveSurface } from "#system/surface-classes";

const SurfaceContext = createContext<SurfaceRole>("base");

export function useSurface(): SurfaceRole {
  return useContext(SurfaceContext);
}

export function SurfaceProvider({
  role,
  children,
}: {
  role: SurfaceRole;
  children: ReactNode;
}) {
  return (
    <SurfaceContext.Provider value={role}>{children}</SurfaceContext.Provider>
  );
}
