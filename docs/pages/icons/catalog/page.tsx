"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DocPage } from "@docs/components/content/DocPage";
import { iconCatalog } from "@zeron/icons/catalog";
import { useIcon, useIconContext, type IconName } from "@zeron/icons/context";
import { Textarea } from "@zeron/ui/textarea";
import { Badge } from "@zeron/ui/badge";
import { useTranslations } from "next-intl";

type CopyResult =
  | { key: string; status: "copied" }
  | { key: string; status: "manual"; text: string };

function useIconCopy() {
  const [result, setResult] = useState<CopyResult | null>(null);
  const request = useRef(0);

  useEffect(() => {
    if (result?.status !== "copied") return;
    const timer = window.setTimeout(() => setResult(null), 1800);
    return () => window.clearTimeout(timer);
  }, [result]);

  async function copy(key: string, text: string) {
    const id = ++request.current;
    try {
      await navigator.clipboard.writeText(text);
      if (id === request.current) setResult({ key, status: "copied" });
    } catch {
      if (id === request.current) setResult({ key, status: "manual", text });
    }
  }

  return { result, copy };
}

function IconCopyFallback({ text }: { text: string }) {
  const t = useTranslations();
  return (
    <label className="flex min-w-0 flex-col gap-1.5 p-2 text-label text-fg-muted">
      <span role="status">{t("manualCopy")}</span>
      <Textarea readOnly rows={2} value={text} onFocus={event => event.currentTarget.select()} />
    </label>
  );
}

function IconGridCard({
  name,
  copiedLabel,
  manualText,
  onCopy,
}: {
  name: IconName;
  copiedLabel?: string;
  manualText?: string;
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
      {manualText && <IconCopyFallback text={manualText} />}
    </li>
  );
}

export default function IconCatalogPage() {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const { result, copy } = useIconCopy();
  const { variant } = useIconContext();
  const icons = useMemo(
    () => iconCatalog.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

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
              copiedLabel={result?.key === name && result.status === "copied" ? t("copied") : undefined}
              manualText={result?.key === name && result.status === "manual" ? result.text : undefined}
              onCopy={name => copy(name, `const Icon = useIcon("${name}");`)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-body text-fg-muted">{t("empty")}</p>
      )}
    </DocPage>
  );
}
