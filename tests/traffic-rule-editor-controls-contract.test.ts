import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const ruleWorkflow = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/rule-workflow.tsx"),
  "utf8"
);
const limitForm = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/limit-form.tsx"),
  "utf8"
);
const workflowPreview = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/workflow-preview.tsx"),
  "utf8"
);
const workflowCanvasToolbar = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/workflow-canvas-toolbar.tsx"),
  "utf8"
);
const trafficRules = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/traffic-rules-v2.tsx"),
  "utf8"
);
const ruleWorkflowStyles = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/rule-workflow.module.css"),
  "utf8"
);
const limitWorkflowStyles = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/limit-workflow.module.css"),
  "utf8"
);
const ruleDetail = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/rule-detail.tsx"),
  "utf8"
);
const ruleForm = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/rule-form.tsx"),
  "utf8"
);
const limitDetail = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/limit-detail.tsx"),
  "utf8"
);
const limitDetailStyles = readFileSync(
  join(ROOT, "packages/blocks/src/application/traffic-rules-01/limit-detail.module.css"),
  "utf8"
);

describe("traffic rule editor header controls", () => {
  it("uses a tertiary close icon for rule create and edit", () => {
    expect(ruleWorkflow).toContain('aria-label={initial ? "关闭规则编辑" : "关闭规则创建"}');
    expect(ruleWorkflow).toContain('iconOnly onClick={requestExit} type="button" variant="tertiary"><X aria-hidden />');
    expect(ruleWorkflow).not.toContain('aria-label="返回规则清单">返回');
  });

  it("uses a tertiary close icon for limit create and edit", () => {
    expect(limitForm).toContain('aria-label={initial ? "关闭限额编辑" : "关闭限额创建"}');
    expect(limitForm).toContain('iconOnly onClick={requestExit} type="button" variant="tertiary"><Close aria-hidden />');
    expect(limitForm).not.toContain('aria-label="返回全局限额"');
  });

  it("uses a tertiary close icon for limit details", () => {
    expect(limitDetail).toContain('const Close = useIcon("x")');
    expect(limitDetail).toContain('aria-label="返回全局限额" iconOnly onClick={onBack} type="button" variant="tertiary"><Close aria-hidden />');
    expect(limitDetail).not.toContain('leadingIcon={ArrowLeft}');
    expect(limitDetail).not.toContain('>返回</Button>');
  });

  it("uses the default md size for dialog action buttons", () => {
    expect(trafficRules).toContain('<DialogFooter><Button onClick={onCancel} type="button" variant="tertiary">取消</Button><Button onClick={onConfirm} type="button"');
    expect(ruleWorkflow).toContain('<DialogFooter><Button onClick={onKeep} variant="tertiary">继续编辑</Button><Button onClick={onDiscard} variant="destructive">放弃修改</Button>');
    expect(limitForm).toContain('<DialogFooter><Button onClick={onKeep} variant="tertiary">继续编辑</Button><Button onClick={onDiscard} variant="destructive">放弃修改</Button>');
    expect(ruleForm).toContain('<Button onClick={onCancel} type="button" variant="tertiary">取消</Button>');
    expect(ruleForm).toContain('<Button className="px-5" disabled={!canSave} type="submit">保存规则</Button>');
  });

  it("places the limit detail more action at the far right", () => {
    expect(limitDetail.indexOf("<DropdownMenu><DropdownTrigger")).toBeGreaterThan(limitDetail.indexOf("<Button leadingIcon={Edit}"));
  });

  it("keeps the limit information header free of a bottom border", () => {
    const infoHeaderStyles = limitDetailStyles.match(/\.infoHeader \{([\s\S]*?)\}/)?.[1] ?? "";
    expect(infoHeaderStyles).not.toContain("border-bottom");
  });

  it("uses a half-pixel preview border with a narrow-screen editor close button", () => {
    expect(ruleWorkflowStyles).toContain("border: .5px solid var(--border)");
    expect(ruleWorkflow).toContain('closeButtonClassName="hidden max-[900px]:inline-flex"');
    expect(ruleWorkflow).toContain("onClose={() => setShowPreview(false)}");
    expect(workflowPreview).toContain("onClose?: () => void");
    expect(workflowPreview).not.toContain("border-l border-border");
    expect(limitForm).not.toContain('iconOnly onClick={onClose}');
  });

  it("keeps the limit preview header title-only without a bottom border", () => {
    const previewHeaderStyles = limitWorkflowStyles.match(/\.previewHeader \{([\s\S]*?)\}/)?.[1] ?? "";
    expect(limitForm).toContain('<header className={styles.previewHeader}><h2>调试与预览</h2></header>');
    expect(limitForm).not.toContain("验证限额配置与超限结果");
    expect(previewHeaderStyles).toContain("min-height: 56px");
    expect(previewHeaderStyles).toContain("align-items: center");
    expect(previewHeaderStyles).not.toContain("border-bottom");
  });

  it("uses warning surfaces with unchanged borders for shadowless configuration issue items", () => {
    expect(workflowPreview).toContain('flex w-full items-center gap-2 rounded-lg border-[0.5px] border-border bg-warning-surface p-3 text-left shadow-none');
    expect(workflowPreview).toContain('<Info aria-hidden className="size-4 shrink-0 text-fg-warning" />');
    expect(workflowPreview).toContain('<Arrow aria-hidden className="size-4 shrink-0 text-fg-subtle" />');
    expect(workflowPreview).toContain("focusClass, styles.configurationIssueItem");
    expect(ruleWorkflowStyles).toContain(".configurationIssueItem.configurationIssueItem:hover { background: color-mix(in srgb, var(--warning-surface) 80%, var(--warning-border)); }");
    expect(limitWorkflowStyles).toMatch(/\.issueList button \{[\s\S]*border: \.5px solid var\(--border\);[\s\S]*background: var\(--warning-surface\);[\s\S]*box-shadow: none;/);
    expect(limitWorkflowStyles).toMatch(/\.issueList button \{[\s\S]*align-items: center;/);
    expect(limitWorkflowStyles).toMatch(/\.issueList button:hover \{\s*background: color-mix\(in srgb, var\(--warning-surface\) 80%, var\(--warning-border\)\);/);
  });

  it("uses gap-3 spacing in rule and limit editor headers", () => {
    expect(ruleWorkflowStyles).toContain(".topbar.editorTopbar { gap: 12px; }");
    expect(ruleWorkflow).toContain('className={`${styles.topbar} ${styles.editorTopbar}`}');
    expect(limitForm).toContain('className={`${flowStyles.topbar} ${flowStyles.editorTopbar}`}');
  });

  it("shows live configuration status and focuses the first issue", () => {
    for (const source of [ruleWorkflow, limitForm]) {
      expect(source).toContain("配置异常，共 ${issues.length} 项，跳转到第一处");
      expect(source).toContain('className="inline-flex items-center gap-1.5"><span>配置异常</span>');
      expect(source).toContain('<Badge aria-hidden size="sm" status="warning">{issues.length}</Badge>');
      expect(source).toContain('h-control-md items-center gap-1.5 rounded-lg px-2 text-body');
      expect(source).toContain('<Check aria-hidden className="size-4 text-fg-brand" />配置正常');
      expect(source).toContain("if (issues.length) focusNode(issues[0]!.nodeId);");
    }
    for (const source of [ruleWorkflow, limitForm]) {
      expect(source).toContain('tone="warning"');
    }
    expect(ruleWorkflowStyles).not.toContain('[data-slot="button-background"]');
  });

  it("disables invalid saves and explains the remaining issue count with a tooltip", () => {
    expect(ruleWorkflow).toContain('aria-label={`保存规则不可用，还有 ${issues.length} 项配置需要完善`}');
    expect(limitForm).toContain('aria-label={`保存限额不可用，还有 ${issues.length} 项配置需要完善`}');
    expect(ruleWorkflow).not.toContain('role="status"');
    expect(limitForm).not.toContain('role="status"');
  });

  it("provides keyboard-accessible priority controls in the rule actions menu", () => {
    expect(trafficRules).toContain('<MenuItem disabled={!canMoveUp} index={0} label="上移"');
    expect(trafficRules).toContain('<MenuItem disabled={!canMoveDown} index={1} label="下移"');
    expect(trafficRules).toContain("onMove={(direction) => moveRule(rule.id, direction)}");
  });

  it("opens global-limit details from the limit name instead of an action button", () => {
    expect(trafficRules).toContain('aria-label={`查看${name}详情`}');
    expect(trafficRules).toContain("<LimitNameButton limit={limit} onDetail={onOpen} />");
    expect(trafficRules).not.toContain('variant="tertiary">详情</Button>');
    expect(trafficRules).toContain("<LimitActions limit={limit} onDelete={onDelete} />");
  });

  it("uses a primary button for creating a global limit", () => {
    expect(trafficRules).toContain('onClick={() => setPage("limit-create")} type="button" variant="primary">新增限额</Button>');
    expect(trafficRules).toContain('size="sm" type="button" variant="primary">{title.includes("限额") ? "新增限额" : "新建规则"}</Button>');
    expect(trafficRules).not.toContain('variant="neutral">新增限额</Button>');
  });

  it("uses public component APIs instead of overriding internal selection slots", () => {
    expect(trafficRules).toContain('labelVisibility="sr-only"');
    expect(ruleDetail).toContain('labelVisibility="sr-only"');
    for (const source of [trafficRules, ruleDetail]) {
      expect(source).not.toContain("data-slot=switch-label");
    }
    for (const source of [trafficRules, limitForm]) {
      expect(source).not.toContain("data-checked:border-fg-default");
      expect(source).not.toContain("radio-group-indicator");
    }
    expect(limitWorkflowStyles).not.toContain('data-slot="temporal-picker-trigger"');
  });

  it("uses PageLayout composition for global-limit details", () => {
    expect(limitDetail).toContain("<PageContent");
    expect(limitDetail).toContain("<PageContentHeader>");
    expect(limitDetail).toContain("<PageBody");
    expect(limitDetail).not.toContain("flowStyles.workspace");
  });

  it("does not expose a standalone rule-validation page", () => {
    expect(existsSync(join(ROOT, "packages/blocks/src/application/traffic-rules-01/rule-validation.tsx"))).toBe(false);
    expect(trafficRules).not.toContain("RuleValidation");
    expect(trafficRules).not.toContain('"validate"');
    expect(trafficRules).not.toContain(">验证规则</Button>");
    expect(ruleDetail).not.toContain('label="验证规则"');
    expect(ruleDetail).not.toContain("onValidate");
  });

  it("uses semantic shadow tokens for workflow floating controls", () => {
    expect(ruleDetail).not.toContain("shadow-[0_4px_12px_var(--shadow-color)]");
    expect(ruleDetail).toContain("shadow-floating");
    expect(ruleWorkflowStyles).toContain("box-shadow: var(--shadow-floating)");
  });

  it("aligns the limit detail canvas toolbar with the rule detail toolbar", () => {
    const sharedPosition = "absolute bottom-5 right-5";
    const sharedResponsivePosition = "max-[600px]:bottom-3 max-[600px]:right-3";
    expect(ruleDetail).toContain(sharedPosition);
    expect(ruleDetail).toContain(sharedResponsivePosition);
    expect(limitDetail).toContain(sharedPosition);
    expect(limitDetail).toContain(sharedResponsivePosition);
    expect(ruleDetail).toContain('<WorkflowCanvasToolbar ariaLabel="详情画布缩放"');
    expect(limitDetail).toContain('<WorkflowCanvasToolbar ariaLabel="限额详情画布缩放"');
    expect(limitDetail).toContain('className={`${flowStyles.canvasFrame} relative flex min-h-0 flex-1 flex-col`}');
    expect(limitDetail).not.toContain("flowStyles.canvasControls");
  });

  it("shares one single-border canvas toolbar component across detail pages", () => {
    expect(workflowCanvasToolbar).toContain('rounded-lg border border-border bg-surface-floating p-1');
    expect(workflowCanvasToolbar).not.toContain("shadow-floating");
    expect(workflowCanvasToolbar).toContain("<WorkflowZoomSelect");
    expect(workflowCanvasToolbar).toContain(">流程总览</Button>");
  });

  it("uses a dotted scrollable limit detail canvas with collapse and expand icons", () => {
    expect(limitDetail).toContain("[background-image:radial-gradient(var(--border)_1px,transparent_1px)]");
    expect(limitDetail).toContain("[background-position:center] [background-size:22px_22px]");
    expect(limitDetail).toContain('aria-label="只读限额流程画布，可横向和纵向滚动" className={flowStyles.canvas} ref={canvasRef} role="region" tabIndex={0}');
    expect(limitDetail).toContain("const canvasRef = useRef<HTMLDivElement>(null)");
    expect(limitDetail).toContain("canvasRef.current?.scrollTo({ top: 0, left: 0 })");
    expect(limitDetail).toContain('const Collapse = useIcon("chevron-up")');
    expect(limitDetail).toContain('const Expand = useIcon("chevron-down")');
    expect(limitDetail).toContain("leadingIcon={expanded.length ? Collapse : Expand}");
  });
});
