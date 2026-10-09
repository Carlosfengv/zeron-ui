"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ContextWindow, createContextWindowDemoData, contextWindowZhLabels } from "@zeron/blocks/context-window-01";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { useIcon } from "@zeron/ui/system/icon-context";

export function ContextWindowDemo() {
  const locale = useLocale(); const zh = locale.startsWith("zh");
  const [data, setData] = useState(createContextWindowDemoData);
  const [live, setLive] = useState(true);
  const [closed, setClosed] = useState(false);
  const [settings, setSettings] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const More = useIcon("ellipsis"); const Pause = useIcon("pause"); const Play = useIcon("play"); const Reset = useIcon("rotate-ccw"); const Export = useIcon("file-text");
  useEffect(() => {
    if (!live || closed || compacting) return;
    const interval = setInterval(() => setData((current) => {
      const last = current.history.at(-1);
      if (!last) return current;
      const turn = (current.session?.turn ?? 0) + 1;
      return { ...current, history: last.pinned ? [...current.history, { id: `live-${turn}`, title: zh ? "当前对话" : "Current conversation", source: `TURN ${turn}`, tokens: 320 }] : current.history.map((item) => item.id === last.id ? { ...item, tokens: item.tokens + 320 } : item),
        session: current.session ? { ...current.session, turn: current.session.turn + 1 } : undefined,
        cache: current.cache ? { ...current.cache, saved: (current.cache.saved ?? 0) + 0.13, newTokens: (current.cache.newTokens ?? 0) + 320 } : undefined };
    }), 2400);
    return () => clearInterval(interval);
  }, [live, closed, compacting, zh]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null; setData(createContextWindowDemoData()); setCompacting(false); setNotice(zh ? "演示已重置。" : "Demo reset to turn 48.");
  }
  function compact() {
    if (timer.current) return;
    setCompacting(true); setNotice("");
    timer.current = setTimeout(() => {
      setData((current) => {
        const pinned = current.history.filter((item) => item.pinned);
        const unpinned = current.history.filter((item) => !item.pinned);
        let summaryId = "compacted-summary";
        const ids = new Set(current.history.map((item) => item.id));
        let suffix = 1;
        while (ids.has(summaryId)) summaryId = `compacted-summary-${suffix++}`;
        return { ...current, history: [...pinned, ...(unpinned.length ? [{ id: summaryId, title: zh ? "迁移对话摘要" : "Migration conversation summary", source: "SUMMARY", tokens: Math.round(unpinned.reduce((sum, item) => sum + item.tokens, 0) * 0.25) }] : [])] };
      });
      timer.current = null; setCompacting(false); setNotice(zh ? "演示历史已压缩，已固定内容完整保留。" : "Demo history compacted; pinned items preserved.");
    }, 850);
  }
  function exportSnapshot() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ demonstration: true, data }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "context-window-demo.json";
    document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="m-auto w-full max-w-2xl shrink-0 space-y-4">
      {closed ? <div className="flex min-h-80 items-center justify-center"><Button onClick={() => setClosed(false)}>{zh ? "打开上下文窗口" : "Open context window"}</Button></div> : <ContextWindow data={data} locale={locale} labels={zh ? contextWindowZhLabels : undefined}
        live={live} onCompact={compact} compacting={compacting} notice={notice}
        onSettings={() => setSettings(true)} onClose={() => setClosed(true)}
        footerActions={<DropdownMenu><DropdownTrigger render={<Button type="button" variant="ghost" size="sm" iconOnly aria-label={zh ? "演示选项" : "Demo options"}><More aria-hidden="true" /></Button>} />
          <DropdownContent side="top" align="start"><MenuItem index={0} icon={live ? Pause : Play} label={zh ? live ? "暂停演示" : "继续演示" : live ? "Pause demo" : "Resume demo"} onSelect={() => setLive((current) => !current)} />
            <MenuItem index={1} icon={Reset} label={zh ? "重置演示" : "Reset demo"} onSelect={reset} />
            <MenuItem index={2} icon={Export} label={zh ? "导出演示快照" : "Export demo snapshot"} onSelect={exportSnapshot} />
          </DropdownContent></DropdownMenu>}
      />}
      <p className="px-2 text-center text-label text-fg-subtle">{zh ? "本地模拟数据 · 可切换内容和压缩历史。" : "Local simulation · inspect contents and compact conversation history."}</p>
    </div>
    <Dialog open={settings} onOpenChange={setSettings}><DialogContent><DialogHeader><DialogTitle>{zh ? "演示设置" : "Demo settings"}</DialogTitle><DialogDescription>{zh ? "调整本地演示的窗口容量，不会连接模型服务。" : "Adjust the local context capacity. No model service is connected."}</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <Select value={String(data.capacity)} onValueChange={(value) => setData((current) => ({ ...current, capacity: Number(value) }))}>
          <SelectTrigger aria-label={zh ? "窗口容量" : "Window capacity"} />
          <SelectContent>
            <SelectItem value="100000">100k tokens</SelectItem>
            <SelectItem value="200000">200k tokens</SelectItem>
            <SelectItem value="400000">400k tokens</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="secondary" onClick={() => setSettings(false)}>{zh ? "完成" : "Done"}</Button>
      </div>
    </DialogContent></Dialog>
  </div>;
}
