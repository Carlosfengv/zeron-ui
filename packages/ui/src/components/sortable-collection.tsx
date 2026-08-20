"use client";

import {
  useMemo,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  DragDropHorizontalIcon,
  PencilEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "#components/button";
import { Input } from "#components/input";
import { Popover, PopoverContent, PopoverTrigger } from "#components/popover";
import { cn } from "#system/utils";

export interface SortableCollectionItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  leadingIcon?: ReactNode;
  meta?: ReactNode;
  draggable?: boolean;
  removable?: boolean;
  editable?: boolean;
}

export interface SortableCollectionAddOption {
  id: string;
  title: string;
  description?: string;
  group?: string;
  leadingIcon?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
}

export interface SortableCollectionEditContext { close: () => void }
interface DragPreviewState {
  id: string;
  width: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}
export interface SortableCollectionActionContext {
  editing: boolean;
  edit: () => void;
  remove: () => void;
}

export interface SortableCollectionProps<T extends SortableCollectionItem>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled order. Array order is the priority order. */
  items: T[];
  onItemsChange: (items: T[]) => void;
  onReorder?: (items: T[]) => void;
  addOptions?: SortableCollectionAddOption[];
  addLabel?: string;
  allowDuplicates?: boolean;
  onAdd?: (option: SortableCollectionAddOption) => void;
  onRemove?: (item: T) => void;
  renderEditingContent?: (item: T, context: SortableCollectionEditContext) => ReactNode;
  /** Keep the default trailing area minimal; products can opt into a pencil affordance. */
  showEditAction?: boolean;
  renderActions?: (item: T, context: SortableCollectionActionContext) => ReactNode;
  maxItems?: number;
  emptyState?: ReactNode;
}

/** A pure helper so persistence layers can use the same ordering semantics. */
function reorderCollectionItems<T extends SortableCollectionItem>(
  items: T[], activeId: string, overId: string, placement: "before" | "after" = "before"
) {
  const from = items.findIndex((item) => item.id === activeId);
  const to = items.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  const targetIndex = next.findIndex((item) => item.id === overId);
  next.splice(targetIndex + (placement === "after" ? 1 : 0), 0, moved);
  return next;
}

