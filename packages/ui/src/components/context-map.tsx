"use client";

import {
  forwardRef, useEffect, useId, useMemo, useRef, useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "#components/dropdown";
import { MenuItem } from "#components/menu-item";
import { Popover, PopoverContent } from "#components/popover";
import { Separator } from "#components/separator";
import { Tabs, TabsList, TabItem } from "#components/tabs";
import { useIcon } from "#system/icon-context";
import { spring } from "#system/springs";
import { cn } from "#system/utils";
import {
  contextMapEnglishLabels, contextMapFormatters, getCompactionFates, getContextBlocks,
  layoutContextMap, sumContextTokens,
  type ContextBlock, type ContextBlockKind, type ContextMapLabels, type ContextMapProps, type ContextMapView,
} from "./context-map/data";

export { contextMapEnglishLabels, contextMapZhLabels } from "./context-map/data";
export type {
  ContextAgent, ContextBlock, ContextBlockKind, ContextCompaction, ContextMapLabels, ContextMapProps, ContextMapView,
} from "./context-map/data";

const tileColors: Record<ContextBlockKind | "free", string> = {
  system: "var(--fg-muted)",
  tools: "var(--chart-2)",
  memory: "var(--chart-5)",
  file: "var(--chart-1)",
  chat: "var(--chart-5)",
  result: "color-mix(in oklab, var(--chart-3) 76%, var(--fg-warning))",
  summary: "var(--chart-4)",
  free: "var(--fg-muted)",
};
const fateNames = ["kept", "summarized", "dropped"] as const;
const buttonFocus = "focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:-outline-offset-2";
const detailPart = "flex min-w-0 items-center gap-1.5 [&>svg]:size-3 [&>svg]:shrink-0";
const instant = { duration: 0 };

type ContextMapFate = (typeof fateNames)[number];
type ContextTile = { key: string; block: ContextBlock | null; label: string; tokens: number; fate?: ContextMapFate };
type Anchor = { key: string; element: HTMLButtonElement };
type Formatters = ReturnType<typeof contextMapFormatters>;

function ContextMapUsage({ used, capacity, ratio, tokenLabel, format, reduced }: {
  used: number;
  capacity: number | null;
  ratio: number | null;
  tokenLabel: string;
  format: Formatters;
  reduced: boolean | null;
}) {
  const compactUsed = Number.isFinite(used) ? format.compact(used) : "—";
  const exactUsed = Number.isFinite(used) ? format.number.format(used) : "—";
  const status = ratio === null || ratio < 0.8 ? undefined : ratio >= 0.95 ? "danger" : "warning";

  return (
    <div data-slot="context-map-usage" className="ml-auto flex shrink-0 items-center gap-2 text-label tabular-nums">
      <span className="relative isolate inline-grid overflow-hidden text-fg-default" title={exactUsed + " " + tokenLabel}>
        <span className="sr-only">{exactUsed} {tokenLabel}</span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={compactUsed}
            aria-hidden="true"
            className="col-start-1 row-start-1"
            initial={reduced ? false : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : "-100%", opacity: 0, transition: reduced ? instant : spring.moderate.exit }}
            transition={reduced ? instant : spring.moderate}
          >
            <motion.span
              className="bg-clip-text text-transparent motion-reduce:text-fg-default"
              style={{ backgroundImage: "linear-gradient(90deg, var(--fg-default) 35%, var(--fg-muted) 50%, var(--fg-default) 65%)", backgroundSize: "220% 100%" }}
              initial={false}
              animate={{ backgroundPosition: reduced ? "0% 0" : ["100% 0", "0% 0"] }}
              transition={reduced ? instant : { duration: 2.4, ease: "linear", repeat: Infinity }}
            >
              {compactUsed}
            </motion.span>
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="-ml-1 text-fg-muted">/ {capacity === null ? "—" : format.compact(capacity)}</span>
      <Badge size="sm" status={status}>{ratio === null ? "—" : format.percent.format(ratio)}</Badge>
    </div>
  );
}

