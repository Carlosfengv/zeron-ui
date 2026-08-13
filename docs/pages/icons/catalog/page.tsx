"use client";

import { useMemo, useState } from "react";
import { DocPage } from "@docs/components/content/DocPage";
import { iconCatalog } from "@zeron/icons/catalog";
import { useTranslations } from "next-intl";

export default function IconCatalogPage() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const icons = useMemo(
    () => iconCatalog.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <DocPage title={t("title")} slug="catalog" description={t("description")} collection="icons" showInstall={false}>
      <input
        className="min-h-control-sm w-full rounded-control border border-border bg-transparent px-3 text-body text-fg-default outline-none placeholder:text-fg-subtle focus-visible:ring-1 focus-visible:ring-focus-ring"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
      />
      {icons.length ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {icons.map((name) => <li className="rounded-control border border-border px-3 py-2 font-mono text-label text-fg-muted" key={name}>{name}</li>)}
        </ul>
      ) : <p className="text-body text-fg-muted">{t("empty")}</p>}
    </DocPage>
  );
}
