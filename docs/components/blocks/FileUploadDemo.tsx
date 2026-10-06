"use client";

import { useEffect, useState } from "react";
import { FileUpload, type FileUploadItem } from "@zeron/blocks/file-upload-01";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { useIcon } from "@zeron/ui/system/icon-context";

const fixture: FileUploadItem[] = [
  { id: "pitch", name: "investor-pitch-deck.pdf", size: 14_000_000, uploadedBytes: 14_000_000, status: "complete" },
  { id: "copy", name: "landing-copy-update.docx", size: 4_000_000, uploadedBytes: 2_700_000, status: "uploading" },
  { id: "design", name: "product-ui-concepts.fig", size: 14_000_000, uploadedBytes: 4_500_000, status: "uploading" },
];

/** Local simulation only. File contents never leave the browser. */
export function FileUploadDemo() {
  const [items, setItems] = useState(fixture);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(true);
  const [feedback, setFeedback] = useState("");
  const More = useIcon("ellipsis"); const Reset = useIcon("rotate-ccw");
  const Play = useIcon("play"); const Pause = useIcon("pause");
  const busy = items.some((item) => item.status === "uploading" || item.status === "queued");
  useEffect(() => {
    if (!running || !busy || !open) return;
    const timer = window.setInterval(() => setItems((current) => current.map((item) => {
      if (item.status !== "uploading" && item.status !== "queued") return item;
      const uploadedBytes = Math.min(item.size, item.uploadedBytes + Math.max(1, item.size / 25));
      return { ...item, uploadedBytes, status: uploadedBytes >= item.size ? "complete" : "uploading" };
    })), 250);
    return () => window.clearInterval(timer);
  }, [running, busy, open]);

  function reset() { setItems(fixture); setRunning(false); setOpen(true); setFeedback(""); }
  return <div className="flex h-full min-h-0 w-full items-start justify-center overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="my-auto w-full max-w-2xl">
      {open ? <FileUpload items={items}
        onFilesSelected={(files) => { setFeedback(""); setItems((current) => [...current, ...files.map((file): FileUploadItem => ({ id: crypto.randomUUID(), name: file.name, size: file.size, uploadedBytes: 0, status: "queued" }))]); setRunning(true); }}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        onRemoveAll={() => { setItems([]); setRunning(false); }}
        onRetry={(id) => { setItems((current) => current.map((item) => item.id === id ? { ...item, uploadedBytes: 0, status: "queued", error: undefined } : item)); setRunning(true); }}
        onDone={() => { setOpen(false); setFeedback("Demo uploads complete."); }}
        footerActions={<DropdownMenu><DropdownTrigger render={<Button type="button" variant="ghost" iconOnly aria-label="Upload options"><More /></Button>} />
          <DropdownContent side="top" align="start">
            <MenuItem index={0} icon={running ? Pause : Play} disabled={!busy} onClick={() => setRunning((current) => !current)} label={running ? "Pause demo uploads" : "Run demo uploads"} />
            <MenuItem index={1} icon={Reset} onClick={reset} label="Reset demo" />
          </DropdownContent>
        </DropdownMenu>}
      /> : <div className="flex flex-col items-center gap-3 py-12"><p role="status" className="text-body text-fg-muted">{feedback || "Uploader closed."}</p><Button type="button" onClick={reset}>Reopen uploader</Button></div>}
    </div>
  </div>;
}
