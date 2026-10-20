import type { ReactNode } from "react";

const compactTokens = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const billions = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const tokenText = (value: number) => value >= 1e9
  ? `${billions.format(value / 1e9)}B`
  : compactTokens.format(value).replace(/K$/, "k");

export interface ChatMessageMetrics {
  /** Time to the first output token, in milliseconds. */
  ttftMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  /** Total response duration, in milliseconds. */
  durationMs?: number;
}

export interface ChatMessageMetaProps {
  model?: ReactNode;
  metrics?: ChatMessageMetrics;
  locale?: string;
  labels?: Partial<{ ttft: string; inputTokens: string; outputTokens: string; duration: string }>;
}

/** Response metadata; supplied values belong to this reply, not the active model selector. */
export function ChatMessageMeta({ model, metrics, locale = "en", labels: overrides }: ChatMessageMetaProps) {
  const zh = locale.startsWith("zh");
  const labels = { ttft: "TTFT", inputTokens: zh ? "输入" : "Input", outputTokens: zh ? "输出" : "Output", duration: zh ? "耗时" : "Time", ...overrides };
  let numbers: Intl.NumberFormat;
  try {
    numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  } catch {
    numbers = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
  }
  const duration = (ms: number) => ms < 1000 ? `${numbers.format(Math.round(ms))} ms` : `${numbers.format(ms / 1000)} s`;
  const fields = [
    { key: "ttft", label: labels.ttft, value: metrics?.ttftMs, format: duration },
    { key: "input", label: labels.inputTokens, value: metrics?.inputTokens, format: (n: number) => `${tokenText(n)} tokens`, integer: true },
    { key: "output", label: labels.outputTokens, value: metrics?.outputTokens, format: (n: number) => `${tokenText(n)} tokens`, integer: true },
    { key: "duration", label: labels.duration, value: metrics?.durationMs, format: duration },
  ].filter(({ value, integer }) => value != null && Number.isFinite(value) && value >= 0 && (!integer || Number.isInteger(value)));
  if (model == null && !fields.length) return null;
  return (
    <span data-slot="chat-message-meta" className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted tabular-nums">
      {model != null && <span className="min-w-0 break-words">{model}</span>}
      {fields.map(({ key, label, value, format, integer }) => {
        const display = `${label} ${format(value!)}`;
        const exact = integer ? `${label} ${numbers.format(value!)} tokens` : undefined;
        return <span key={key} title={exact} className="whitespace-nowrap">{exact
          ? <><span aria-hidden="true">{display}</span><span className="sr-only">{exact}</span></>
          : display}</span>;
      })}
    </span>
  );
}
