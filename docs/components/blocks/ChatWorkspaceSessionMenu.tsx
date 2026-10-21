"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@zeron/ui/dropdown";
import { Field, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { MenuItem } from "@zeron/ui/menu-item";
import { toast } from "@zeron/ui/toast";
import { useIcon } from "@zeron/ui/system/icon-context";

export function ChatWorkspaceSessionMenu({ title, onTitleChange, messages, locale }: {
  title: string; onTitleChange: (title: string) => void;
  messages: readonly { role: "user" | "assistant"; text: string }[]; locale: string;
}) {
  const zh = locale === "zh-CN";
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [dialog, setDialog] = useState<"rename" | "share">("rename");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState(title);
  const inputId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const More = useIcon("ellipsis");
  const Pencil = useIcon("pencil");
  const Pin = useIcon("pin");
  const Unpin = useIcon("pin-off");
  const Share = useIcon("upload");
  const Copy = useIcon("copy");
  const Archive = useIcon("inbox");
  const shareUrl = "https://example.com/s/demo-session";
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(zh ? "已复制" : "Copied"); }
    catch { toast.error(zh ? "复制失败，请重试。" : "Could not copy. Try again."); }
  };
  const openDialog = (mode: "rename" | "share") => {
    if (mode === "rename") setName(title);
    setDialog(mode);
    setDialogOpen(true);
  };
  const closeDialog = () => {
    setDialogOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return <>
    {pinned && <Pin size={16} className="shrink-0 text-fg-muted" aria-label={zh ? "已置顶" : "Pinned"} />}
    <DropdownMenu>
      <DropdownTrigger render={<Button ref={trigger} iconOnly variant="ghost" aria-label={zh ? "会话操作" : "Session actions"}><More aria-hidden /></Button>} />
      <DropdownContent align="end" finalFocus={dialogOpen ? false : trigger}>
        <MenuItem index={0} icon={Pencil} label={zh ? "重命名" : "Rename"} onSelect={() => openDialog("rename")} />
        <MenuItem index={1} icon={pinned ? Unpin : Pin} label={zh ? pinned ? "取消置顶" : "置顶" : pinned ? "Unpin" : "Pin"} onSelect={() => {
          setPinned(!pinned);
          toast.success(zh ? pinned ? "已取消置顶（演示）" : "已置顶（演示）" : pinned ? "Unpinned (demo)" : "Pinned (demo)");
        }} />
        <DropdownSeparator />
        <MenuItem index={2} icon={Share} label={zh ? "分享" : "Share"} onSelect={() => openDialog("share")} />
        <MenuItem index={3} icon={Copy} label={zh ? "复制" : "Copy"} onSelect={() => void copy([title, ...messages.map((message) => `${message.role === "user" ? zh ? "我" : "You" : zh ? "助手" : "Assistant"}: ${message.text}`)].join("\n\n"))} />
        <DropdownSeparator />
        <MenuItem index={4} icon={Archive} label={zh ? archived ? "取消归档" : "归档" : archived ? "Unarchive" : "Archive"} onSelect={() => {
          setArchived(!archived);
          toast.success(zh ? archived ? "已取消归档（演示）" : "已归档（演示）" : archived ? "Unarchived (demo)" : "Archived (demo)");
        }} />
      </DropdownContent>
    </DropdownMenu>
    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (dialog !== "rename" || !name.trim()) return;
          onTitleChange(name.trim());
          closeDialog();
        }}>
          <DialogHeader>
            <DialogTitle>{dialog === "rename" ? zh ? "重命名会话" : "Rename session" : zh ? "分享会话" : "Share session"}</DialogTitle>
            <DialogDescription>{dialog === "rename" ? zh ? "仅更新当前演示的会话标题。" : "Change the title in this local demo." : zh ? "此为演示链接，不会发布或公开对话内容。" : "This is a demo link. The conversation is not published or made public."}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={inputId}>{dialog === "rename" ? zh ? "会话名称" : "Session name" : zh ? "演示链接" : "Demo link"}</FieldLabel>
            {dialog === "rename" ? <Input id={inputId} autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
              : <Input id={inputId} readOnly value={shareUrl} />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDialog}>{zh ? "取消" : "Cancel"}</Button>
            {dialog === "rename" ? <Button type="submit" variant="neutral" disabled={!name.trim()}>{zh ? "保存" : "Save"}</Button>
              : <Button type="button" variant="neutral" leadingIcon={Copy} onClick={() => void copy(shareUrl)}>{zh ? "复制链接" : "Copy link"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
