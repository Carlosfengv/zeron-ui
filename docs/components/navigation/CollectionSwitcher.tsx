"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { collectionDefinitions, type DocCollection } from "@docs/manifest";
import { internalPathname, localizePathname } from "@docs/components/shell/site/locale-path";
import { cn } from "@zeron/ui/system/utils";

function activeCollection(pathname: string): DocCollection {
  const [, , collection] = internalPathname(pathname).split("/");
  return collectionDefinitions.some(({ id }) => id === collection)
    ? collection as DocCollection
    : "components";
}

export function CollectionSwitcher({ localePrefix = "" }: { localePrefix?: string }) {
  const pathname = usePathname();
  const active = activeCollection(pathname);
  // Icons keep their route and package boundary, but remain out of the primary
  // documentation navigation until the catalog becomes a public destination.
  const visibleCollections = collectionDefinitions.filter(({ id }) => id !== "icons");

  return (
    <nav aria-label="Documentation collection" className="grid grid-cols-2 gap-1 px-2 py-3">
      {visibleCollections.map(({ id }) => (
        <Link
          key={id}
          href={localizePathname(`/docs/${id}`, localePrefix)}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "rounded-control px-2 py-1.5 text-center text-label capitalize transition-colors",
            active === id ? "bg-emphasis text-fg-default" : "text-fg-muted hover:bg-hover hover:text-fg-default",
          )}
        >
          {id}
        </Link>
      ))}
    </nav>
  );
}
