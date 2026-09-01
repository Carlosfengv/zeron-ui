/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyElementToFigma,
  getFigmaCaptureBusy,
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
    window.figma = undefined;
  });

  it("restores the native clipboard and preserves branded methods", async () => {
    const nativeClipboard = navigator.clipboard;
    window.figma = {
      captureForDesign: vi.fn(async () => {
        expect(await navigator.clipboard.readText()).toBe("cell value");
        await navigator.clipboard.write(htmlClipboardItems);
        return { success: true };
      }),
    };

    await copyElementToFigma("#preview");

    expect(navigator.clipboard).toBe(nativeClipboard);
    expect(await navigator.clipboard.readText()).toBe("cell value");
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

    const firstCapture = copyElementToFigma("#first");
    void firstCapture.finally(() => {
      captureSettled = true;
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(getFigmaCaptureBusy()).toBe(true);
    expect(captureSettled).toBe(false);
    expect(() => copyElementToFigma("#second")).toThrow(
      "A Figma capture is already in progress",
    );

    await navigator.clipboard.write(htmlClipboardItems);
    await firstCapture;
    unsubscribe();

    expect(getFigmaCaptureBusy()).toBe(false);
    expect(busyStates).toEqual([true, false]);
  });
});
