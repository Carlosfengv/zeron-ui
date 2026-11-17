"use client";

import {
  forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState,
  type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Alert, AlertDescription } from "#components/alert";
import { Avatar, AvatarFallback } from "#components/avatar";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import { Empty, EmptyDescription } from "#components/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "#components/input-group";
import { Kbd } from "#components/kbd";
import { Tooltip, TooltipProvider } from "#components/tooltip";
import { useIcon } from "#system/icon-context";
import { spring } from "#system/springs";
import { cn } from "#system/utils";

export type DecisionText = string | { text: string; note: string; source?: string };

export interface DecisionLeafOption {
  label: string;
  icon?: ReactNode;
  effects?: DecisionText | readonly DecisionText[];
  apps?: readonly ReactNode[];
  pick?: boolean;
}

export interface DecisionOption extends DecisionLeafOption {
  next?: { question: string; options: readonly DecisionLeafOption[] };
}

export interface Decision {
  id: string;
  question: string;
  context?: string;
  agent: string;
  model?: string;
  icon?: ReactNode;
  risk?: "high" | "medium" | "low";
  options: readonly DecisionOption[];
}

export type DecisionChoice =
  | { index: number; option: DecisionOption; then?: { index: number; option: DecisionLeafOption } }
  | { other: string };

export interface DecisionTreeHandle {
  hover: (index: number | null) => void;
  choose: (index: number) => void;
  setOther: (text: string) => void;
  send: () => void;
  next: () => void;
  previous: () => void;
  peek: () => Decision | undefined;
}

export interface DecisionTreeLabels {
  waiting: (count: number) => string;
  position: (current: number, count: number) => string;
  optionCount: (count: number) => string;
  agentPick: string;
  highRisk: string;
  mediumRisk: string;
  previous: string;
  next: string;
  other: string;
  instruction: string;
  send: string;
  cancel: string;
  pickBranch: string;
  followUp: string;
  picked: (option: string, question?: string) => string;
  submitting: string;
  approved: string;
  sent: string;
  failed: string;
  empty: string;
}

export interface DecisionTreeProps extends ComponentPropsWithoutRef<"div"> {
  decisions: readonly Decision[];
  onChoose?: (decision: Decision, choice: DecisionChoice) => string | void | Promise<string | void>;
  allowOther?: boolean;
  title?: string;
  labels?: Partial<DecisionTreeLabels>;
}

const defaultLabels: DecisionTreeLabels = {
  waiting: (count) => `${count} waiting for you`,
  position: (current, count) => `${current} of ${count}`,
  optionCount: (count) => `${count} options`,
  agentPick: "Agent’s pick",
  highRisk: "High risk",
  mediumRisk: "Medium risk",
  previous: "Previous decision",
  next: "Next decision",
  other: "Other…",
  instruction: "Tell the agent what to do instead…",
  send: "Send instruction",
  cancel: "Cancel",
  pickBranch: "Pick a branch",
  followUp: "Then",
  picked: (option, question) => question ? `${option}. Next: ${question}` : `Selected: ${option}`,
  submitting: "Submitting…",
  approved: "Approved · running",
  sent: "Sent to the agent",
  failed: "Couldn’t submit. Try again.",
  empty: "No decisions waiting",
};

const cardClass = "rounded-lg border border-border bg-surface-floating shadow-control";
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const keyClass = "h-4 min-w-4 rounded-sm border-0 shadow-none";

type BranchPath = { branch: string; detail?: string };

function pointOn(element: Element, bounds: DOMRect, scale: readonly [number, number], edge: "left" | "right", top = false) {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect[edge] - bounds.left) * scale[0],
    y: (rect.top - bounds.top) * scale[1] + (top ? 14 : rect.height * scale[1] / 2),
  };
}

function connector(from: { x: number; y: number }, to: { x: number; y: number }) {
  const middle = (from.x + to.x) / 2;
  const sign = Math.sign(to.y - from.y);
  const radius = Math.min(8, Math.abs(to.y - from.y) / 2, Math.abs(to.x - from.x) / 2);
  return `M${from.x} ${from.y} H${middle - radius} Q${middle} ${from.y} ${middle} ${from.y + sign * radius} V${to.y - sign * radius} Q${middle} ${to.y} ${middle + radius} ${to.y} H${to.x}`;
}

