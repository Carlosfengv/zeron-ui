"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type Ref,
  type HTMLAttributes,
} from "react";
import { motion, useMotionValue, animate, type Transition } from "framer-motion";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "#system/utils";
import { spring } from "#system/springs";

interface SwitchProps extends Omit<HTMLAttributes<HTMLDivElement>, "defaultChecked" | "onChange"> {
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** @deprecated Prefer onCheckedChange for new form integrations. */
  onToggle?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  form?: string;
  required?: boolean;
  value?: string;
  uncheckedValue?: string;
  thumbTransition?: Transition;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;
const PILL_EXTEND = 2;
const PRESS_EXTEND = 4;
const PRESS_SHRINK = 4;
const DRAG_DEAD_ZONE = 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  (
    {
      label,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      onToggle,
      disabled = false,
      readOnly = false,
      id,
      inputRef,
      name,
      form,
      required,
      value,
      uncheckedValue,
      thumbTransition,
      className,
      ...props
    },
    ref
  ) => {
    const labelId = useId();
    const hasMounted = useRef(false);
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const checked = checkedProp ?? internalChecked;

    const commitChecked = useCallback(
      (nextChecked: boolean) => {
        if (disabled || readOnly || nextChecked === checked) return;
        if (checkedProp === undefined) setInternalChecked(nextChecked);
        onCheckedChange?.(nextChecked);
        onToggle?.();
      },
      [checked, checkedProp, disabled, onCheckedChange, onToggle, readOnly]
    );

    const dragging = useRef(false);
    const didDrag = useRef(false);
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    const motionX = useMotionValue(
      checked ? THUMB_OFFSET + THUMB_TRAVEL : THUMB_OFFSET
    );

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const thumbWidth = pressed
      ? THUMB_SIZE + PRESS_EXTEND
      : hovered
        ? THUMB_SIZE + PILL_EXTEND
        : THUMB_SIZE;
    const thumbHeight = pressed ? THUMB_SIZE - PRESS_SHRINK : THUMB_SIZE;
    const thumbY = pressed ? THUMB_OFFSET + PRESS_SHRINK / 2 : THUMB_OFFSET;
    const extraWidth = thumbWidth - THUMB_SIZE;
    const thumbX = checked
      ? THUMB_OFFSET + THUMB_TRAVEL - extraWidth
      : THUMB_OFFSET;

    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) {
        motionX.set(thumbX);
      } else {
        animate(motionX, thumbX, thumbTransition ?? spring.moderate);
      }
    }, [thumbX, motionX, thumbTransition]);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = {
          clientX: e.clientX,
          originX: motionX.get(),
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, motionX, readOnly]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }

        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
        const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.set(Math.max(dragMin, Math.min(dragMax, rawX)));
      },
      [motionX]
    );

    const handlePointerUp = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          didDrag.current = true;
          dragging.current = false;

          const currentX = motionX.get();
          const dragMin = THUMB_OFFSET;
          const pressedThumbWidth = THUMB_SIZE + PRESS_EXTEND;
          const dragMax = TRACK_WIDTH - THUMB_OFFSET - pressedThumbWidth;
          const midpoint = (dragMin + dragMax) / 2;

          const shouldBeOn = currentX > midpoint;

          if (shouldBeOn !== checked) {
            commitChecked(shouldBeOn);
          } else {
            const snapTarget = checked
              ? THUMB_OFFSET + THUMB_TRAVEL
              : THUMB_OFFSET;
            animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
          }

          requestAnimationFrame(() => {
            didDrag.current = false;
          });
        }

        pointerStart.current = null;
      },
      [checked, commitChecked, motionX, thumbTransition]
    );

    const handlePointerCancel = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          dragging.current = false;
          const snapTarget = checked
            ? THUMB_OFFSET + THUMB_TRAVEL
            : THUMB_OFFSET;
          animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
        }

        pointerStart.current = null;
      },
      [checked, motionX, thumbTransition]
    );

    return (
      <div
        ref={ref}
        className={cn(
          "relative z-content flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none touch-none",
          disabled && "opacity-50 pointer-events-none",
          readOnly && "cursor-default",
          className
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => {
          if (disabled || readOnly || didDrag.current) return;
          commitChecked(!checked);
        }}
        {...props}
      >
        {/* Switch */}
        <SwitchPrimitive.Root
          checked={checked}
          aria-labelledby={labelId}
          onCheckedChange={(nextChecked) => {
            if (didDrag.current) return;
            commitChecked(nextChecked);
          }}
          disabled={disabled}
          readOnly={readOnly}
          id={id}
          inputRef={inputRef}
          name={name}
          form={form}
          required={required}
          value={value}
          uncheckedValue={uncheckedValue}
          tabIndex={0}
          className={cn(
            "relative shrink-0 rounded-full border-[0.5px] border-border outline-none cursor-pointer",
            "transition-colors duration-fast",
            "focus-visible:ring-1 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          )}
          style={{
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            backgroundColor: checked
              ? hovered ? "var(--brand-hover)" : "var(--brand)"
              : hovered
                ? "var(--secondary-action-hover)"
                : "var(--secondary-action)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb
            render={(props) => {
              const {
                style: baseStyle,
                onDrag: _onDrag,
                onDragStart: _onDragStart,
                onDragEnd: _onDragEnd,
                onAnimationStart: _onAnimationStart,
                onAnimationEnd: _onAnimationEnd,
                onAnimationIteration: _onAnimationIteration,
                ...rest
              } = props as React.HTMLAttributes<HTMLSpanElement>;
              return (
                <motion.span
                  {...rest}
                  className="absolute top-0 left-0 block rounded-full bg-fg-on-brand shadow-knob"
                  initial={false}
                  style={{
                    ...(baseStyle as React.CSSProperties | undefined),
                    x: motionX,
                  }}
                  animate={{
                    y: thumbY,
                    width: thumbWidth,
                    height: thumbHeight,
                  }}
                  transition={hasMounted.current ? (thumbTransition ?? spring.moderate) : { duration: 0 }}
                />
              );
            }}
          />
        </SwitchPrimitive.Root>

        {/* Label */}
        <span
          id={labelId}
          className={cn(
            "text-body transition-[color] duration-fast",
            checked ? "text-fg-default" : "text-fg-muted"
          )}
        >
          {label}
        </span>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
