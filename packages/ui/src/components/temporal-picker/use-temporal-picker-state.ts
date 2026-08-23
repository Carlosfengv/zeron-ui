"use client";

import * as React from "react";
import type { TemporalChangeContext } from "./temporal-types";

const hasOwn = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);

export function isControlledProp(props: object, key: string): boolean {
  return hasOwn(props, key);
}

interface UseTemporalValueStateOptions<TValue> {
  controlled: boolean;
  value: TValue | undefined;
  defaultValue: TValue | undefined;
  onValueChange?: (value: TValue | undefined, context: TemporalChangeContext) => void;
}

/** Controlled/uncontrolled committed value state. `undefined` remains a valid controlled value. */
export function useTemporalValueState<TValue>({
  controlled,
  value,
  defaultValue,
  onValueChange,
}: UseTemporalValueStateOptions<TValue>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<TValue | undefined>(defaultValue);
  const committedValue = controlled ? value : uncontrolledValue;
  const lastEmittedRef = React.useRef<TValue | undefined>(undefined);

  const commit = React.useCallback((next: TValue | undefined, context: TemporalChangeContext) => {
    lastEmittedRef.current = next;
    if (!controlled) setUncontrolledValue(next);
    onValueChange?.(next, context);
  }, [controlled, onValueChange]);

  return { committedValue, commit, lastEmittedRef };
}

interface UseTemporalOpenStateOptions {
  controlled: boolean;
  open: boolean | undefined;
  defaultOpen: boolean | undefined;
  onOpenChange?: (open: boolean) => void;
}

export function useTemporalOpenState({ controlled, open, defaultOpen = false, onOpenChange }: UseTemporalOpenStateOptions) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = controlled ? Boolean(open) : uncontrolledOpen;
  const setOpen = React.useCallback((next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [controlled, onOpenChange]);
  return { isOpen, setOpen };
}
