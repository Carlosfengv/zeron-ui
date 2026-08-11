"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const DesktopRightPanel = lazy(() =>
  import("@/docs/site/right-panel").then((module) => ({ default: module.RightPanel }))
);

function useDesktopChromeReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cancelScheduledLoad = () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
      idleId = null;
      timeoutId = null;
    };

    const update = () => {
      cancelScheduledLoad();
      if (!media.matches) {
        setReady(false);
        return;
      }

      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => setReady(true), {
          timeout: 1_500,
        });
      } else {
        timeoutId = setTimeout(() => setReady(true), 0);
      }
    };

    update();
    media.addEventListener("change", update);
    return () => {
      cancelScheduledLoad();
      media.removeEventListener("change", update);
    };
  }, []);

  return ready;
}

function RightPanelPlaceholder() {
  return <aside aria-hidden="true" className="mr-2 hidden w-64 shrink-0 xl:block" />;
}

export function DeferredDesktopRightPanel({
  localePrefix = "",
  showLanguage = false,
}: {
  localePrefix?: string;
  showLanguage?: boolean;
}) {
  const ready = useDesktopChromeReady();
  if (!ready) return <RightPanelPlaceholder />;

  return (
    <Suspense fallback={<RightPanelPlaceholder />}>
      <DesktopRightPanel localePrefix={localePrefix} showLanguage={showLanguage} />
    </Suspense>
  );
}
