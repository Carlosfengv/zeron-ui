"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ContextMap, contextMapZhLabels, type ContextAgent, type ContextBlock, type ContextMapView } from "@zeron/ui/context-map";
import { useIcon } from "@zeron/icons/context";
import { Button } from "@zeron/ui/button";
import { FileType } from "@zeron/ui/file-type";
import { PreviewToolbarPortal } from "@docs/components/content/PreviewToolbar";

function fileBlock(id: string, fileName: string, tokens: number, detail?: string): ContextBlock {
  return {
    id, label: fileName, kind: "file", tokens, detail,
    icon: <FileType fileName={fileName} size="mini" aria-hidden="true" />,
  };
}

export function ContextMapExample({ chinese, compare = false }: { chinese: boolean; compare?: boolean }) {
  const t = useTranslations("context-map");
  const [agent, setAgent] = useState("checkout");
  const [view, setView] = useState<ContextMapView>("after");
  const [phase, setPhase] = useState<"idle" | "compacting" | "done">(compare ? "done" : "idle");
  const [visibleCount, setVisibleCount] = useState<number>();
  const [playing, setPlaying] = useState(false);
  const Claude = useIcon("doc-thinking-steps");
  const Search = useIcon("search");
  const Chat = useIcon("doc-chat-message");
  const Replay = useIcon("rotate-ccw");
  const agents: ContextAgent[] = [
    { id: "checkout", label: t("checkout"), limit: 200000, model: "Claude Opus", modelIcon: <Claude className="text-fg-warning" /> },
    { id: "scout", label: t("scout"), limit: 128000, model: "Gemini", modelIcon: <Search className="text-brand" /> },
    { id: "support", label: t("support"), limit: 160000, model: "GPT", modelIcon: <Chat className="text-fg-success" /> },
  ];
  const shared: ContextBlock[] = [
    { id: "system", label: t("system"), kind: "system", tokens: 6200, detail: t("systemDetail") },
    { id: "tools", label: t("tools"), kind: "tools", tokens: 14800, items: [
      { label: "read_file" }, { label: "search_code" }, { label: "run_tests" },
    ] },
    { id: "memory", label: t("memory"), kind: "memory", tokens: 9400, detail: t("memoryDetail") },
  ];
  const files: ContextBlock[] = [
    fileBlock("spec", "checkout.spec.ts", 8200),
    fileBlock("payment", "payment.ts", 17600, t("paymentDetail")),
  ];
  const laterFiles: ContextBlock[] = [
    fileBlock("stripe", "stripe.mock.ts", 11800),
    fileBlock("receipt", "receipt.tsx", 23800),
  ];
  const before: ContextBlock[] = [
    ...shared,
    ...files,
    { id: "chat", label: t("chat"), kind: "chat", tokens: 42900, detail: t("chatDetail") },
    { id: "test", label: t("test"), kind: "result", tokens: 22400 },
    laterFiles[0],
    { id: "results", label: t("results"), kind: "result", tokens: 15600, items: [
      { label: "createPaymentIntent" }, { label: "verifyPayment" },
    ] },
    laterFiles[1],
    { id: "retest", label: t("test"), kind: "result", tokens: 21200 },
  ];
  const after: ContextBlock[] = [
    ...shared,
    ...files,
    ...laterFiles,
    { id: "summary", label: t("summary"), kind: "summary", tokens: 8600, detail: t("summaryDetail") },
  ];
  const otherBlocks: Record<string, ContextBlock[]> = {
    scout: [...shared, fileBlock("readme", "README.md", 11200),
      { id: "scan", label: t("results"), kind: "result", tokens: 32600 }],
    support: [...shared, { id: "conversation", label: t("chat"), kind: "chat", tokens: 42000 },
      fileBlock("policy", "support.md", 19000)],
  };

  const current = otherBlocks[agent] ?? before;
  const allBlocksCount = current.length;
  const compacted = phase === "done";

  useEffect(() => {
    if (!playing) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let count = 4; count <= allBlocksCount; count++) {
      timers.push(setTimeout(() => setVisibleCount(count), (count - 3) * 320));
    }
    if (agent === "checkout") {
      const fullAt = (allBlocksCount - 3) * 320;
      timers.push(setTimeout(() => setPhase("compacting"), fullAt + 450));
      timers.push(setTimeout(() => setPhase("done"), fullAt + 1300));
    }
    timers.push(setTimeout(() => setPlaying(false), (allBlocksCount - 3) * 320 + 1350));
    return () => timers.forEach(clearTimeout);
  }, [agent, allBlocksCount, playing]);

  return <>
    {!compare && <PreviewToolbarPortal>
      <Button
        variant="ghost"
        size="sm"
        leadingIcon={Replay}
        aria-label={t("replay")}
        disabled={playing}
        onClick={() => {
          setView("after");
          setVisibleCount(3);
          setPhase("idle");
          setPlaying(true);
        }}
      >
        {t("replay")}
      </Button>
    </PreviewToolbarPortal>}
    <ContextMap
      className="max-w-[680px]"
      blocks={compacted ? after : current.slice(0, visibleCount)}
      limit={200000}
      agents={compare ? undefined : agents}
      agent={agent}
      onAgentChange={(next) => {
        setView("after");
        setPlaying(false);
        setVisibleCount(undefined);
        setPhase("idle");
        setAgent(next);
      }}
      model={compare ? agents[0].model : undefined}
      modelIcon={compare ? agents[0].modelIcon : undefined}
      compaction={compacted ? { before, summarized: ["chat", "test", "retest"], dropped: ["results"], summary: "summary" } : null}
      view={view}
      onViewChange={setView}
      status={phase === "compacting" ? t("compacting") : undefined}
      labels={chinese ? contextMapZhLabels : undefined}
      locale={chinese ? "zh-CN" : "en"}
    />
  </>;
}
