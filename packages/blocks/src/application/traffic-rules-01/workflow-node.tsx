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
  return <section className={cn(styles.node, expanded && styles.nodeExpanded, issue && styles.nodeInvalid)} data-node-id={id} data-tone={tone}>
    <header className={styles.nodeHeader}>
      <button className={styles.nodeToggle} type="button" onClick={onToggle} title={expanded ? "收起节点" : "展开节点"} aria-expanded={expanded} aria-controls={`workflow-${id}`}>
        <span className={styles.nodeIcon}><Icon aria-hidden className="size-5" /></span>
        <span className={styles.nodeTitle}><strong>{title}</strong>{!expanded ? <span>{description}</span> : null}</span>
        <Chevron aria-hidden className={cn("size-4 shrink-0 text-fg-subtle transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? tools : null}
    </header>
    {expanded ? <div id={`workflow-${id}`} className={styles.nodeBody}>{children}</div> : null}
    {issue ? <p className={styles.nodeIssue} role="alert">{issue}</p> : null}
    {expanded && footer ? <footer className={styles.nodeFooter}>{footer}</footer> : null}
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
