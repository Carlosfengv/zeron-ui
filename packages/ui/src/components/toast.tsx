"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type OlHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "#components/button";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useIcon } from "#system/icon-context";
import { usePortalContainer } from "#system/portal-container-context";
import {
  resolveSurface,
  SurfaceProvider,
  useSurface,
} from "#system/surface-context";
import { surfaceClasses } from "#system/surface-classes";

type ToastStatus = "neutral" | "info" | "loading" | "success" | "error";
type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
type ToastPlacement = "static" | "fixed" | "absolute";
type ToastId = string | number;
type ToastOffsetValue = number | string;
type ToastOffset =
  | ToastOffsetValue
  | Partial<Record<"top" | "right" | "bottom" | "left", ToastOffsetValue>>;

interface ToastAction {
  label: ReactNode;
  onClick: (toast: ToastData) => void;
  /** Dismiss after the action runs. Defaults to true. */
  dismissOnClick?: boolean;
}

interface ToastData {
  id: ToastId;
  title: ReactNode;
  description?: ReactNode;
  status?: ToastStatus;
  icon?: ReactNode;
  action?: ToastAction;
  /** Lifetime in milliseconds. Set to 0 to keep the toast visible. */
  duration?: number;
  dismissible?: boolean;
  createdAt?: number;
}

interface ToastOptions
  extends Omit<ToastData, "id" | "title" | "createdAt"> {
  id?: ToastId;
}

type ToastUpdate = Partial<Omit<ToastData, "id" | "createdAt">>;

interface ToastClassNames {
  root?: string;
  item?: string;
  surface?: string;
  icon?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  close?: string;
}

interface ToastProps {
  toast: ToastData;
  position?: ToastPosition;
  onDismiss?: (id: ToastId) => void;
  classNames?: ToastClassNames;
  icons?: Partial<Record<ToastStatus, ReactNode>>;
  renderToast?: (toast: ToastData) => ReactNode;
  closeLabel?: string;
}

interface ToastStackProps
  extends Omit<OlHTMLAttributes<HTMLOListElement>, "children"> {
  toasts: ToastData[];
  onDismiss?: (id: ToastId) => void;
  position?: ToastPosition;
  placement?: ToastPlacement;
  portal?: boolean;
  container?: Element | null;
  /** Distance from the anchored viewport edges. A scalar applies to every
   * active edge; an object can tune each edge independently. */
  offset?: ToastOffset;
  maxVisible?: number;
  classNames?: ToastClassNames;
  icons?: Partial<Record<ToastStatus, ReactNode>>;
  renderToast?: (toast: ToastData) => ReactNode;
  closeLabel?: string;
}

interface ToasterProps
  extends Omit<ToastStackProps, "toasts" | "onDismiss"> {
  /** Default lifetime for non-loading toasts, in milliseconds. */
  duration?: number;
}

const POSITION_CLASS: Record<ToastPosition, string> = {
  "top-left": "",
  "top-center": "left-1/2 -translate-x-1/2",
  "top-right": "",
  "bottom-left": "",
  "bottom-center": "left-1/2 -translate-x-1/2",
  "bottom-right": "",
};

const DEFAULT_EDGE_OFFSET = {
  top: "max(1rem, env(safe-area-inset-top))",
  right: "max(1rem, env(safe-area-inset-right))",
  bottom: "max(1rem, env(safe-area-inset-bottom))",
  left: "max(1rem, env(safe-area-inset-left))",
} satisfies Record<"top" | "right" | "bottom" | "left", ToastOffsetValue>;

function getPositionStyle(
  position: ToastPosition,
  offset?: ToastOffset,
): CSSProperties {
  const edgeOffsets =
    typeof offset === "object" && offset !== null ? offset : {};
  const scalarOffset =
    typeof offset === "number" || typeof offset === "string"
      ? offset
      : undefined;
  const style: CSSProperties = {};

  if (position.startsWith("top")) {
    style.top = edgeOffsets.top ?? scalarOffset ?? DEFAULT_EDGE_OFFSET.top;
  } else {
    style.bottom =
      edgeOffsets.bottom ?? scalarOffset ?? DEFAULT_EDGE_OFFSET.bottom;
  }

  if (position.endsWith("left")) {
    style.left = edgeOffsets.left ?? scalarOffset ?? DEFAULT_EDGE_OFFSET.left;
  } else if (position.endsWith("right")) {
    style.right =
      edgeOffsets.right ?? scalarOffset ?? DEFAULT_EDGE_OFFSET.right;
  }

  return style;
}

