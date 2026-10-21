// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Button } from "../packages/ui/src/components/button";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger,
  type DialogChangeEventDetails,
} from "../packages/ui/src/components/dialog";

Object.defineProperty(Element.prototype, "getAnimations", {
  configurable: true,
  value: vi.fn(() => []),
  writable: true,
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

interface NestedDialogsProps {
  nestedBackdrop?: boolean;
  disablePointerDismissal?: boolean;
  onParentChange?: (open: boolean, details: DialogChangeEventDetails) => void;
  onChildChange?: (open: boolean, details: DialogChangeEventDetails) => void;
}

function NestedDialogs({
  nestedBackdrop, disablePointerDismissal, onParentChange, onChildChange,
}: NestedDialogsProps) {
  return (
    <Dialog defaultOpen onOpenChange={onParentChange}>
      <DialogContent backdropClassName="parent-backdrop">
        <DialogTitle>Parent dialog</DialogTitle>
        <Dialog disablePointerDismissal={disablePointerDismissal} onOpenChange={onChildChange}>
          <DialogTrigger render={<Button>Open child</Button>} />
          <DialogContent
            nestedBackdrop={nestedBackdrop}
            backdropClassName="child-backdrop"
            backdropStyle={{ backgroundColor: "rgb(10, 20, 30)" }}
            closeButtonLabel="Close child"
          >
            <DialogTitle>Child dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

async function openChild() {
  const trigger = screen.getByRole("button", { name: "Open child" });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole("dialog", { name: "Child dialog" });
  return trigger;
}

describe("Dialog nested backdrop", () => {
  it.each([undefined, false])("keeps the single backdrop default (%s)", async (nestedBackdrop) => {
    render(<NestedDialogs nestedBackdrop={nestedBackdrop} />);
    await openChild();
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(1);
    expect(document.querySelector(".child-backdrop")).toBeNull();
  });

  it("renders and customizes the child backdrop only while its dialog is open", async () => {
    render(<NestedDialogs nestedBackdrop />);
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(1);
    await openChild();
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(2);
    const backdrop = document.querySelector<HTMLElement>(".child-backdrop");
    expect(backdrop?.style.backgroundColor).toBe("rgb(10, 20, 30)");
    expect(screen.getByRole("dialog", { name: "Child dialog" }).hasAttribute("nestedbackdrop")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Close child" }));
    await waitFor(() => expect(document.querySelector(".child-backdrop")).toBeNull());
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Parent dialog" })).toBeTruthy();
  });

  it("preserves pointer-dismissal policy, closes only the child on Escape, and restores focus", async () => {
    const parentChange = vi.fn();
    const childChange = vi.fn();
    render(<NestedDialogs nestedBackdrop disablePointerDismissal onParentChange={parentChange} onChildChange={childChange} />);
    const trigger = await openChild();
    childChange.mockClear();
    const backdrop = document.querySelector(".child-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    fireEvent.mouseUp(backdrop!);
    fireEvent.click(backdrop!);
    expect(childChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Child dialog" })).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
    expect(childChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "escape-key" }));
    expect(parentChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Parent dialog" })).toBeTruthy();
  });

  it("preserves consumer cancellation and both backdrops", async () => {
    const parentChange = vi.fn();
    const childChange = vi.fn((open: boolean, details: DialogChangeEventDetails) => {
      if (!open) details.cancel();
    });
    render(<NestedDialogs nestedBackdrop onParentChange={parentChange} onChildChange={childChange} />);
    await openChild();
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(childChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "escape-key", isCanceled: true }));
    expect(document.querySelectorAll('[data-slot="dialog-backdrop"]')).toHaveLength(2);
    expect(screen.getByRole("dialog", { name: "Child dialog" })).toBeTruthy();
    expect(parentChange).not.toHaveBeenCalled();
  });

  it("dismisses only the child on its backdrop when pointer dismissal is enabled", async () => {
    const parentChange = vi.fn();
    const childChange = vi.fn();
    render(<NestedDialogs nestedBackdrop onParentChange={parentChange} onChildChange={childChange} />);
    const trigger = await openChild();
    const backdrop = document.querySelector(".child-backdrop");
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    fireEvent.mouseUp(backdrop!);
    fireEvent.click(backdrop!);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Child dialog" })).toBeNull());
    expect(childChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: "outside-press" }));
    expect(parentChange).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
