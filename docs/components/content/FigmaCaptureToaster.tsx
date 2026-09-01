"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ToastStack,
  type ToastData,
  type ToastId,
  type ToastUpdate,
} from "@zeron/ui/toast";

const FIGMA_TOAST_ID = "figma-capture-toast";
const EMPTY_TOASTS: ToastData[] = [];

let currentToasts: ToastData[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentToasts;
}

function dismiss(id?: ToastId) {
  currentToasts = id !== undefined
    ? currentToasts.filter((item) => item.id !== id)
    : [];
  emit();
}

export const figmaCaptureToast = {
  loading(title: ToastData["title"]) {
    currentToasts = [
      {
        id: FIGMA_TOAST_ID,
        title,
        status: "loading",
        duration: 0,
        dismissible: true,
        createdAt: Date.now(),
      },
    ];
    emit();
    return FIGMA_TOAST_ID;
  },
  update(id: ToastId, patch: ToastUpdate) {
    currentToasts = currentToasts.map((item) =>
      item.id === id
        ? { ...item, ...patch, id, createdAt: Date.now() }
        : item,
    );
    emit();
  },
};

export function FigmaCaptureToaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TOASTS);
  const [portalContainer, setPortalContainer] = useState<Element | null>(null);
  const onDismiss = useCallback((id: ToastId) => dismiss(id), []);

  useEffect(() => {
    const syncPortalContainer = () => {
      setPortalContainer(document.fullscreenElement);
    };
    syncPortalContainer();
    document.addEventListener("fullscreenchange", syncPortalContainer);
    return () => {
      document.removeEventListener("fullscreenchange", syncPortalContainer);
    };
  }, []);

  useEffect(() => {
    const item = toasts[0];
    if (!item?.duration || item.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <ToastStack
      toasts={toasts}
      onDismiss={onDismiss}
      placement="fixed"
      portal
      container={portalContainer}
      position="top-center"
    />
  );
}