const STATUS_STYLE: Record<ToastStatus, string> = {
  neutral: "bg-neutral-status-surface text-fg-neutral-status",
  info: "bg-info-surface text-fg-info",
  loading: "bg-info-surface text-fg-info",
  success: "bg-success-surface text-fg-success",
  error: "bg-danger-surface text-fg-danger",
};

let toastSeed = 0;
let memoryToasts: ToastData[] = [];
const listeners = new Set<() => void>();
const EMPTY_TOASTS: ToastData[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return memoryToasts;
}

function addToast(title: ReactNode, options: ToastOptions = {}) {
  const id = options.id ?? `toast-${Date.now()}-${toastSeed++}`;
  const next: ToastData = {
    ...options,
    id,
    title,
    createdAt: Date.now(),
    dismissible: options.dismissible ?? true,
  };

  memoryToasts = [...memoryToasts.filter((item) => item.id !== id), next];
  emit();
  return id;
}

function dismissToast(id?: ToastId) {
  memoryToasts =
    id === undefined ? [] : memoryToasts.filter((item) => item.id !== id);
  emit();
}

function updateToast(id: ToastId, patch: ToastUpdate) {
  memoryToasts = memoryToasts.map((item) =>
    item.id === id
      ? { ...item, ...patch, id, createdAt: Date.now() }
      : item,
  );
  emit();
}

interface ToastFunction {
  (title: ReactNode, options?: ToastOptions): ToastId;
  neutral: (title: ReactNode, options?: Omit<ToastOptions, "status">) => ToastId;
  info: (title: ReactNode, options?: Omit<ToastOptions, "status">) => ToastId;
  loading: (title: ReactNode, options?: Omit<ToastOptions, "status">) => ToastId;
  success: (title: ReactNode, options?: Omit<ToastOptions, "status">) => ToastId;
  error: (title: ReactNode, options?: Omit<ToastOptions, "status">) => ToastId;
  update: (id: ToastId, patch: ToastUpdate) => void;
  dismiss: (id?: ToastId) => void;
}

const toast = Object.assign(
  (title: ReactNode, options?: ToastOptions) => addToast(title, options),
  {
    neutral: (title: ReactNode, options?: Omit<ToastOptions, "status">) =>
      addToast(title, { ...options, status: "neutral" }),
    info: (title: ReactNode, options?: Omit<ToastOptions, "status">) =>
      addToast(title, { ...options, status: "info" }),
    loading: (title: ReactNode, options?: Omit<ToastOptions, "status">) =>
      addToast(title, { ...options, status: "loading" }),
    success: (title: ReactNode, options?: Omit<ToastOptions, "status">) =>
      addToast(title, { ...options, status: "success" }),
    error: (title: ReactNode, options?: Omit<ToastOptions, "status">) =>
      addToast(title, { ...options, status: "error" }),
    update: updateToast,
    dismiss: dismissToast,
  },
) as ToastFunction;

