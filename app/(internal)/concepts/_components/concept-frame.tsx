"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { NavMenu } from "@zeron/ui/nav-menu";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import Link from "next/link";
import { useIcon } from "@zeron/icons/context";
import { RightPanel } from "@docs/components/shell/site/right-panel";
import { ScrollArea } from "@zeron/ui/scroll-area";

interface ConceptFrameProps {
  children: ReactNode;
  /** Render only the content — no concept nav or personalization panel. Used by
   *  the `/concepts` index, which is itself the navigation hub. */
  bare?: boolean;
}

const CONCEPTS = [
  { slug: "lumen", name: "Lumen" },
  { slug: "atlas", name: "Atlas" },
  { slug: "beacon", name: "Beacon" },
  { slug: "quill", name: "Quill" },
];

// ConceptFrame wraps every concept screen with the same chrome as the main app:
// a left nav to jump between concepts (Home → root first) and the shared
// personalization RightPanel. The screen content sits in the middle column.
export function ConceptFrame({ children, bare = false }: ConceptFrameProps) {
  if (bare) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-surface-base text-fg-default">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-surface-base text-fg-default">
      <ConceptNav />
      {/* `main` is already provided by the root fullscreen layout, so this is a
          plain div to avoid nesting landmark elements. */}
      <div className="min-w-0 flex-1">{children}</div>
      <RightPanel />
    </div>
  );
}

function ConceptNav() {
  const pathname = usePathname();
  const Home = useIcon("home");

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col lg:flex">
      <ScrollArea className="min-h-0 w-full flex-1" viewportClassName="scroll-fade p-4">
        <NavMenu activeValue={pathname} aria-label="Concept screens">
          <NavItem value="/">
            <NavItemTrigger render={<Link href="/" />} tooltip="Home">
              <NavItemLeading><Home size={16} /></NavItemLeading>
              <NavItemContent><NavItemLabel>Home</NavItemLabel></NavItemContent>
            </NavItemTrigger>
          </NavItem>
          {CONCEPTS.map((c) => (
            <NavItem key={c.slug} value={`/concepts/${c.slug}`}>
              <NavItemTrigger render={<Link href={`/concepts/${c.slug}`} />}>
                <NavItemContent><NavItemLabel>{c.name}</NavItemLabel></NavItemContent>
              </NavItemTrigger>
            </NavItem>
          ))}
        </NavMenu>
      </ScrollArea>
    </aside>
  );
}