function SortableCollection<T extends SortableCollectionItem>({
  items,
  onItemsChange,
  onReorder,
  addOptions = [],
  addLabel = "Add item",
  allowDuplicates = false,
  onAdd,
  onRemove,
  renderEditingContent,
  showEditAction = false,
  renderActions,
  maxItems,
  emptyState,
  className,
  ...props
}: SortableCollectionProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: "before" | "after" } | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);
  const [keyboardDraggedId, setKeyboardDraggedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const reduceMotion = useReducedMotion();
  const atLimit = maxItems !== undefined && items.length >= maxItems;
  const sortingDisabled = editingId !== null;
  const selectedIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const optionGroups = useMemo(() => {
    const queryText = query.trim().toLocaleLowerCase();
    const visible = addOptions.filter((option) =>
      !queryText || [option.title, option.description, option.group].filter(Boolean).join(" ").toLocaleLowerCase().includes(queryText)
    );
    return visible.reduce<Map<string, SortableCollectionAddOption[]>>((groups, option) => {
      const group = option.group ?? "Items";
      groups.set(group, [...(groups.get(group) ?? []), option]);
      return groups;
    }, new Map());
  }, [addOptions, query]);

  const announceTitle = (item: T) => typeof item.title === "string" ? item.title : "item";
  const commitOrder = (next: T[], message?: string) => {
    if (next === items) return;
    onItemsChange(next);
    onReorder?.(next);
    if (message) setAnnouncement(message);
  };
  const reorder = (activeId: string, overId: string, placement: "before" | "after" = "before") => {
    const next = reorderCollectionItems(items, activeId, overId, placement);
    const active = items.find((item) => item.id === activeId);
    const position = next.findIndex((item) => item.id === activeId) + 1;
    commitOrder(next, active ? `${announceTitle(active)} moved to position ${position}.` : undefined);
  };
  const completeDrag = () => { setDraggedId(null); setDropTarget(null); setDragPreview(null); };
  const remove = (item: T) => {
    if (item.removable === false) return;
    onItemsChange(items.filter((entry) => entry.id !== item.id));
    onRemove?.(item);
    setEditingId((current) => current === item.id ? null : current);
    setAnnouncement(`${announceTitle(item)} removed.`);
  };

  const resolveDropTarget = (clientX: number, clientY: number, activeId: string) => {
    const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-sortable-item-id]");
    const id = target?.dataset.sortableItemId;
    if (!target || !id) return null;
    if (id === activeId) return { id, placement: "before" as const };
    const { top, height } = target.getBoundingClientRect();
    return { id, placement: clientY < top + height / 2 ? "before" as const : "after" as const };
  };
  const startPointerDrag = (event: ReactPointerEvent<HTMLButtonElement>, item: T) => {
    if (sortingDisabled || item.draggable === false || event.button !== 0) return;
    event.preventDefault();
    const row = event.currentTarget.closest<HTMLElement>("[data-slot='sortable-collection-item']");
    if (!row) return;
    const rect = row.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedId(item.id);
    setDropTarget({ id: item.id, placement: "before" });
    setDragPreview({
      id: item.id,
      width: rect.width,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
    setAnnouncement(`Moving ${announceTitle(item)}. Choose a new position.`);
  };
  const movePointerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggedId) return;
    event.preventDefault();
    setDragPreview((current) => current ? { ...current, x: event.clientX, y: event.clientY } : current);
    setDropTarget(resolveDropTarget(event.clientX, event.clientY, draggedId));
  };
  const finishPointerDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggedId) return;
    const target = resolveDropTarget(event.clientX, event.clientY, draggedId);
    if (target) reorder(draggedId, target.id, target.placement);
    completeDrag();
  };
  const handleKeyboardReorder = (event: KeyboardEvent<HTMLButtonElement>, item: T) => {
    if (sortingDisabled || item.draggable === false) return;
    const activeId = keyboardDraggedId ?? item.id;
    const index = items.findIndex((entry) => entry.id === activeId);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (keyboardDraggedId === item.id) {
        setKeyboardDraggedId(null);
        setAnnouncement(`${announceTitle(item)} placed at position ${index + 1}.`);
      } else {
        setKeyboardDraggedId(item.id);
        setAnnouncement(`Moving ${announceTitle(item)}. Use up or down arrow keys to reorder.`);
      }
      return;
    }
    if (event.key === "Escape" && keyboardDraggedId) {
      event.preventDefault();
      setKeyboardDraggedId(null);
      return setAnnouncement("Move cancelled.");
    }
    if (!keyboardDraggedId || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const destination = items[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (destination) reorder(activeId, destination.id);
  };

  return (
    <div
      {...props}
      className={cn("@container relative flex w-full min-w-0 flex-col gap-1 rounded-lg border border-border-subtle bg-muted/70 p-1.5", className)}
      data-slot="sortable-collection"
    >
      <span aria-live="polite" className="sr-only">{announcement}</span>
      <div className="flex min-w-0 flex-col gap-1.5" role="list">
        {items.map((item) => {
          const editing = editingId === item.id;
          const dragging = draggedId === item.id || keyboardDraggedId === item.id;
          const originalPositionTarget = dragging && dropTarget?.id === item.id;
          const dropTargetPlacement = dropTarget?.id === item.id && draggedId !== item.id ? dropTarget.placement : null;
          const canDrag = !sortingDisabled && item.draggable !== false;
          const canEdit = item.editable !== false && !!renderEditingContent;
          const actionContext = {
            editing,
            edit: () => canEdit && setEditingId(item.id),
            remove: () => remove(item),
          } satisfies SortableCollectionActionContext;

          return (
            <motion.div
              key={item.id}
              layout={!reduceMotion}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.2, 0.8, 0.2, 1] }}
              role="listitem"
              data-slot="sortable-collection-item"
              data-sortable-item-id={item.id}
              data-state={editing ? "editing" : dragging ? "dragging" : undefined}
              className={cn(
                "group relative flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-floating px-2 py-2 text-body text-fg-default shadow-control",
                "outline-none transition-[background-color,box-shadow,opacity] duration-fast focus-within:ring-1 focus-within:ring-focus-ring",
                dragging && "bg-emphasis",
                dragging && !originalPositionTarget && "shadow-none"
              )}
              >
              {originalPositionTarget && <span aria-hidden className="pointer-events-none absolute inset-0 z-content rounded-lg border border-brand" data-slot="sortable-collection-original-position" />}
              {dropTargetPlacement && (
                <motion.span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute left-1.5 right-1.5 z-content h-0.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--muted)]",
                    dropTargetPlacement === "before" ? "-top-1" : "-bottom-1"
                  )}
                  initial={reduceMotion ? false : { opacity: 0, scaleX: 0.7 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.08 }}
                />
              )}
              <button
                aria-label={`Reorder ${announceTitle(item)}`}
                aria-pressed={keyboardDraggedId === item.id || undefined}
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-md text-fg-subtle outline-none transition-colors duration-fast focus-visible:ring-1 focus-visible:ring-focus-ring",
                  canDrag ? "touch-none cursor-grab hover:bg-hover hover:text-fg-default active:cursor-grabbing" : "cursor-not-allowed opacity-35",
                  dragging && "invisible"
                )}
                onKeyDown={(event) => handleKeyboardReorder(event, item)}
                onPointerCancel={completeDrag}
                onPointerDown={(event) => startPointerDrag(event, item)}
                onPointerMove={movePointerDrag}
                onPointerUp={finishPointerDrag}
                type="button"
              >
                <HugeiconsIcon aria-hidden icon={DragDropHorizontalIcon} size={16} strokeWidth={1.5} />
              </button>
              {item.leadingIcon && <span className={cn("grid size-4 shrink-0 place-items-center text-fg-muted", dragging && "invisible")} data-slot="sortable-collection-icon">{item.leadingIcon}</span>}
              <div className={cn("min-w-0 flex-1", dragging && "invisible")} data-slot="sortable-collection-content">
                <AnimatePresence initial={false} mode="wait">
                  {editing && renderEditingContent ? (
                    <motion.div key="editing" initial={reduceMotion ? false : { opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 2 }} transition={{ duration: reduceMotion ? 0 : 0.12 }}>
                      {renderEditingContent(item, { close: () => setEditingId(null) })}
                    </motion.div>
                  ) : (
                    <motion.div key="display" initial={reduceMotion ? false : { opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -2 }} transition={{ duration: reduceMotion ? 0 : 0.12 }} className="min-w-0">
                      <div className="flex min-w-0 items-baseline gap-1.5">
                        <span className="min-w-0 truncate font-medium text-fg-default">{item.title}</span>
                        {item.description && <span className="min-w-0 truncate text-label text-fg-subtle">{item.description}</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {(item.meta || (showEditAction && canEdit) || item.removable !== false || renderActions) && (
                <div className={cn("flex shrink-0 items-center gap-1.5", dragging && "invisible")} data-slot="sortable-collection-actions">
                  {item.meta && <div className="hidden items-center gap-1 @sm:flex">{item.meta}</div>}
                  {renderActions?.(item, actionContext)}
                  {showEditAction && canEdit && <Button aria-label={editing ? `Finish editing ${announceTitle(item)}` : `Edit ${announceTitle(item)}`} iconOnly onClick={() => setEditingId((current) => current === item.id ? null : item.id)} size="xs" type="button" variant="ghost"><HugeiconsIcon aria-hidden icon={PencilEdit01Icon} size={16} strokeWidth={1.5} /></Button>}
                  {item.removable !== false && <Button aria-label={`Remove ${announceTitle(item)}`} className="hover:text-fg-danger" iconOnly onClick={() => remove(item)} size="xs" type="button" variant="ghost"><HugeiconsIcon aria-hidden icon={Cancel01Icon} size={16} strokeWidth={1.5} /></Button>}
                </div>
              )}
            </motion.div>
          );
        })}
        {!items.length && emptyState && <div className="rounded-lg border border-dashed border-border p-4 text-center text-body text-fg-muted">{emptyState}</div>}
      </div>

      {addOptions.length > 0 && (
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger render={<Button active={addOpen} className="mt-1 w-full" disabled={atLimit} size="md" type="button" variant="tertiary">{addLabel}</Button>} />
          <PopoverContent align="start" className="w-[min(92vw,28rem)] p-2" side="top" sideOffset={8}>
            <label className="sr-only" htmlFor="sortable-collection-search">Search items to add</label>
            <div className="relative mb-2">
              <HugeiconsIcon aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" icon={Search01Icon} size={16} strokeWidth={1.5} />
              <Input autoFocus className="pl-8" id="sortable-collection-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search items" size="sm" type="search" value={query} variant="secondary" />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {Array.from(optionGroups.entries()).map(([group, options]) => (
                <section key={group} className="py-1 first:pt-0 last:pb-0">
                  <div className="px-2 py-1 text-label font-medium text-fg-subtle">{group}</div>
                  <div className="flex flex-col gap-0.5">
                    {options.map((option) => {
                      const selected = !allowDuplicates && selectedIds.has(option.id);
                      const unavailable = option.disabled || selected || atLimit;
                      return <button aria-disabled={unavailable || undefined} className={cn("flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left outline-none transition-colors duration-fast", unavailable ? "cursor-not-allowed opacity-45" : "hover:bg-hover focus-visible:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring")} disabled={unavailable} key={option.id} onClick={() => { if (!unavailable) { onAdd?.(option); setAddOpen(false); setQuery(""); } }} type="button">
                        {option.leadingIcon && <span className="grid size-4 shrink-0 place-items-center text-fg-muted">{option.leadingIcon}</span>}
                        <span className="min-w-0 flex-1"><span className="block truncate text-body font-medium text-fg-default">{option.title}</span>{option.description && <span className="block truncate text-label text-fg-subtle">{option.description}</span>}</span>
                        {option.meta && <span className="shrink-0 text-label text-fg-muted">{option.meta}</span>}
                        {selected && <span className="shrink-0 text-label text-fg-subtle">Added</span>}
                      </button>;
                    })}
                  </div>
                </section>
              ))}
              {!optionGroups.size && <p className="px-2 py-6 text-center text-body text-fg-muted">No matching items</p>}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {dragPreview && typeof document !== "undefined" && (() => {
        const item = items.find((entry) => entry.id === dragPreview.id);
        if (!item) return null;
        return createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-overlay flex min-w-0 items-center gap-1.5 rounded-lg bg-surface-floating px-2 py-2 text-body text-fg-default opacity-60 shadow-overlay will-change-transform"
            data-slot="sortable-collection-drag-preview"
            style={{
              width: dragPreview.width,
              transform: `translate3d(${dragPreview.x - dragPreview.offsetX}px, ${dragPreview.y - dragPreview.offsetY}px, 0)`,
            }}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-md text-fg-subtle"><HugeiconsIcon icon={DragDropHorizontalIcon} size={16} strokeWidth={1.5} /></span>
            {item.leadingIcon && <span className="grid size-4 shrink-0 place-items-center text-fg-muted">{item.leadingIcon}</span>}
            <span className="flex min-w-0 flex-1 items-baseline gap-1.5"><span className="min-w-0 truncate font-medium">{item.title}</span>{item.description && <span className="min-w-0 truncate text-label text-fg-subtle">{item.description}</span>}</span>
            {item.meta && <span className="flex shrink-0 items-center gap-1">{item.meta}</span>}
            {item.removable !== false && <HugeiconsIcon className="shrink-0 text-fg-subtle" icon={Cancel01Icon} size={16} strokeWidth={1.5} />}
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

export { SortableCollection, reorderCollectionItems };
