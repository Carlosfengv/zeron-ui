"use client";

import { createContext, useContext, type ReactNode } from "react";

const PortalContainerContext = createContext<HTMLElement | null>(null);

interface PortalContainerProviderProps {
  children: ReactNode;
  value: HTMLElement | null;
}

/**
 * Supplies an ambient mount point for floating UI. Native fullscreen only
 * renders the selected element and its descendants, so body-level portals
 * need to opt into the fullscreen subtree.
 */
function PortalContainerProvider({
  children,
  value,
}: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={value}>
      {children}
    </PortalContainerContext.Provider>
  );
}

function usePortalContainer() {
  return useContext(PortalContainerContext);
}

export { PortalContainerProvider, usePortalContainer };
