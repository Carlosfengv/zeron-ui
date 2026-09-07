export interface RuleFlowPosition {
  /** Horizontal node centre, expressed as a 0-1 fraction of the canvas width. */
  x: number;
  /** Vertical position in canvas pixels. */
  y: number;
}

export interface RuleFlowOption {
  value: string;
  label: string;
  description?: string;
}

export type RuleFlowTriggerOption = RuleFlowOption;

export interface RuleFlowField extends RuleFlowOption {
  sourceLabel?: string;
  options: readonly RuleFlowOption[];
}

export type RuleFlowOperator = RuleFlowOption;

export interface RuleFlowClause {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export type RuleFlowActionBranch = "matched" | "error";

export type RuleFlowActionPhase = "before-upstream" | "after-response";

export interface RuleFlowActionField {
  /** Stable key persisted under RuleFlowAction.config. */
  key: string;
  label?: string;
  control: "select" | "input";
  placeholder?: string;
  options?: readonly RuleFlowOption[];
  /** Short connective copy rendered immediately before the control. */
  prefix?: string;
}

export interface RuleFlowActionOption extends RuleFlowOption {
  branches?: readonly RuleFlowActionBranch[];
  /** Determines which execution stage owns the action and its sort order. */
  phase?: RuleFlowActionPhase;
  fields?: readonly RuleFlowActionField[];
}

export type RuleFlowExceptionGroup =
  | "matched-result"
  | "execution-failure";

export type RuleFlowExceptionResultColor =
  | "red"
  | "cyan"
  | "green"
  | "gray";

export interface RuleFlowExceptionPolicyOption extends RuleFlowActionOption {
  /** Semantic section rendered inside the exception-handling card. */
  group: RuleFlowExceptionGroup;
  /** Text outcome shown alongside the triggering situation. */
  resultLabel: string;
  /** Categorical color for the visible result badge. */
  resultColor: RuleFlowExceptionResultColor;
  fields: readonly RuleFlowActionField[];
}

export interface RuleFlowTrigger {
  type: string;
  config?: Readonly<Record<string, unknown>>;
}

export interface RuleFlowAction {
  id: string;
  type: string;
  config?: Readonly<Record<string, unknown>>;
}

export interface RuleFlowOutcomes {
  matched: readonly RuleFlowAction[];
  unmatched: { behavior: "skip-rule" };
  error: readonly RuleFlowAction[];
}

export interface RuleFlowLayout {
  nodePositions: Readonly<Record<string, RuleFlowPosition>>;
}

export interface RuleFlowValue {
  trigger: RuleFlowTrigger | null;
  conditions: readonly RuleFlowClause[];
  conditionMatch: "all";
  outcomes: RuleFlowOutcomes;
  layout?: RuleFlowLayout;
}

export interface RuleFlowEditorLabels {
  ariaLabel: string;
  trigger: string;
  condition: string;
  matchedAction: string;
  unmatched: string;
  errorAction: string;
  field: string;
  operator: string;
  value: string;
  when: string;
  and: string;
  chooseTrigger: string;
  chooseTriggerDescription: string;
  matchAllConditions: string;
  conditionsDescription: string;
  matchedActionsDescription: string;
  emptyMatchedActions: string;
  actionPhaseDivider: string;
  matchedResults: string;
  executionFailures: string;
  exceptionPoliciesDescription: (configured: number, total: number) => string;
  chooseTriggerFirst: string;
  addCondition: string;
  removeCondition: string;
  addMatchedAction: string;
  showErrorBranch: string;
  removeAction: string;
  skipRule: string;
  skipRuleDescription: string;
  matchedBranch: string;
  unmatchedBranch: string;
  errorBranch: string;
  moveNode: (title: string) => string;
  selectNode: (title: string) => string;
}
