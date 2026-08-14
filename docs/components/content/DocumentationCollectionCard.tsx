"use client";

import Link from "next/link";
import { useIcon, type IconName } from "@zeron/icons/context";

interface DocumentationCollectionCardProps {
  description?: string;
  href: string;
  icon: IconName;
  name: string;
}

/** A compact, icon-led entry point for the Components documentation index. */
export function DocumentationCollectionCard({
  description,
  href,
  icon,
  name,
}: DocumentationCollectionCardProps) {
  const Icon = useIcon(icon);

  return (
    <Link
      className="group flex h-full min-w-0 gap-3 rounded-xl border-[0.5px] border-border bg-surface-floating p-4 outline-none transition-[background-color,border-color,box-shadow] duration-fast hover:border-fg-subtle hover:bg-surface-raised focus-visible:ring-1 focus-visible:ring-focus-ring"
      href={href}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-border-subtle bg-surface-raised text-fg-default transition-colors duration-fast group-hover:bg-surface-floating">
        <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 pt-0.5">
        <span className="block text-title font-semibold text-fg-default">{name}</span>
        {description && <span className="mt-1 block text-body text-fg-muted">{description}</span>}
      </span>
    </Link>
  );
}
