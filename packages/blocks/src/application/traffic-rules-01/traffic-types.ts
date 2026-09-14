export type LimitCondition = {
  id: string;
  field: string;
  operator: string;
  value: string;
};

export type LimitWindow = {
  id: string;
  unit: string;
  count: number;
  burst: number;
};

export type LimitAction = "reject" | "queue" | "reply";

export type GlobalLimit = {
  id: string;
  name: string;
  limitType: string;
  dimension: string;
  conditionLogic: "and" | "or";
  conditions: LimitCondition[];
  windows: LimitWindow[];
  temporaryEnabled: boolean;
  temporaryWindows: LimitWindow[];
  temporaryStart: string;
  temporaryEnd: string;
  action: LimitAction;
  queueSize: number;
  queueWaitMs: number;
  replyContent: string;
  reasonCode: string;
  enabled: boolean;
  order: number;
  code: string;
};