const ToastStack = forwardRef<HTMLOListElement, ToastStackProps>(
  (
    {
      toasts,
      onDismiss,
      position = "bottom-right",
      placement = "static",
      portal,
      container,
      offset,
      maxVisible = 4,
      className,
      style,
      classNames,
      icons,
      renderToast,
      closeLabel = "Dismiss notification",
      ...props
    },
    ref,
  ) => {
    const ambientContainer = usePortalContainer();
    const shouldPortal = portal ?? placement === "fixed";
    const [portalTarget, setPortalTarget] = useState<Element | null>(null);
    const isTop = position.startsWith("top");
    const visibleToasts = toasts.slice(-Math.max(1, maxVisible));

    useEffect(() => {
      if (!shouldPortal) {
        setPortalTarget(null);
        return;
      }
      setPortalTarget(container ?? ambientContainer ?? document.body);
    }, [ambientContainer, container, shouldPortal]);

    const stack = (
      <ol
        ref={ref}
        aria-label="Notifications"
        className={cn(
          "pointer-events-none m-0 flex w-[calc(100vw-2rem)] max-w-sm list-none gap-2 p-0",
          isTop ? "flex-col-reverse" : "flex-col",
          placement === "fixed" && "fixed z-tooltip",
          placement === "absolute" && "absolute z-tooltip",
          placement !== "static" && POSITION_CLASS[position],
          classNames?.root,
          className,
        )}
        style={{
          ...(placement === "static" ? {} : getPositionStyle(position, offset)),
          ...style,
        }}
        {...props}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleToasts.map((item) => (
            <Toast
              key={item.id}
              toast={item}
              position={position}
              onDismiss={onDismiss}
              classNames={classNames}
              icons={icons}
              renderToast={renderToast}
              closeLabel={closeLabel}
            />
          ))}
        </AnimatePresence>
      </ol>
    );

    if (shouldPortal && !portalTarget) return null;
    return shouldPortal && portalTarget
      ? createPortal(stack, portalTarget)
      : stack;
  },
);
ToastStack.displayName = "ToastStack";