function DecisionTreeLines({ active, committed, decision, showOther, allowOther, reduced }: {
  active: number | null;
  committed: boolean;
  decision: Decision;
  showOther: boolean;
  allowOther: boolean;
  reduced: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<BranchPath[]>([]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const tree = svg?.parentElement;
    if (!svg || !tree) return;
    const measure = () => {
      const bounds = svg.getBoundingClientRect();
      const question = tree.querySelector("[data-decision-question]");
      if (!bounds.width || !bounds.height || !question) return;
      const scale = [svg.clientWidth / bounds.width, svg.clientHeight / bounds.height] as const;
      const start = pointOn(question, bounds, scale, "right");
      const next = Array.from(tree.querySelectorAll("[data-decision-row]"), (row) => {
        const branch = row.firstElementChild!;
        const branchPath = connector(start, pointOn(branch, bounds, scale, "left"));
        const detail = row.children[1];
        return {
          branch: branchPath,
          detail: detail ? connector(pointOn(branch, bounds, scale, "right"), pointOn(detail, bounds, scale, "left", detail.hasAttribute("data-follow-up"))) : undefined,
        };
      });
      setPaths((previous) => previous.length === next.length && previous.every((path, index) =>
        path.branch === next[index].branch && path.detail === next[index].detail) ? previous : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(tree);
    tree.querySelectorAll("[data-decision-question], [data-decision-row], [data-decision-row] > *").forEach((node) => observer.observe(node));
    measure();
    return () => observer.disconnect();
  }, [decision, showOther, allowOther]);

  const picked = (index: number) => Boolean(decision.options[index]?.pick);
  const order = paths.map((_, index) => index);
  if (active !== null && paths[active]) order.push(...order.splice(active, 1));
  else order.sort((a, b) => Number(picked(a)) - Number(picked(b)));

  return (
    <svg ref={svgRef} aria-hidden="true" className="pointer-events-none absolute inset-0 hidden size-full overflow-visible @min-[640px]/decision-tree:block" fill="none" strokeWidth="1">
      {order.map((index) => (
        <g key={index} className={cn(
          "stroke-border motion-safe:transition-opacity motion-safe:duration-fast",
          picked(index) && "stroke-brand/45",
          active === index && "stroke-brand",
          active !== null && active !== index && (committed ? "opacity-0" : "opacity-30"),
        )}>
          <motion.path d={paths[index].branch} initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={spring.slow} />
          {paths[index].detail && <motion.path d={paths[index].detail} initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ ...spring.slow, delay: reduced ? 0 : spring.fast.duration }} />}
        </g>
      ))}
    </svg>
  );
}

function DecisionIcon({ children }: { children: ReactNode }) {
  return <span aria-hidden="true" className="inline-grid size-5 shrink-0 place-items-center rounded-md border border-border-subtle bg-surface-floating [&_svg]:size-3">{children}</span>;
}

function DecisionNote({ line }: { line: Exclude<DecisionText, string> }) {
  const id = useId();
  const [tapOpen, setTapOpen] = useState(false);
  const content = <>{line.note}{line.source && <span className="mt-1 block opacity-75">{line.source}</span>}</>;

  return (
    <>
      <Tooltip forceOpen={tapOpen ? false : undefined} className="max-w-64 [overflow-wrap:anywhere]" content={content}>
        <button type="button" data-decision-note aria-label={line.text} aria-describedby={tapOpen ? id : undefined}
          className={cn("rounded-sm bg-warning-surface px-0.5 text-left text-fg-warning underline decoration-dotted underline-offset-2", focusClass)}
          onPointerUp={(event) => { if (event.pointerType === "touch" || event.pointerType === "pen") setTapOpen(!tapOpen); }}
          onKeyDown={(event) => { if (tapOpen && event.key === "Escape") { event.stopPropagation(); setTapOpen(false); } }}
        >{line.text}</button>
      </Tooltip>
      {tapOpen && <span id={id} role="tooltip" className="mt-1 block max-w-64 rounded-lg bg-inverse-background px-2 py-1 text-fg-on-inverse [overflow-wrap:anywhere]">{content}</span>}
    </>
  );
}

