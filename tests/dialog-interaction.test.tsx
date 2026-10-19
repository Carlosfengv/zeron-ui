// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "../packages/ui/src/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  type DialogChangeEventDetails,
} from "../packages/ui/src/components/dialog";

Object.defineProperty(Element.prototype, "getAnimations", {
  configurable: true,
  value: vi.fn(() => []),
  writable: true,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Dialog dismissal and close controls", () => {
  it.each([
    ["center", "left-1/2"],
    ["left", "left-0"],
    ["right", "right-0"],
    ["top", "top-0"],
    ["bottom", "bottom-0"],
  ] as const)("positions the %s dialog", (placement, expectedClass) => {
    render(
      <Dialog defaultOpen>
        <DialogContent placement={placement}>
          <DialogTitle>Placed dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const panel = screen.getByRole("dialog", { name: "Placed dialog" });
    expect(panel.getAttribute("data-placement")).toBe(placement);
    expect(panel.classList.contains(expectedClass)).toBe(true);
    expect(panel.classList.contains("left-1/2")).toBe(placement === "center");
    expect(panel.classList.contains("top-1/2")).toBe(placement === "center");
    expect(panel.classList.contains("overflow-y-auto")).toBe(placement !== "center");
  });

  it("supports explicit placement and backdrop customization", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent
          placement="right"
          backdropClassName="backdrop-blur-none custom-dialog-backdrop"
          backdropStyle={{ backgroundColor: "rgb(1, 2, 3)" }}
        >
          <DialogTitle>Side panel</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const panel = screen.getByRole("dialog", { name: "Side panel" });
    expect(panel.getAttribute("data-placement")).toBe("right");
    expect(panel.classList.contains("right-0")).toBe(true);

    const backdrop = document.querySelector<HTMLElement>(
      '[data-slot="dialog-backdrop"]'
    );
    expect(backdrop).not.toBeNull();
    expect(backdrop?.classList.contains("backdrop-blur-none")).toBe(true);
    expect(backdrop?.classList.contains("custom-dialog-backdrop")).toBe(true);
    expect(backdrop?.style.backgroundColor).toBe("rgb(1, 2, 3)");
  });

  it("forwards pointer-dismissal control and keeps Escape dismissal available", async () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog defaultOpen disablePointerDismissal onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeTruthy();
    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);
    fireEvent.click(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: "escape-key" })
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("dismisses on outside input by default and forwards the real change details", async () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: "outside-press", event: expect.any(MouseEvent) })
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("allows consumers to cancel an uncontrolled dismissal through the event details", () => {
    const onOpenChange = vi.fn((_open: boolean, details: DialogChangeEventDetails) => {
      details.cancel();
    });

    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key", isCanceled: true })
    );
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeTruthy();
  });

  it("allows the built-in close button to be hidden and replaced with DialogClose", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogClose render={<Button variant="ghost">Close dialog</Button>} />
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Dialog title" })).toBeNull();
    });
  });

  it("localizes and disables the built-in close button without disabling Escape", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent closeButtonLabel="关闭对话框" closeButtonDisabled>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "关闭对话框" });
    expect(closeButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(closeButton);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("keeps the built-in close button working by default and reports close-press", async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: "close-press" })
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("keeps an existing one-argument callback working in controlled usage", async () => {
    const onOpenChange = vi.fn((open: boolean) => open);
    const view = render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent><DialogTitle>Dialog title</DialogTitle></DialogContent>
      </Dialog>
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange.mock.calls[0][0]).toBe(false);
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeTruthy();

    view.rerender(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent><DialogTitle>Dialog title</DialogTitle></DialogContent>
      </Dialog>
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
