"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { NavMenu } from "@/components/ui/nav-menu";
import { NavItem } from "@/components/ui/nav-item";
import { useIcon } from "@/lib/icon-context";
import { RightPanel } from "@/docs/site/right-panel";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
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
        <NavMenu activeSlug={pathname} aria-label="Concept screens">
          <NavItem index={0} href="/" label="Home" icon={Home} />
          {CONCEPTS.map((c, i) => (
            <NavItem
              key={c.slug}
              index={i + 1}
              href={`/concepts/${c.slug}`}
              label={c.name}
            />
          ))}
        </NavMenu>
      </ScrollArea>
    </aside>
  );
}
