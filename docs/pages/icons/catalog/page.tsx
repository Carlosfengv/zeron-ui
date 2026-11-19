"use client";

import { useMemo, useState } from "react";
import { DocPage } from "@docs/components/content/DocPage";
import { iconCatalog } from "@zeron/icons/catalog";
import { useIcon, useIconContext, type IconName } from "@zeron/icons/context";
import { Badge } from "@zeron/ui/badge";
import { useTranslations } from "next-intl";

function IconGridCard({
  name,
  copiedLabel,
  onCopy,
}: {
  name: IconName;
  copiedLabel?: string;
  onCopy: (name: IconName) => void;
}) {
  const Icon = useIcon(name);
  return (
    <li>
      <button
        type="button"
        onClick={() => onCopy(name)}
        className="group flex w-full items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-left transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring outline-none"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-base text-fg-default transition-colors group-hover:text-fg-brand">
          <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-label text-fg-muted group-hover:text-fg-default">
          {name}
        </span>
        {copiedLabel && (
          <Badge size="sm" color="blue">
            {copiedLabel}
          </Badge>
        )}
      </button>
    </li>
  );
}

export default function IconCatalogPage() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const { variant } = useIconContext();
  const icons = useMemo(
    () => iconCatalog.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  async function handleCopy(name: IconName) {
    try {
      await navigator.clipboard.writeText(`const Icon = useIcon("${name}");`);
      setCopiedName(name);
      setTimeout(() => setCopiedName((prev) => (prev === name ? null : prev)), 1800);
    } catch {
      setCopiedName(null);
    }
  }

  return (
    <DocPage title={t("title")} slug="catalog" description={t("description")} collection="icons" showInstall={false}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge size="sm" variant="dot">
            {variant}
          </Badge>
          <span className="text-label text-fg-muted">{t("resultCount", { count: icons.length })}</span>
        </div>
        <input
          className="min-h-control-md w-full rounded-lg border border-border bg-transparent px-3 text-body text-fg-default outline-none placeholder:text-fg-subtle focus-visible:ring-1 focus-visible:ring-focus-ring"
          value={query}
          aria-label={t("searchPlaceholder")}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      {icons.length ? (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {icons.map((name) => (
            <IconGridCard
              key={name}
              name={name as IconName}
              copiedLabel={copiedName === name ? t("copied") : undefined}
              onCopy={handleCopy}
            />
          ))}
        </ul>
      ) : (
        <p className="text-body text-fg-muted">{t("empty")}</p>
      )}
    </DocPage>
  );
}