const Toast = memo(function Toast({
  toast: item,
  position = "bottom-right",
  onDismiss,
  classNames,
  icons,
  renderToast,
  closeLabel = "Dismiss notification",
}: ToastProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const substrate = useSurface();
  const surface = resolveSurface(substrate, "floating");
  const BellIcon = useIcon("bell");
  const InfoIcon = useIcon("doc-info-item");
  const LoadingIcon = useIcon("loader");
  const SuccessIcon = useIcon("check");
  const ErrorIcon = useIcon("circle-x");
  const CloseIcon = useIcon("x");
  const status = item.status ?? "neutral";
  const statusIcons = {
    neutral: BellIcon,
    info: InfoIcon,
    loading: LoadingIcon,
    success: SuccessIcon,
    error: ErrorIcon,
  };
  const StatusIcon = statusIcons[status];
  const iconNode =
    item.icon ?? icons?.[status] ?? <StatusIcon size={16} strokeWidth={2} />;
  const canDismiss = item.dismissible !== false && Boolean(onDismiss);
  const isSingleLine = !item.description && !item.action;
  const enterY = position.startsWith("top") ? -12 : 12;
  const exit = position.endsWith("left")
    ? { x: -28 }
    : position.endsWith("right")
      ? { x: 28 }
      : { y: position.startsWith("top") ? -12 : 12 };

  const shouldDismissAfterDrag = (offset: number, velocity: number) => {
    if (position.endsWith("left")) return offset < -72 || velocity < -520;
    if (position.endsWith("right")) return offset > 72 || velocity > 520;
    return Math.abs(offset) > 72 || Math.abs(velocity) > 520;
  };

  return (
    <motion.li
      layout="position"
      role={status === "error" ? "alert" : "status"}
      aria-atomic="true"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: enterY, scale: 0.97 }
      }
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0.97,
        ...(reduceMotion ? {} : exit),
        transition: spring.moderate.exit,
      }}
      transition={spring.moderate}
      drag={canDismiss && !reduceMotion ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      onDragEnd={(_, info) => {
        if (
          canDismiss &&
          onDismiss &&
          shouldDismissAfterDrag(info.offset.x, info.velocity.x)
        ) {
          onDismiss(item.id);
        }
      }}
      className={cn(
        "pointer-events-auto relative touch-pan-y",
        classNames?.item,
      )}
    >
      <SurfaceProvider role={surface}>
        <div
          className={cn(
            surfaceClasses(surface),
            "relative overflow-hidden rounded-xl border-[0.5px] border-border p-3",
            classNames?.surface,
          )}
        >
          {renderToast ? (
            renderToast(item)
          ) : (
            <div
              className={cn(
                "flex gap-3",
                isSingleLine ? "items-center" : "items-start",
              )}
            >
              <motion.span
                layout="position"
                className={cn(
                  "inline-flex h-control-sm w-7 shrink-0 items-center justify-center rounded-lg",
                  !isSingleLine && "mt-0.5",
                  STATUS_STYLE[status],
                  classNames?.icon,
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={status}
                    aria-hidden="true"
                    className="inline-flex"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 4, scale: 0.9 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      ...(reduceMotion ? {} : { y: -4, scale: 0.9 }),
                      transition: spring.fast.exit,
                    }}
                    transition={spring.fast}
                  >
                    {status === "loading" ? (
                      <motion.span
                        className="inline-flex"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          ease: "linear",
                          repeat: Infinity,
                        }}
                      >
                        {iconNode}
                      </motion.span>
                    ) : (
                      iconNode
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.span>

              <div className={cn("min-w-0 flex-1", classNames?.content)}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${item.id}-${status}-${String(item.title)}-${String(item.description)}`}
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={{
                      opacity: 0,
                      ...(reduceMotion ? {} : { y: -4 }),
                      transition: spring.fast.exit,
                    }}
                    transition={spring.fast}
                  >
                    <div
                      className={cn(
                        "truncate text-body font-semibold text-fg-default",
                        classNames?.title,
                      )}
                    >
                      {item.title}
                    </div>
                    {item.description ? (
                      <div
                        className={cn(
                          "mt-0.5 line-clamp-2 text-label text-fg-muted",
                          classNames?.description,
                        )}
                      >
                        {item.description}
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>

                {item.action ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      item.action?.onClick(item);
                      if (item.action?.dismissOnClick !== false) {
                        onDismiss?.(item.id);
                      }
                    }}
                    className={cn(
                      "mt-2 px-2.5 font-medium",
                      classNames?.action,
                    )}
                  >
                    {item.action.label}
                  </Button>
                ) : null}
              </div>

              {canDismiss ? (
                <Button
                  type="button"
                  variant="ghost"
                  iconOnly
                  size="xs"
                  onClick={() => onDismiss?.(item.id)}
                  aria-label={closeLabel}
                  className={cn(
                    "shrink-0",
                    classNames?.close,
                  )}
                >
                  <CloseIcon aria-hidden size={14} strokeWidth={2} />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </SurfaceProvider>
    </motion.li>
  );
});
Toast.displayName = "Toast";

const Toaster = forwardRef<HTMLOListElement, ToasterProps>(
  ({ duration = 4200, placement = "fixed", portal, ...props }, ref) => {
    const toasts = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TOASTS);
    const timers = useRef(
      new Map<ToastId, { timer: ReturnType<typeof setTimeout>; signature: string }>(),
    );
    const onDismiss = useCallback((id: ToastId) => dismissToast(id), []);

    useEffect(() => {
      const activeIds = new Set(toasts.map((item) => item.id));

      timers.current.forEach((entry, id) => {
        if (!activeIds.has(id)) {
          clearTimeout(entry.timer);
          timers.current.delete(id);
        }
      });

      toasts.forEach((item) => {
        const lifetime =
          item.duration ?? (item.status === "loading" ? 0 : duration);
        const existing = timers.current.get(item.id);

        if (lifetime <= 0) {
          if (existing) clearTimeout(existing.timer);
          timers.current.delete(item.id);
          return;
        }

        const createdAt = item.createdAt ?? Date.now();
        const signature = `${createdAt}:${lifetime}`;
        if (existing?.signature === signature) return;
        if (existing) clearTimeout(existing.timer);

        const remaining = Math.max(
          lifetime - (Date.now() - createdAt),
          0,
        );
        const timer = setTimeout(() => dismissToast(item.id), remaining);
        timers.current.set(item.id, { timer, signature });
      });
    }, [duration, toasts]);

    useEffect(() => {
      const currentTimers = timers.current;
      return () => {
        currentTimers.forEach((entry) => clearTimeout(entry.timer));
        currentTimers.clear();
      };
    }, []);

    return (
      <ToastStack
        ref={ref}
        toasts={toasts}
        onDismiss={onDismiss}
        placement={placement}
        portal={portal ?? placement === "fixed"}
        {...props}
      />
    );
  },
);
Toaster.displayName = "Toaster";

export { toast, Toast, Toaster, ToastStack };
export type {
  ToastAction,
  ToastClassNames,
  ToastData,
  ToastId,
  ToastOptions,
  ToastOffset,
  ToastOffsetValue,
  ToastPlacement,
  ToastPosition,
  ToastProps,
  ToastStackProps,
  ToastStatus,
  ToastUpdate,
  ToasterProps,
};