function ContextMapTile({
  tile, rect, height, labels, format, reduced, active, pinned, descriptionId, onHover, onFocus, onSelect,
}: {
  tile: ContextTile;
  rect: CSSProperties;
  height: number;
  labels: ContextMapLabels;
  format: Formatters;
  reduced: boolean | null;
  active: boolean;
  pinned: boolean;
  descriptionId: string;
  onHover: (anchor: Anchor | null) => void;
  onFocus: (anchor: Anchor | null) => void;
  onSelect: (anchor: Anchor, block: ContextBlock | null) => void;
}) {
  const present = useIsPresent();
  const kind = tile.block?.kind ?? "free";
  const amount = format.number.format(tile.tokens) + " " + labels.tokens;
  const metadata = tile.fate ?? tile.block?.kind;
  const ink = kind === "free" || tile.fate === "dropped"
    ? "var(--fg-muted)"
    : "color-mix(in oklab, var(--context-tile-tint) 63%, var(--fg-default))";
  const name = [tile.label, tile.block && labels[kind], amount, tile.fate && labels[tile.fate]].filter(Boolean).join(", ");

  return (
    <motion.li
      layout={!reduced}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.75, transition: reduced ? instant : spring.moderate.exit }}
      transition={reduced ? instant : spring.moderate}
      data-kind={kind}
      data-fate={tile.fate}
      aria-hidden={!present || undefined}
      inert={!present}
      className={cn("absolute list-none", active && "z-10", !present && "pointer-events-none")}
      style={{ ...rect, "--context-tile-tint": tileColors[kind], "--context-tile-ink": ink } as CSSProperties}
    >
      <button
        type="button"
        aria-label={name}
        aria-pressed={pinned}
        aria-describedby={active ? descriptionId : undefined}
        data-slot="context-map-tile"
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") onHover({ key: tile.key, element: event.currentTarget });
        }}
        onPointerLeave={() => onHover(null)}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) onFocus({ key: tile.key, element: event.currentTarget });
        }}
        onBlur={() => onFocus(null)}
        onClick={(event) => onSelect({ key: tile.key, element: event.currentTarget }, tile.block)}
        className={cn(
          "@container/tile block size-full cursor-pointer overflow-hidden rounded-md border-hairline border-[color-mix(in_oklab,var(--context-tile-tint)_24%,transparent)]",
          "bg-[color-mix(in_oklab,var(--context-tile-tint)_10%,transparent)] text-left text-(color:--context-tile-ink) transition-colors duration-fast motion-reduce:transition-none",
          "hover:bg-[color-mix(in_oklab,var(--context-tile-tint)_16%,transparent)] aria-pressed:border-(--context-tile-tint)",
          kind === "free" && "border-dashed bg-transparent bg-[repeating-linear-gradient(135deg,transparent_0px,transparent_6px,color-mix(in_oklab,var(--context-tile-tint)_10%,transparent)_6px,color-mix(in_oklab,var(--context-tile-tint)_10%,transparent)_7px)]",
          tile.fate === "summarized" && "border-dashed border-(--context-tile-tint)",
          tile.fate === "dropped" && "border-border-subtle bg-muted hover:bg-muted",
          buttonFocus,
        )}
      >
        {height >= 24 && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden px-2 py-1.5 @min-[2.25rem]/tile:block">
            <span className={cn(detailPart, "text-label font-medium", tile.fate === "dropped" && "line-through")}>
              {tile.block?.icon}
              <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,black_calc(100%-8px),transparent)]">{tile.label}</span>
            </span>
            {height >= 40 && (
              <span className="block truncate text-label tabular-nums">
                {format.compact(tile.tokens)}
                {metadata && <span className="hidden @min-[6.75rem]/tile:inline"> · {labels[metadata]}</span>}
              </span>
            )}
          </span>
        )}
      </button>
    </motion.li>
  );
}

