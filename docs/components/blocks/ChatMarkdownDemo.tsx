"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChatMarkdownResponse, createChatMarkdownDemoText } from "@zeron/blocks/chat-markdown-01";
import { Button } from "@zeron/ui/button";
import { ChatMessageAuthor, ChatScrollToLatest, CHAT_SCROLL_FOLLOW_THRESHOLD } from "@zeron/ui/chat-message";
import { useIcon } from "@zeron/ui/system/icon-context";

const chineseCodeMessages = {
  copy: "复制代码", copied: "已复制", copyFailed: "复制失败", wrap: "自动换行", scroll: "横向滚动",
  highlightLoading: "正在高亮…", highlightFailed: "语法高亮不可用", highlightRetry: "重试",
};

export function ChatMarkdownDemo() {
  const locale = useLocale();
  return <ChatMarkdownDemoContent key={locale} locale={locale} />;
}

function ChatMarkdownDemoContent({ locale }: { locale: string }) {
  const zh = locale.startsWith("zh");
  const source = createChatMarkdownDemoText(locale);
  const [length, setLength] = useState(source.length);
  const [playing, setPlaying] = useState(false);
  const streaming = playing && length < source.length;
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const follow = useRef(false);
  const [away, setAway] = useState(false);
  const Replay = useIcon("rotate-ccw");

  useEffect(() => {
    if (!streaming) return;
    const timer = setInterval(() => setLength((current) => Math.min(current + 18, source.length)), 24);
    return () => clearInterval(timer);
  }, [streaming, source.length]);

  useLayoutEffect(() => {
    const element = viewport.current;
    const body = content.current;
    if (!element || !body) return;
    const syncLayout = () => {
      if (follow.current) element.scrollTop = element.scrollHeight;
      const atLatest = element.scrollHeight - element.scrollTop - element.clientHeight < CHAT_SCROLL_FOLLOW_THRESHOLD;
      follow.current = atLatest;
      setAway(!atLatest);
    };
    syncLayout();
    const observer = new ResizeObserver(syncLayout);
    observer.observe(element);
    observer.observe(body);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-surface-floating text-fg-default">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-hairline border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-label">
          <span className="font-medium">Markdown</span>
          <span className="text-fg-subtle">/</span>
          <span className="text-fg-muted">{zh ? "AI 回复" : "AI response"}</span>
        </div>
        <div className="flex items-center gap-1">
          {streaming && <Button type="button" variant="ghost" size="sm" onClick={() => setPlaying(false)}>{zh ? "停止" : "Stop"}</Button>}
          {!streaming && length < source.length && <Button type="button" variant="ghost" size="sm" onClick={() => setLength(source.length)}>{zh ? "显示全文" : "Show all"}</Button>}
          <Button type="button" variant="ghost" size="sm" leadingIcon={Replay} onClick={() => {
            follow.current = true;
            setAway(false);
            setLength(0);
            setPlaying(true);
            viewport.current?.scrollTo({ top: 0 });
          }}>{zh ? "重播生成" : "Replay"}</Button>
        </div>
      </header>
      <div ref={viewport} role="region" aria-label={zh ? "Markdown 回复" : "Markdown response"} tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring sm:px-8 sm:py-10"
        style={{ overflowAnchor: "none" }}
        onScroll={(event) => {
          const el = event.currentTarget;
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < CHAT_SCROLL_FOLLOW_THRESHOLD;
          setAway(!follow.current);
        }}>
        <div ref={content} className="min-w-0">
          <ChatMarkdownResponse text={source.slice(0, length)} streaming={streaming}
            streamingLabel={zh ? "正在生成回复" : "Generating response"}
            codeMessages={zh ? chineseCodeMessages : undefined}
            footnoteLabel={zh ? "脚注" : "Footnotes"}
            footnoteBackLabel={zh ? "返回正文" : undefined}
            copyLabels={zh ? { copy: "复制回复", copied: "已复制", copyFailed: "复制失败" } : undefined}
            author={<ChatMessageAuthor model="Zeron AI" provider={zh ? "示例回复" : "Example response"} />} />
        </div>
      </div>
      {away && <ChatScrollToLatest locale={locale} onClick={() => {
        follow.current = true;
        setAway(false);
        viewport.current?.scrollTo({ top: viewport.current.scrollHeight });
        viewport.current?.focus({ preventScroll: true });
      }} />}
    </div>
  );
}