function DecisionEffects({ effects, apps }: Pick<DecisionLeafOption, "effects" | "apps">) {
  if (!effects && !apps?.length) return null;
  const lines = typeof effects === "string" ? [effects] : effects && "text" in effects ? [effects] : effects;
  return (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-1 text-label text-fg-muted">
      {lines && (
        <ul className="min-w-0 space-y-0.5 [overflow-wrap:anywhere]">
          {lines.map((line, index) => (
            <li key={index}>
              {typeof line === "string" ? line : <DecisionNote line={line} />}
            </li>
          ))}
        </ul>
      )}
      {apps && apps.length > 0 && <span className="flex -space-x-1">{apps.map((app, index) => <DecisionIcon key={index}>{app}</DecisionIcon>)}</span>}
    </div>
  );
}

const DecisionTree = forwardRef<DecisionTreeHandle, DecisionTreeProps>(function DecisionTree(
  { decisions, onChoose, allowOther = true, title = "Decisions", labels, className, onKeyDown, ...props }, ref,
) {
  const copy = { ...defaultLabels, ...labels };
  const headingId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<DecisionTreeViewHandle>(null);
  const [resolved, setResolved] = useState<ReadonlySet<string>>(() => new Set());
  const [order, setOrder] = useState(() => decisions.map(({ id }) => id));
  const [cursor, setCursor] = useState<{ id?: string; index: number }>({ index: 0 });
  const byId = new Map(decisions.map((decision) => [decision.id, decision]));
  const nextOrder = [...order.filter((id) => byId.has(id)), ...Array.from(byId.keys()).filter((id) => !order.includes(id))];
  if (nextOrder.length !== order.length || nextOrder.some((id, index) => id !== order[index])) setOrder(nextOrder);
  const queue = nextOrder.filter((id) => !resolved.has(id));
  const activeIndex = cursor.id ? queue.indexOf(cursor.id) : -1;
  const index = activeIndex < 0 ? cursor.index % Math.max(queue.length, 1) : activeIndex;
  const decision = byId.get(queue[index]);
  const BranchIcon = useIcon("workflow");
  const PreviousIcon = useIcon("chevron-left");
  const NextIcon = useIcon("chevron-right");

  function navigate(direction: number) {
    if (queue.length < 2 || viewRef.current?.busy()) return;
    const nextIndex = (index + direction + queue.length) % queue.length;
    setCursor({ id: queue[nextIndex], index: nextIndex });
    rootRef.current?.focus({ preventScroll: true });
  }

  useImperativeHandle(ref, () => ({
    hover: (branch) => viewRef.current?.hover(branch),
    choose: (branch) => viewRef.current?.choose(branch),
    setOther: (text) => viewRef.current?.setOther(text),
    send: () => viewRef.current?.send(),
    next: () => navigate(1),
    previous: () => navigate(-1),
    peek: () => decision,
  }));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const key = event.key.toLowerCase();
    const editing = event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable);
    if (key === "escape" && event.target instanceof Element && event.target.closest("[data-decision-note][aria-describedby]")) return;
    if ((!editing || key === "escape") && viewRef.current?.handleKey(key)) {
      event.preventDefault();
      return;
    }
    if (editing) return;
    if (queue.length > 1 && ["arrowleft", "arrowright", "j", "k"].includes(key)) {
      event.preventDefault();
      navigate(key === "arrowright" || key === "j" ? 1 : -1);
    }
  }

  function resolve(id: string) {
    setResolved((previous) => new Set(previous).add(id));
    setCursor({ index });
    if (rootRef.current?.contains(document.activeElement)) rootRef.current.focus({ preventScroll: true });
  }

  return (
    <div {...props} ref={rootRef} role="region" aria-labelledby={props["aria-labelledby"] ?? (props["aria-label"] ? undefined : headingId)}
      tabIndex={props.tabIndex ?? 0} onKeyDown={handleKeyDown} data-slot="decision-tree"
      className={cn("@container/decision-tree w-full min-w-0 rounded-lg text-body text-fg-default", focusClass, className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <BranchIcon aria-hidden="true" className="size-4 shrink-0 text-fg-brand" />
        <span id={headingId} className="font-medium">{title}</span>
        <span className="text-label text-fg-subtle @max-[400px]/decision-tree:sr-only">{copy.waiting(queue.length)}</span>
        {queue.length > 1 && (
          <div className="ml-auto flex items-center gap-1.5 text-label text-fg-subtle">
            <Button type="button" variant="ghost" size="xs" iconOnly aria-label={copy.previous} aria-keyshortcuts="ArrowLeft K" onClick={() => navigate(-1)}><PreviousIcon aria-hidden="true" /></Button>
            <span aria-live="polite" className="flex items-center gap-2">
              {queue.length <= 8 && <span aria-hidden="true" className="flex gap-1">{queue.map((id, position) => <span key={id} className={cn("size-1.5 rounded-xs", position === index ? "bg-fg-default" : "bg-fg-subtle/30")} />)}</span>}
              <span className="whitespace-nowrap">{copy.position(index + 1, queue.length)}</span>
            </span>
            <Button type="button" variant="ghost" size="xs" iconOnly aria-label={copy.next} aria-keyshortcuts="ArrowRight J" onClick={() => navigate(1)}><NextIcon aria-hidden="true" /></Button>
          </div>
        )}
      </div>
      {decision ? (
        <DecisionTreeView key={decision.id} ref={viewRef} decision={decision} copy={copy} allowOther={allowOther}
          count={queue.length} onChoose={onChoose} onResolved={() => resolve(decision.id)} />
      ) : <Empty reason="no-data" scope="inline" announce><EmptyDescription>{copy.empty}</EmptyDescription></Empty>}
    </div>
  );
});