export const ContextMap = forwardRef<HTMLDivElement, ContextMapProps>(function ContextMap({
  blocks, limit, model, modelIcon, agents, agent, onAgentChange, compaction, view, onViewChange,
  status, onSelect, title, labels, locale = "en", className, ...props
}, ref) {
  const copy = { ...contextMapEnglishLabels, ...labels };
  const format = useMemo(() => contextMapFormatters(locale), [locale]);
  const headingId = useId();
  const descriptionId = useId();
  const snapshotId = useId();
  const MapIcon = useIcon("doc-data-grid");
  const Chevron = useIcon("chevron-down");
  const reduced = useReducedMotion();
  const [localView, setLocalView] = useState<ContextMapView>("after");
  const [localAgent, setLocalAgent] = useState<string>();
  const [hovered, setHovered] = useState<Anchor | null>(null);
  const [focused, setFocused] = useState<Anchor | null>(null);
  const [pinned, setPinned] = useState<Anchor | null>(null);
  const mapRef = useRef<HTMLUListElement>(null);
  const [size, setSize] = useState({ width: 672, height: 272 });

  useEffect(() => {
    const list = mapRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize((previous) => previous.width === width && previous.height === height ? previous : { width, height });
      }
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const agentIndex = agents?.findIndex((item) => item.id === (agent ?? localAgent)) ?? -1;
  const selectedAgent = agents?.[Math.max(0, agentIndex)];
  const capacity = selectedAgent?.limit ?? limit;
  const validLimit = Number.isFinite(capacity) && capacity > 0;
  const current = useMemo(() => getContextBlocks(blocks), [blocks]);
  const beforeBlocks = compaction?.before;
  const before = useMemo(() => beforeBlocks ? getContextBlocks(beforeBlocks) : [], [beforeBlocks]);
  const snapshot = compaction ? view ?? localView : "after";
  const isBefore = snapshot === "before";
  const visible = isBefore ? before : current;
  const fates = useMemo(() => compaction && getCompactionFates(before, compaction), [before, compaction]);
  const used = sumContextTokens(visible);
  const ratio = validLimit && Number.isFinite(used / capacity) ? used / capacity : null;
  const free = validLimit ? Math.max(0, capacity - used) : 0;
  const tiles = useMemo(() => {
    const items: ContextTile[] = visible.map((block) => ({
      key: "block:" + block.id, block, label: block.label, tokens: block.tokens,
      fate: isBefore && fates ? fates.byId.get(block.id) : undefined,
    }));
    if (free > 0) items.push({ key: "free", block: null, label: copy.free, tokens: free });
    return items;
  }, [visible, isBefore, fates, free, copy.free]);
  const rects = useMemo(() => layoutContextMap(tiles.map((tile) => tile.tokens), size.width, size.height), [tiles, size]);
  const tileFor = (anchor: Anchor | null) => anchor?.element.isConnected && tiles.find((tile) => tile.key === anchor.key);
  const active = [pinned, hovered, focused].find((anchor) => tileFor(anchor));
  const detail = active && tileFor(active);
  const summary = compaction?.summary
    ? current.find((block) => block.id === compaction.summary)
    : current.find((block) => block.kind === "summary" && !fates?.byId.has(block.id));
  const modelName = selectedAgent?.model ?? model;
  const logo = selectedAgent?.modelIcon ?? modelIcon;
  const capacityBadge = validLimit && <Badge size="sm" className="shrink-0 tabular-nums">{format.compact(capacity)}</Badge>;
  const pinnedVisible = Boolean(tileFor(pinned));

  useEffect(() => {
    if (!pinnedVisible) setPinned(null);
  }, [pinnedVisible]);

  function clearDetails() {
    setPinned(null);
    setHovered(null);
    setFocused(null);
  }

  return (
    <div {...props} ref={ref} data-slot="context-map" className={cn("@container/context-map w-full min-w-0 text-fg-default", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-body">
        <span id={headingId} className="inline-flex min-w-0 items-center gap-1.5 font-medium">
          <MapIcon size={15} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="truncate">{title ?? copy.title}</span>
        </span>
        {selectedAgent && agents ? (
          <DropdownMenu>
            <DropdownTrigger
              aria-label={[copy.agent, selectedAgent.label, modelName, validLimit && format.compact(capacity)].filter(Boolean).join(", ")}
              render={
                <Button variant="tertiary" size="xs" trailingIcon={Chevron} className="max-w-full min-w-0">
                  <span className="flex min-w-0 items-center gap-1">
                    {logo != null && <span aria-hidden="true" className="flex shrink-0 items-center [&>svg]:size-3">{logo}</span>}
                    <span className="truncate">{selectedAgent.label}</span>
                    {capacityBadge}
                  </span>
                </Button>
              }
            />
            <DropdownContent align="start" checkedIndex={Math.max(0, agentIndex)} className="w-64">
              {agents.map((item, index) => (
                <MenuItem
                  key={item.id}
                  index={index}
                  label={item.label}
                  checked={item.id === selectedAgent.id}
                  leading={item.modelIcon}
                  aria-label={[item.label, item.model, format.compact(item.limit)].filter(Boolean).join(", ")}
                  trailing={<span className="flex items-center gap-2 text-label text-fg-muted tabular-nums">
                    {item.model && <span className="max-w-20 truncate">{item.model}</span>}
                    <Badge size="sm">{format.compact(item.limit)}</Badge>
                  </span>}
                  onSelect={() => {
                    if (item.id === selectedAgent.id) return;
                    clearDetails();
                    if (agent === undefined) setLocalAgent(item.id);
                    onAgentChange?.(item.id);
                  }}
                />
              ))}
            </DropdownContent>
          </DropdownMenu>
        ) : (
          <span className={cn(detailPart, "text-fg-muted")}>
            {logo != null && <span aria-hidden="true" className="flex shrink-0 items-center [&>svg]:size-3.5">{logo}</span>}
            {modelName && <span className="truncate">{modelName}</span>}
            {capacityBadge}
          </span>
        )}
        {status && <Badge size="sm" role="status">{status}</Badge>}
        <div className="ml-auto flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1 @min-[30rem]/context-map:w-auto">
          {compaction && (
            <Tabs
              variant="segment"
              color="default"
              value={snapshot}
              onValueChange={(value) => {
                if ((value !== "before" && value !== "after") || value === snapshot) return;
                if (view === undefined) setLocalView(value);
                onViewChange?.(value);
              }}
            >
              <TabsList aria-label={copy.comparison}>
                <TabItem value="before" label={copy.before} id={snapshotId + "-before"} aria-controls={snapshotId} />
                <TabItem value="after" label={copy.after} id={snapshotId + "-after"} aria-controls={snapshotId} />
              </TabsList>
            </Tabs>
          )}
          <ContextMapUsage used={used} capacity={validLimit ? capacity : null} ratio={ratio} tokenLabel={copy.tokens} format={format} reduced={reduced} />
        </div>
      </div>
      {/* Both tabs point to the same panel so retained tiles can animate across snapshots. */}
      <div
        id={snapshotId}
        role={compaction ? "tabpanel" : undefined}
        aria-labelledby={compaction ? snapshotId + "-" + snapshot : undefined}
        className="relative h-[220px] rounded-xl border-hairline border-border bg-surface-floating p-0.75 @min-[30rem]/context-map:h-[280px]"
      >
        <ul ref={mapRef} role="list" aria-labelledby={headingId} className="relative size-full" data-slot="context-map-tiles">
          <AnimatePresence initial={false}>
            {rects.map(({ x, y, width, height }, index) => {
              const tile = tiles[index];
              const insetX = Math.min(1.25, width / 6);
              const insetY = Math.min(1.25, height / 6);
              return <ContextMapTile
                key={tile.key}
                tile={tile}
                height={height - 2 * insetY}
                rect={{
                  left: (x + insetX) / size.width * 100 + "%",
                  top: (y + insetY) / size.height * 100 + "%",
                  width: (width - 2 * insetX) / size.width * 100 + "%",
                  height: (height - 2 * insetY) / size.height * 100 + "%",
                }}
                labels={copy}
                format={format}
                reduced={reduced}
                active={active?.key === tile.key}
                pinned={pinned?.key === tile.key}
                descriptionId={descriptionId}
                onHover={setHovered}
                onFocus={setFocused}
                onSelect={(anchor, block) => {
                  if (pinned?.key === anchor.key) clearDetails();
                  else setPinned(anchor);
                  onSelect?.(block);
                }}
              />;
            })}
          </AnimatePresence>
        </ul>
      </div>
      {compaction !== undefined && (
        <div data-slot="context-map-compaction" className="mt-2 flex min-h-4 flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted tabular-nums">
          {fates ? (
            <>
              <span className="font-medium text-fg-default">{format.compact(sumContextTokens(before))} → {format.compact(sumContextTokens(current))}</span>
              {fateNames.map((fate) => {
                const { count, tokens } = fates.totals[fate];
                return (
                  <span key={fate} className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className={cn("size-2 rounded-xs border-hairline border-current", fate !== "kept" && "border-dashed", fate === "dropped" && "opacity-50")} />
                    <span>{count} {copy[fate]} · {format.compact(tokens)}{fate === "summarized" && summary && " " + copy.into + " " + format.compact(summary.tokens)}</span>
                  </span>
                );
              })}
            </>
          ) : copy.pending}
        </div>
      )}
      <Popover open={Boolean(detail)} onOpenChange={(open, event) => {
        if (open) return;
        if (event.reason === "outside-press" && event.event.target instanceof Node && mapRef.current?.contains(event.event.target)) return;
        clearDetails();
      }}>
        <PopoverContent
          id={descriptionId}
          role="tooltip"
          anchor={active?.element}
          initialFocus={false}
          finalFocus={false}
          align="start"
          sideOffset={5}
          className="pointer-events-none min-w-36 max-w-64 p-2.5 text-label"
          surfaceClassName="rounded-lg"
        >
          {detail && (
            <>
              <div className={cn(detailPart, "font-medium")}>{detail.block?.icon}<span className="wrap-anywhere">{detail.label}</span></div>
              <p className="mt-0.5 text-fg-muted">
                {detail.block && <>{copy[detail.block.kind]} · </>}
                {format.number.format(detail.tokens)} {copy.tokens}
                {validLimit && Number.isFinite(detail.tokens / capacity) && " · " + format.share.format(detail.tokens / capacity)}
              </p>
              {detail.block?.detail && <p className="mt-1.5 wrap-anywhere text-fg-muted">{detail.block.detail}</p>}
              {Boolean(detail.block?.items?.length) && (
                <>
                  <Separator aria-hidden="true" />
                  <ul role="list" className="space-y-1">
                    {detail.block?.items?.map((item, index) => (
                      <li key={index} className={detailPart}>{item.icon}<span className="wrap-anywhere">{item.label}</span></li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});

ContextMap.displayName = "ContextMap";
