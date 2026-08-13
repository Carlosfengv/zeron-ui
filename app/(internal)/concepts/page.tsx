"use client";

import { ConceptFrame } from "@/app/(internal)/concepts/_components/concept-frame";
import { NavMenu } from "@zeron/ui/nav-menu";
import { NavItem } from "@zeron/ui/nav-item";
import { NavItemContent, NavItemLabel, NavItemTrigger } from "@zeron/ui/nav-item";
import Link from "next/link";

const CONCEPTS = [
  { slug: "lumen", name: "Lumen" },
  { slug: "atlas", name: "Atlas" },
  { slug: "beacon", name: "Beacon" },
  { slug: "quill", name: "Quill" },
];

export default function ConceptsIndex() {
  return (
    <ConceptFrame bare>
      <div className="flex min-h-screen items-center justify-center px-6">
        <NavMenu activeValue={null} aria-label="Concepts" className="w-56">
          {CONCEPTS.map((c) => (
            <NavItem key={c.slug} value={`/concepts/${c.slug}`}>
              <NavItemTrigger render={<Link href={`/concepts/${c.slug}`} />}>
                <NavItemContent><NavItemLabel>{c.name}</NavItemLabel></NavItemContent>
              </NavItemTrigger>
            </NavItem>
          ))}
        </NavMenu>
      </div>
    </ConceptFrame>
  );
}