interface DecisionTreeViewHandle extends Pick<DecisionTreeHandle, "hover" | "choose" | "setOther" | "send"> {
  busy: () => boolean;
  handleKey: (key: string) => boolean;
}

type Submission = { choice: DecisionChoice; status: "pending" | "success"; reply?: string };

const DecisionTreeView = forwardRef<DecisionTreeViewHandle, {
  decision: Decision;
  copy: DecisionTreeLabels;
  allowOther: boolean;
  count: number;
  onChoose: DecisionTreeProps["onChoose"];
  onResolved: () => void;
}>(function DecisionTreeView({ decision, copy, allowOther, count, onChoose, onResolved }, ref) {
  const [hover, setHover] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState<number | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  const [submission, setSubmission] = useState<Submission>();
  const [failed, setFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const viewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const otherRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const lifecycle = useRef<AbortController | null>(null);
  const complete = useRef(onResolved);
  const AgentIcon = useIcon("brain");
  const SendIcon = useIcon("arrow-up");
  const CheckIcon = useIcon("check");
  const CloseIcon = useIcon("x");
  const reduced = Boolean(useReducedMotion());
  const otherIndex = decision.options.length;
  const currentFollowUp = followUp === null ? undefined : decision.options[followUp]?.next;
  const showOther = allowOther && draft !== null;
  const selected = submission ? ("other" in submission.choice ? otherIndex : submission.choice.index) : followUp;
  const active = selected ?? (showOther ? otherIndex : hover);

  useLayoutEffect(() => { complete.current = onResolved; }, [onResolved]);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    return () => controller.abort();
  }, []);
  useLayoutEffect(() => {
    if (showOther && !submission) inputRef.current?.focus();
    else if (currentFollowUp && !submission) viewRef.current?.querySelector<HTMLButtonElement>("[data-follow-up-choice]:enabled")?.focus();
  }, [showOther, currentFollowUp, submission]);

  function updateDraft(value: string | null) {
    draftRef.current = value;
    setDraft(value);
  }

  async function submit(choice: DecisionChoice) {
    const signal = lifecycle.current?.signal;
    if (!signal || busy.current) return;
    busy.current = true;
    setFailed(false);
    setSubmission({ choice, status: "pending" });
    try {
      const result = await onChoose?.(decision, choice);
      if (signal.aborted) return;
      const reply = "other" in choice ? result?.trim() : undefined;
      setSubmission({ choice, status: "success", reply });
      const delay = reply ? 2500 : 950;
      const timeout = window.setTimeout(() => complete.current(), delay);
      signal.addEventListener("abort", () => window.clearTimeout(timeout), { once: true });
    } catch {
      if (signal.aborted) return;
      busy.current = false;
      setSubmission(undefined);
      setFailed(true);
      if (followUp === null && !showOther && "index" in choice) {
        requestAnimationFrame(() => viewRef.current?.querySelector<HTMLButtonElement>(`[data-branch="${choice.index}"]`)?.focus({ preventScroll: true }));
      }
    }
  }

  function choose(index: number) {
    if (busy.current) return;
    if (currentFollowUp && followUp !== null) {
      const option = currentFollowUp.options[index];
      if (option) void submit({ index: followUp, option: decision.options[followUp], then: { index, option } });
      return;
    }
    if (allowOther && index === otherIndex) {
      setFailed(false);
      updateDraft(draftRef.current ?? "");
      return;
    }
    const option = decision.options[index];
    if (!option) return;
    updateDraft(null);
    if (option.next?.options.length) {
      setFollowUp(index);
      setAnnouncement(copy.picked(option.label, option.next.question));
      setFailed(false);
    } else void submit({ index, option });
  }

  function send() {
    const other = draftRef.current?.trim();
    if (allowOther && other) void submit({ other });
  }

  function cancel() {
    if (busy.current) return false;
    if (showOther) {
      updateDraft(null);
      requestAnimationFrame(() => otherRef.current?.focus({ preventScroll: true }));
    } else if (followUp !== null) {
      setAnnouncement("");
      setFollowUp(null);
      viewRef.current?.querySelector<HTMLButtonElement>(`[data-branch="${followUp}"]`)?.focus({ preventScroll: true });
    } else return false;
    setHover(null);
    setFailed(false);
    return true;
  }

  useImperativeHandle(ref, () => ({
    busy: () => busy.current,
    hover: (index) => setHover(index),
    choose,
    setOther: (text) => {
      if (!allowOther || busy.current) return;
      setFollowUp(null);
      setFailed(false);
      updateDraft(text);
    },
    send,
    handleKey: (key) => {
      if (busy.current) return false;
      if (key === "escape") return cancel();
      if (/^[1-9]$/.test(key) && Number(key) <= (currentFollowUp?.options.length ?? otherIndex + Number(allowOther))) {
        choose(Number(key) - 1);
        return true;
      }
      if (key === "f") {
        const notes = Array.from(viewRef.current?.querySelectorAll<HTMLButtonElement>("[data-decision-note]") ?? [])
          .filter((note) => note.getClientRects().length && !note.closest("[inert]"));
        if (!notes.length) return false;
        notes[(notes.indexOf(document.activeElement as HTMLButtonElement) + 1) % notes.length].focus();
        return true;
      }
      return false;
    },
  }));

  const intro = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: reduced ? { duration: 0 } : { ...spring.moderate, delay },
  });
  const visibleOptions = currentFollowUp?.options.length ?? otherIndex + Number(allowOther);
  const status = submission?.status === "pending" ? copy.submitting
    : submission?.status === "success" ? ("other" in submission.choice ? copy.sent : copy.approved) : null;
  const pickLabel = (option: DecisionLeafOption) => option.pick ? `${option.label} · ${copy.agentPick}` : option.label;

  return (
    <TooltipProvider>
      <div ref={viewRef} className="mt-4 @min-[640px]/decision-tree:mt-11" onPointerLeave={() => setHover(null)}>
        <motion.div className="relative grid items-center @min-[640px]/decision-tree:grid-cols-[minmax(0,27%)_minmax(0,1fr)] @min-[640px]/decision-tree:gap-7" {...intro()}>
          <DecisionTreeLines active={active} committed={selected !== null} reduced={reduced} decision={decision} showOther={showOther} allowOther={allowOther} />
          <div className="relative grid gap-1.5 @min-[640px]/decision-tree:gap-0">
            {decision.risk && decision.risk !== "low" && (
              <Badge size="sm" status={decision.risk === "high" ? "danger" : "warning"} className="@min-[640px]/decision-tree:absolute @min-[640px]/decision-tree:bottom-full @min-[640px]/decision-tree:mb-1.5">
                {decision.risk === "high" ? copy.highRisk : copy.mediumRisk}
              </Badge>
            )}
            <div data-decision-question className={cn(cardClass, "grid gap-1.5 p-4 [overflow-wrap:anywhere]")}>
              <div className="mb-1 flex items-center gap-2">
                <Avatar aria-hidden="true" size="md" shape="rounded">
                  <AvatarFallback className="[&_svg]:size-4">{decision.icon ?? <AgentIcon className="text-fg-brand" />}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-medium">{decision.agent}</div>
                  {decision.model && <div className="text-label text-fg-subtle">{decision.model}</div>}
                </div>
              </div>
              <p className="font-medium">{decision.question}</p>
              {decision.context && <p className="text-label text-fg-muted">{decision.context}</p>}
            </div>
          </div>
          <motion.div className="relative grid min-w-0 gap-3 pt-4 pl-5 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border @min-[640px]/decision-tree:gap-3.5 @min-[640px]/decision-tree:p-0 @min-[640px]/decision-tree:before:hidden" {...intro(spring.fast.duration)}>
            {decision.options.map((option, index) => {
              const open = followUp === index;
              const hidden = selected !== null && selected !== index;
              const hasEffects = Boolean(option.effects || option.apps?.length);
              return (
                <div key={index} data-decision-row inert={hidden || undefined}
                  onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHover(null); }}
                  className={cn("relative grid min-w-0 items-center gap-2 before:absolute before:top-4 before:-left-2 before:h-px before:w-2 before:bg-border @min-[640px]/decision-tree:grid-cols-[minmax(0,39%)_minmax(0,1fr)] @min-[640px]/decision-tree:gap-6 @min-[640px]/decision-tree:before:hidden motion-safe:transition-opacity motion-safe:duration-fast",
                    hidden ? "opacity-0 @max-[640px]/decision-tree:hidden" : active !== null && active !== index && "opacity-50",
                    (option.pick || open) && "before:bg-brand/45",
                  )}>
                  <button type="button" data-branch={index} aria-label={pickLabel(option)} aria-expanded={option.next ? open : undefined} aria-keyshortcuts={currentFollowUp ? undefined : String(index + 1)}
                    aria-disabled={Boolean(submission) || open || undefined} onClick={() => { if (!open) choose(index); }}
                    className={cn(cardClass, focusClass, "relative min-h-control-lg min-w-0 px-2.5 py-1.5 text-left font-medium [overflow-wrap:anywhere]", option.pick && "border-brand/35", active === index && "border-brand/65")}>
                    <span className="flex items-center gap-1.5"><Kbd className={keyClass} aria-hidden="true">{index + 1}</Kbd>{option.icon && <DecisionIcon>{option.icon}</DecisionIcon>}<span className="min-w-0">{option.label}</span></span>
                    {option.pick && <span className="block pl-[1.375rem] text-label font-normal text-fg-brand">{copy.agentPick}</span>}
                  </button>
                  {(option.next || hasEffects) && (
                    <div data-follow-up={option.next ? "" : undefined} className="relative ml-4 grid min-w-0 justify-items-start gap-1.5 before:absolute before:-top-2 before:left-0 before:h-2 before:w-px before:bg-border @min-[640px]/decision-tree:ml-0 @min-[640px]/decision-tree:before:hidden">
                      {hasEffects && <div className={cn(cardClass, "max-w-full bg-surface-raised px-2.5 py-1.5")}><DecisionEffects effects={option.effects} apps={option.apps} /></div>}
                      {option.next && (
                        <div className="grid max-w-full gap-1.5">
                          <div className={cn(cardClass, "w-fit max-w-full px-2.5 py-1.5 text-label [overflow-wrap:anywhere]", open ? "text-fg-default" : "text-fg-muted")}>
                            {option.next.question}<span className={cn("ml-1.5 text-fg-subtle @min-[640px]/decision-tree:hidden", open && "hidden")}>{copy.optionCount(option.next.options.length)}</span>
                          </div>
                          <div className={cn("relative ml-3 grid min-w-0 justify-items-start gap-1.5 border-l border-border pl-2", !open && "@max-[640px]/decision-tree:hidden")}>
                            {option.next.options.map((leaf, leafIndex) => (
                              <div key={leafIndex} className={cn(cardClass, "relative grid max-w-full min-w-0 gap-1 px-2.5 py-1.5 before:absolute before:top-3.5 before:-left-[9px] before:h-px before:w-2 before:bg-border", leaf.pick && "border-brand/30 before:bg-brand/45", submission && open && "then" in submission.choice && (submission.choice.then?.index === leafIndex ? "border-brand/65" : "opacity-30"))}>
                                <button type="button" data-follow-up-choice disabled={!open} aria-disabled={Boolean(submission) || undefined} aria-label={pickLabel(leaf)} aria-keyshortcuts={open ? String(leafIndex + 1) : undefined}
                                  onClick={() => choose(leafIndex)} className={cn(focusClass, "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-sm text-left text-label font-medium [overflow-wrap:anywhere]", open ? "text-fg-default" : "text-fg-muted")}>
                                  {open && <Kbd className={keyClass} aria-hidden="true">{leafIndex + 1}</Kbd>}{leaf.icon && <DecisionIcon>{leaf.icon}</DecisionIcon>}
                                  <span className="min-w-0">{leaf.label}</span>{leaf.pick && <span className="font-normal text-fg-brand">{copy.agentPick}</span>}
                                </button>
                                <DecisionEffects effects={leaf.effects} apps={leaf.apps} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {allowOther && (
              <div data-decision-row inert={selected !== null && selected !== otherIndex || undefined} onPointerEnter={() => setHover(otherIndex)} onPointerLeave={() => setHover(null)}
                className={cn("relative grid min-w-0 items-start before:absolute before:top-4 before:-left-2 before:h-px before:w-2 before:bg-border @min-[640px]/decision-tree:grid-cols-[minmax(0,39%)_minmax(0,1fr)] @min-[640px]/decision-tree:before:hidden motion-safe:transition-opacity motion-safe:duration-fast",
                  selected !== null && selected !== otherIndex ? "opacity-0 @max-[640px]/decision-tree:hidden" : active !== null && active !== otherIndex && "opacity-50")}>
                {showOther ? (
                  <form onSubmit={(event) => { event.preventDefault(); send(); }} className="min-w-0">
                    <InputGroup size="xs" className="items-end">
                      <InputGroupTextarea ref={inputRef} aria-label={copy.instruction} aria-keyshortcuts="Enter Escape" placeholder={copy.instruction} rows={2} value={draft ?? ""} readOnly={Boolean(submission)}
                        className="min-h-[calc(2lh+--spacing(4))] max-h-[calc(3lh+--spacing(4))] min-w-0"
                        onChange={(event) => updateDraft(event.target.value)}
                        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} />
                      <InputGroupAddon align="inline-end" className={cn("self-end py-1", (!draft?.trim() || submission) && "invisible")}>
                        <InputGroupButton type="submit" variant="primary" iconOnly disabled={!draft?.trim() || Boolean(submission)} aria-label={copy.send}><SendIcon aria-hidden="true" /></InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </form>
                ) : (
                  <button ref={otherRef} type="button" aria-keyshortcuts={String(otherIndex + 1)} onClick={() => choose(otherIndex)} className={cn(focusClass, "flex min-h-control-lg items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-left text-fg-muted hover:border-brand/50 hover:text-fg-default")}>
                    <Kbd className={keyClass} aria-hidden="true">{otherIndex + 1}</Kbd>{copy.other}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
        <div className="mt-4 min-h-5 text-label text-fg-subtle">
          {failed && <Alert status="danger" className="mb-1"><AlertDescription>{copy.failed}</AlertDescription></Alert>}
          <div role="status" aria-atomic="true" className="flex flex-wrap items-center gap-2">
            {status && <>
              <Badge size="sm" status={submission?.status === "success" ? "success" : "neutral"} leadingIcon={submission?.status === "success" ? <CheckIcon /> : undefined}>{status}</Badge>
              {submission?.reply && <span className="min-w-0 text-fg-default [overflow-wrap:anywhere]">{submission.reply}</span>}
            </>}
          </div>
          {!status && <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex flex-wrap items-center gap-1.5" aria-hidden="true">{currentFollowUp ? copy.followUp : copy.pickBranch}
              {visibleOptions > 0 && <Kbd className={keyClass}>1</Kbd>}{visibleOptions > 1 && <>–<Kbd className={keyClass}>{visibleOptions}</Kbd></>}
              {!currentFollowUp && count > 1 && <><span>·</span>{copy.next}<Kbd className={keyClass}>→</Kbd></>}
            </span>
            {(currentFollowUp || showOther) && <Button type="button" variant="ghost" size="sm" leadingIcon={CloseIcon} onClick={cancel}>{copy.cancel}</Button>}
          </div>}
        </div>
        <div className="sr-only" aria-live="polite">{status ? "" : announcement}</div>
      </div>
    </TooltipProvider>
  );
});

export { DecisionTree };
