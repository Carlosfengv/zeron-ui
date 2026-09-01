const FIGMA_CAPTURE_SCRIPT_ID = "zeron-figma-capture-script";
const FIGMA_CAPTURE_SCRIPT_URL = "/figma-capture.js";
const FIGMA_TOOLBAR_HOST_ID = "__figma_capture_toolbar_host__";
const FIGMA_TOOLBAR_HIDE_STYLE_ID = "__h2f_hide_official_toolbar__";
const CAPTURE_ACK_TIMEOUT_MS = 1_400;
const CLIPBOARD_WRITE_TIMEOUT_MS = 15_000;
const SCRIPT_LOAD_TIMEOUT_MS = 15_000;

interface FigmaCaptureResult {
  success?: boolean;
  error?: unknown;
}

interface FigmaCaptureApi {
  useHtmlClipboardEncoding?: boolean;
  captureForDesign?: (options: {
    selector: string;
    verbose?: boolean;
  }) => Promise<FigmaCaptureResult | void> | FigmaCaptureResult | void;
}

type CaptureForDesign = NonNullable<FigmaCaptureApi["captureForDesign"]>;

declare global {
  interface Window {
    figma?: FigmaCaptureApi;
  }
}

let captureScriptPromise: Promise<CaptureForDesign> | null = null;
let captureInFlight: Promise<void> | null = null;
let captureBusy = false;
const captureBusyListeners = new Set<() => void>();

export function subscribeFigmaCaptureBusy(listener: () => void) {
  captureBusyListeners.add(listener);
  return () => captureBusyListeners.delete(listener);
}

export function getFigmaCaptureBusy() {
  return captureBusy;
}

function setFigmaCaptureBusy(busy: boolean) {
  if (captureBusy === busy) return;
  captureBusy = busy;
  captureBusyListeners.forEach((listener) => listener());
}

function resolveCaptureApi(): CaptureForDesign | undefined {
  return window.figma?.captureForDesign;
}

function hideOfficialCaptureToolbar() {
  if (document.getElementById(FIGMA_TOOLBAR_HIDE_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = FIGMA_TOOLBAR_HIDE_STYLE_ID;
  style.textContent = `
    #${FIGMA_TOOLBAR_HOST_ID} {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function installClipboardObserver(onWrite: () => void) {
  const clipboard = navigator.clipboard;
  if (!clipboard?.write) return false;

  const originalDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard",
  );
  const nativeWrite = clipboard.write.bind(clipboard);
  const observedClipboard = new Proxy(clipboard, {
    get(target, property) {
      if (property === "write") {
        return async (items: ClipboardItems) => {
          await nativeWrite(items);
          if (
            Array.from(items).some((item) =>
              Array.from(item.types).includes("text/html"),
            )
          ) {
            onWrite();
          }
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  try {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: observedClipboard,
    });
    let restored = false;
    return () => {
      if (restored || navigator.clipboard !== observedClipboard) return;
      restored = true;
      if (originalDescriptor) {
        Object.defineProperty(navigator, "clipboard", originalDescriptor);
      } else {
        Reflect.deleteProperty(navigator, "clipboard");
      }
    };
  } catch {
    return null;
  }
}

function observeClipboardWrite() {
  let settled = false;
  let timeoutId: number | undefined;
  let resolvePromise: (written: boolean) => void = () => {};
  let restoreClipboard = () => {};
  const finish = (written: boolean) => {
    if (settled) return;
    settled = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    restoreClipboard();
    resolvePromise(written);
  };
  const restore = installClipboardObserver(() => finish(true));
  if (!restore) return null;
  restoreClipboard = restore;

  const promise = new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
    timeoutId = window.setTimeout(
      () => finish(false),
      CLIPBOARD_WRITE_TIMEOUT_MS,
    );
  });

  return { promise, cancel: () => finish(false) };
}

function loadCaptureScript() {
  hideOfficialCaptureToolbar();
  const availableCapture = resolveCaptureApi();
  if (availableCapture) return Promise.resolve(availableCapture);
  if (captureScriptPromise) return captureScriptPromise;

  const pending = new Promise<CaptureForDesign>((resolve, reject) => {
    const existingScript = document.getElementById(
      FIGMA_CAPTURE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    let timeoutId: number | undefined;
    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      script.removeEventListener("load", finish);
      script.removeEventListener("error", fail);
    };
    const finish = () => {
      cleanup();
      const capture = resolveCaptureApi();
      if (capture) {
        resolve(capture);
        return;
      }
      reject(new Error("Figma capture API is unavailable"));
    };
    const fail = () => {
      cleanup();
      reject(new Error("Unable to load Figma capture"));
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    timeoutId = window.setTimeout(fail, SCRIPT_LOAD_TIMEOUT_MS);

    if (!existingScript) {
      script.id = FIGMA_CAPTURE_SCRIPT_ID;
      script.src = FIGMA_CAPTURE_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    captureScriptPromise = null;
    document.getElementById(FIGMA_CAPTURE_SCRIPT_ID)?.remove();
    throw error;
  });
  captureScriptPromise = pending;

  return pending;
}

/** Start loading Figma's official HTML capture bridge on user intent. */
export function preloadFigmaCapture() {
  return loadCaptureScript().then(() => undefined);
}

/**
 * Capture one rendered preview into the clipboard as editable Figma layers.
 * The official capture promise remains pending while its success toolbar is
 * visible, so a short acknowledgement window is used after errors have had a
 * chance to surface.
 */
async function performFigmaCopy(selector: string) {
  const capture = await loadCaptureScript();
  if (!capture) throw new Error("Figma capture API is unavailable");

  if (window.figma) window.figma.useHtmlClipboardEncoding = true;
  const clipboardObserver = observeClipboardWrite();

  try {
    const capturePromise = Promise.resolve(
      capture({ selector, verbose: false }),
    );
    const acknowledgement = await Promise.race([
      capturePromise.then(
        (result) => ({ state: "resolved" as const, result }),
        (error) => ({ state: "rejected" as const, error }),
      ),
      new Promise<{ state: "pending" }>((resolve) => {
        window.setTimeout(
          () => resolve({ state: "pending" }),
          CAPTURE_ACK_TIMEOUT_MS,
        );
      }),
    ]);

    if (acknowledgement.state === "rejected") throw acknowledgement.error;
    if (
      acknowledgement.state === "resolved" &&
      acknowledgement.result?.success === false
    ) {
      throw new Error(
        String(acknowledgement.result.error || "Figma capture failed"),
      );
    }

    if (clipboardObserver) {
      const clipboardWritten = await clipboardObserver.promise;
      if (!clipboardWritten) throw new Error("Figma clipboard write timed out");
    } else if (acknowledgement.state === "pending") {
      void capturePromise.catch((error) => {
        console.warn("Figma capture failed after acknowledgement", error);
      });
    }
  } finally {
    clipboardObserver?.cancel();
  }
}

export function copyElementToFigma(selector: string) {
  if (captureInFlight) {
    throw new Error("A Figma capture is already in progress");
  }

  setFigmaCaptureBusy(true);
  const operation = performFigmaCopy(selector);
  captureInFlight = operation.finally(() => {
    captureInFlight = null;
    setFigmaCaptureBusy(false);
  });
  return captureInFlight;
}
