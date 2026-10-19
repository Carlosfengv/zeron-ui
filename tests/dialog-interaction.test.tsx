// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "../packages/ui/src/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "../packages/ui/src/components/dialog";

const capturedRootProps = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@base-ui/react/dialog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@base-ui/react/dialog")>();
  const OriginalRoot = actual.Dialog.Root;

  return {
    ...actual,
    Dialog: {
      ...actual.Dialog,
      Root: (props: Parameters<typeof OriginalRoot>[0]) => {
        capturedRootProps.current = props;
        return <OriginalRoot {...props} />;
      },
    },
  };
});

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
  it("forwards pointer-dismissal control and keeps Escape dismissal available", async () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog defaultOpen disablePointerDismissal onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(
      (capturedRootProps.current as { disablePointerDismissal?: boolean })
        .disablePointerDismissal
    ).toBe(true);
    expect(screen.getByRole("dialog", { name: "Dialog title" })).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(
        false,
        expect.objectContaining({ reason: "escape-key" })
      );
    });
  });

  it("forwards change details such as outside-press to the public callback", () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const rootProps = capturedRootProps.current as {
      onOpenChange?: (open: boolean, details: { reason: string }) => void;
    };
    act(() => rootProps.onOpenChange?.(false, { reason: "outside-press" }));

    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: "outside-press" });
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

  it("localizes and disables the built-in close button", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent closeButtonLabel="关闭对话框" closeButtonDisabled>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "关闭对话框" });
    expect(closeButton.hasAttribute("disabled")).toBe(true);
  });

  it("keeps the built-in close button enabled and labeled by default", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton.hasAttribute("disabled")).toBe(false);
  });
});
