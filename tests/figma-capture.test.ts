/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyElementToFigma,
  getFigmaCaptureBusy,
  resolveFigmaCaptureTarget,
  subscribeFigmaCaptureBusy,
} from "@docs/lib/figma-capture";

function installNativeClipboard() {
  const clipboard = {
    read: vi.fn(async () => []),
    readText: vi.fn(async () => "cell value"),
    write: vi.fn(async () => {}),
    writeText: vi.fn(async () => {}),
  } as unknown as Clipboard;

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });

  return clipboard;
}

const htmlClipboardItems = [
  { types: ["text/html"] } as unknown as ClipboardItem,
];

describe("Figma capture runtime", () => {
  beforeEach(() => {
    installNativeClipboard();
    document.body.replaceChildren();
    window.figma = undefined;
  });

  it("captures the exact element and restores temporary DOM state", async () => {
    const nativeClipboard = navigator.clipboard;
    const target = document.createElement("button");
    target.setAttribute("data-figma-capture-target-id", "existing-value");
    document.body.appendChild(target);
    window.figma = {
      captureForDesign: vi.fn(async ({ selector }) => {
        expect(document.querySelector(selector)).toBe(target);
        expect(target.getAttribute("data-figma-capture-target-id")).not.toBe(
          "existing-value",
        );
        expect(await navigator.clipboard.readText()).toBe("cell value");
        await navigator.clipboard.write(htmlClipboardItems);
        return { success: true };
      }),
    };

    await copyElementToFigma(target);

    expect(navigator.clipboard).toBe(nativeClipboard);
    expect(await navigator.clipboard.readText()).toBe("cell value");
    expect(target.getAttribute("data-figma-capture-target-id")).toBe(
      "existing-value",
    );
  });

  it("ignores plain clipboard writes and prevents overlapping captures", async () => {
    let captureSettled = false;
    window.figma = {
      captureForDesign: vi.fn(async () => {
        await navigator.clipboard.writeText("unrelated copy");
        return { success: true };
      }),
    };
    const busyStates: boolean[] = [];
    const unsubscribe = subscribeFigmaCaptureBusy(() => {
      busyStates.push(getFigmaCaptureBusy());
    });
    const firstTarget = document.createElement("div");
    const secondTarget = document.createElement("div");
    document.body.append(firstTarget, secondTarget);

    const firstCapture = copyElementToFigma(firstTarget);
    void firstCapture.finally(() => {
      captureSettled = true;
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getFigmaCaptureBusy()).toBe(true);
    expect(captureSettled).toBe(false);
    expect(() => copyElementToFigma(secondTarget)).toThrow(
      "A Figma capture is already in progress",
    );

    await navigator.clipboard.write(htmlClipboardItems);
    await firstCapture;
    unsubscribe();

    expect(getFigmaCaptureBusy()).toBe(false);
    expect(busyStates).toEqual([true, false]);
  });

  it("prefers explicit and marked targets before the single-root fallback", () => {
    const preview = document.createElement("div");
    const root = document.createElement("section");
    const marked = document.createElement("ol");
    const portaled = document.createElement("div");
    marked.setAttribute("data-figma-capture-target", "");
    root.appendChild(marked);
    preview.appendChild(root);
    document.body.append(preview, portaled);

    expect(resolveFigmaCaptureTarget(preview)).toBe(marked);
    expect(resolveFigmaCaptureTarget(preview, portaled)).toBe(portaled);

    marked.removeAttribute("data-figma-capture-target");
    expect(resolveFigmaCaptureTarget(preview)).toBe(root);
  });

  it("rejects ambiguous preview roots without an explicit target", () => {
    const preview = document.createElement("div");
    preview.append(document.createElement("button"), document.createElement("button"));
    document.body.appendChild(preview);

    expect(() => resolveFigmaCaptureTarget(preview)).toThrow(
      "The preview has multiple roots",
    );
  });
});
