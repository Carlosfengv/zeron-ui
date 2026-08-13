/* biome-ignore-all lint/a11y/noLabelWithoutControl: Radio controls are rendered inside labels but wrapped by a local styled input helper. */

"use client";

import type { TableMeta } from "@tanstack/react-table";
import * as React from "react";
import { useAsRef } from "#hooks/use-as-ref";
import type { PasteDialogState } from "#system/data-grid-types";
import { cn } from "#system/utils";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";

interface DataGridPasteDialogProps<TData> {
  tableMeta: TableMeta<TData>;
  pasteDialog: PasteDialogState;
}

export function DataGridPasteDialog<TData>({
  tableMeta,
  pasteDialog,
}: DataGridPasteDialogProps<TData>) {
  const onPasteDialogOpenChange = tableMeta?.onPasteDialogOpenChange;
  const onCellsPaste = tableMeta?.onCellsPaste;

  if (!pasteDialog.open) return null;

  return (
    <PasteDialog
      pasteDialog={pasteDialog}
      onPasteDialogOpenChange={onPasteDialogOpenChange}
      onCellsPaste={onCellsPaste}
    />
  );
}

interface PasteDialogProps
  extends Pick<TableMeta<unknown>, "onPasteDialogOpenChange" | "onCellsPaste">,
    Required<Pick<TableMeta<unknown>, "pasteDialog">> {}

const PasteDialog = React.memo(PasteDialogImpl, (prev, next) => {
  if (prev.pasteDialog.open !== next.pasteDialog.open) return false;
  if (!next.pasteDialog.open) return true;
  if (prev.pasteDialog.rowsNeeded !== next.pasteDialog.rowsNeeded) return false;

  return true;
});

function PasteDialogImpl({
  pasteDialog,
  onPasteDialogOpenChange,
  onCellsPaste,
}: PasteDialogProps) {
  const propsRef = useAsRef({
    onPasteDialogOpenChange,
    onCellsPaste,
  });

  const expandRadioRef = React.useRef<HTMLInputElement | null>(null);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      propsRef.current.onPasteDialogOpenChange?.(open);
    },
    [propsRef],
  );

  const onCancel = React.useCallback(() => {
    propsRef.current.onPasteDialogOpenChange?.(false);
  }, [propsRef]);

  const onContinue = React.useCallback(() => {
    propsRef.current.onCellsPaste?.(expandRadioRef.current?.checked ?? false);
  }, [propsRef]);

  return (
    <Dialog open={pasteDialog.open} onOpenChange={onOpenChange}>
      <DialogContent data-grid-popover="">
        <DialogHeader>
          <DialogTitle>Do you want to add more rows?</DialogTitle>
          <DialogDescription>
            We need <strong>{pasteDialog.rowsNeeded}</strong> additional row
            {pasteDialog.rowsNeeded !== 1 ? "s" : ""} to paste everything from
            your clipboard.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <label className="flex cursor-pointer items-start gap-3">
            <RadioItem
              ref={expandRadioRef}
              name="expand-option"
              value="expand"
              defaultChecked
            />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-body leading-none">
                Create new rows
              </span>
              <span className="text-fg-muted text-body">
                Add {pasteDialog.rowsNeeded} new row
                {pasteDialog.rowsNeeded !== 1 ? "s" : ""} to the table and paste
                all data
              </span>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <RadioItem name="expand-option" value="no-expand" />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-body leading-none">
                Keep current rows
              </span>
              <span className="text-fg-muted text-body">
                Paste only what fits in the existing rows
              </span>
            </div>
          </label>
        </div>
        <DialogFooter>
          <Button variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onContinue}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RadioItem({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      className={cn(
        "relative size-4 shrink-0 appearance-none rounded-full border border-input bg-surface-base shadow-control outline-none transition-[color,box-shadow]",
        "text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "checked:before:absolute checked:before:start-1/2 checked:before:top-1/2 checked:before:size-2 checked:before:-translate-x-1/2 checked:before:-translate-y-1/2 checked:before:rounded-full checked:before:bg-inverse-background checked:before:content-['']",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
