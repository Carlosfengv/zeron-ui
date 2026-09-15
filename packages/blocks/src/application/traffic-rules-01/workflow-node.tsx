"use client";

import type { ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import styles from "./rule-workflow.module.css";

export function WorkflowNode({ id, title, description, icon, tone = "blue", expanded, onToggle, children, footer, tools, issue }: {
  id: string; title: string; description: string; icon: IconName;
  tone?: "blue" | "purple" | "green" | "amber";
  expanded: boolean; onToggle: () => void; children?: ReactNode; footer?: ReactNode; tools?: ReactNode; issue?: string;
}) {
  const Icon = useIcon(icon);
  const Chevron = useIcon("chevron-down");
  return <section className={cn(styles.node, "w-[336px] max-w-full shrink-0 scroll-m-8 rounded-xl border border-border-subtle bg-surface-floating transition-colors duration-moderate motion-reduce:transition-none", expanded && styles.nodeExpanded, issue && "border-danger-border")} data-node-id={id} data-tone={tone}>
    <header className={cn("flex items-center gap-1 rounded-t-xl px-3", expanded ? cn("min-h-11 py-1", styles.nodeTint) : "min-h-[72px] py-2")}>
      <button className={cn(styles.nodeTitleButton, "group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md p-1 text-left outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus-ring")} type="button" onClick={onToggle} title={expanded ? "收起节点" : "展开节点"} aria-expanded={expanded} aria-controls={`workflow-${id}`}>
        <span className={cn(styles.nodeIcon, "grid size-9 shrink-0 place-items-center rounded-lg", expanded && "size-6 bg-transparent [&_svg]:size-4")}><Icon aria-hidden className="size-5" /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-body font-medium leading-5">{title}</strong>{!expanded ? <span className="truncate text-label leading-4 text-fg-subtle">{description}</span> : null}</span>
        <Chevron aria-hidden className={cn("size-4 shrink-0 text-fg-subtle transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? tools : null}
    </header>
    {expanded ? <div id={`workflow-${id}`} className="p-4 text-label max-[600px]:p-3">{children}</div> : null}
    {issue ? <p className="px-4 py-2 text-label text-fg-danger" role="alert">{issue}</p> : null}
    {expanded && footer ? <footer className="flex flex-wrap items-center gap-2 rounded-b-xl border-t border-border-subtle bg-surface-floating px-4 py-3 text-label text-fg-subtle [&_code]:rounded [&_code]:bg-brand/10 [&_code]:px-2 [&_code]:py-0.5 [&_code]:font-sans [&_code]:text-label [&_code]:text-fg-brand">{footer}</footer> : null}
  </section>;
}

export function FlowConnector({ children, onAdd, addLabel }: { children?: ReactNode; onAdd?: () => void; addLabel?: string }) {
  const Plus = useIcon("plus");
  return <div className={cn(styles.connector, onAdd && styles.connectorInteractive, addLabel && styles.connectorWithLabel)} aria-hidden={!onAdd && !children}>
    {addLabel ? <span className={styles.connectorLineBottom} aria-hidden /> : <span className={styles.connectorLine} aria-hidden />}
    <span className={styles.connectorArrow} aria-hidden />
    {onAdd ? addLabel ? (
      <Button className={styles.connectorAddLabel} leadingIcon={Plus} variant="tertiary" type="button" onClick={onAdd}>{addLabel}</Button>
    ) : (
      <Button className={styles.connectorAdd} aria-label="插入动作" size="xs" iconOnly variant="tertiary" type="button" onClick={onAdd}><Plus /></Button>
    ) : null}
    {children ? <span className={styles.connectorLabel}>{children}</span> : null}
  </div>;
}

/** The same two exits are used by the editable workflow and its read-only detail. */
export function WorkflowConditionBranch({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  return (
    <div className={styles.conditionStage} data-expanded={expanded} role="group" aria-label="条件判断与请求去向">
      {children}
      <div className={styles.unmatched}>
        <strong>不满足条件</strong>
        <span>跳过本规则</span>
        <p>在「规则清单」中<br />按优先级检查下一条规则</p>
      </div>
      <div className={styles.branchRow}>
        <span className={styles.connectorArrow} aria-hidden />
        <div className={styles.matchedLabel}><strong>满足条件</strong><span>执行本规则动作</span></div>
      </div>
    </div>
  );
}
