import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type {
  AiGatewaySidebarActions,
  AiGatewaySidebarOptions,
} from "../ai-gateway-workspace-types";

export type {
  AiGatewaySidebarActions,
  AiGatewaySidebarConfig,
  AiGatewaySidebarIdentity,
  AiGatewaySidebarNavigationGroup,
  AiGatewaySidebarNavigationItem,
  AiGatewaySidebarOptions,
} from "../ai-gateway-workspace-types";

export type AiGatewaySessionOutcome = "succeeded" | "failed";

export type AiGatewaySessionListStatus =
  | "ready"
  | "loading"
  | "refreshing"
  | "error";

export interface AiGatewaySessionEntity {
  /** Stable backend identifier used by filters and routes. */
  id: string;
  /** Human-readable value rendered in the table. */
  label: string;
}

export interface AiGatewaySessionModel extends AiGatewaySessionEntity {
  /** Stable provider key used for logo resolution, for example `deepseek` or `openai`. */
  provider?: string;
}

export interface AiGatewaySessionDateTimeContext {
  locale: string;
  timeZone: string;
  unavailable: string;
}

export type AiGatewaySessionDateTimeFormatter = (
  value: string,
  context: AiGatewaySessionDateTimeContext,
) => string;

export interface AiGatewaySessionItem {
  /** Stable session identifier. It is also the display fallback when traceName is absent. */
  id: string;
  /** Optional trace-derived title shown as the primary session label. */
  traceName: string | null;
  /** Overall session result; the list communicates it with both color and accessible text. */
  outcome: AiGatewaySessionOutcome;
  agent: AiGatewaySessionEntity | null;
  user: AiGatewaySessionEntity | null;
  model: AiGatewaySessionModel | null;
  customer: AiGatewaySessionEntity | null;
  turnCount: number;
  inputTokens: number;
  outputTokens: number;
  /** Integer millionths of the response currency. */
  costMicros: number;
  /** ISO 8601 UTC timestamp. */
  lastActiveAt: string;
  /** ISO 8601 UTC timestamp recording when the session was created. */
  createdAt: string;
}

export interface AiGatewaySessionFilterOption extends AiGatewaySessionEntity {
  count: number;
}

export interface AiGatewaySessionFacets {
  agents: readonly AiGatewaySessionFilterOption[];
  users: readonly AiGatewaySessionFilterOption[];
  models: readonly AiGatewaySessionFilterOption[];
}

export interface AiGatewaySessionListData {
  items: readonly AiGatewaySessionItem[];
  /** Total matches before pagination, after applying the current query. */
  total: number;
  currency: string;
  /** ISO 8601 UTC timestamp for the returned snapshot. */
  generatedAt: string;
  facets: AiGatewaySessionFacets;
}

export interface AiGatewaySessionListQuery {
  search: string;
  agentId: string | null;
  userId: string | null;
  modelId: string | null;
  errorsOnly: boolean;
  pageIndex: number;
  pageSize: number;
}

export interface AiGatewaySessionListLabels {
  title: string;
  description: string;
  ariaLabel: string;
  toolbarAriaLabel: string;
  searchPlaceholder: string;
  allAgents: string;
  allUsers: string;
  allModels: string;
  errorsOnly: string;
  session: string;
  agent: string;
  model: string;
  customer: string;
  turns: string;
  tokens: string;
  cost: string;
  createdAt: string;
  noModelCall: string;
  unavailable: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  retry: string;
  succeeded: string;
  failed: string;
  filteredEmptyTitle: string;
  filteredEmptyDescription: string;
  clearFilters: string;
  loadingMessage: string;
  sidebarTriggerLabel: string;
  currentLocationAriaLabel: string;
  rowsPerPage: string;
  pageSummary: (page: number, pageCount: number) => string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
}

export interface AiGatewaySessionListActions extends AiGatewaySidebarActions {
  onQueryChange?: (query: AiGatewaySessionListQuery) => void;
  onSessionOpen?: (session: AiGatewaySessionItem) => void;
  onRetry?: () => void;
}

export interface AiGatewaySessionListProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  data: AiGatewaySessionListData | null;
  query: AiGatewaySessionListQuery;
  status?: AiGatewaySessionListStatus;
  error?: string;
  labels?: Partial<AiGatewaySessionListLabels>;
  /** Overrides the default `YYYY年 M月D日 HH:mm:ss` absolute-time display. */
  dateTimeFormatter?: AiGatewaySessionDateTimeFormatter;
  /** Resolves a product-specific model logo before falling back to the built-in provider mapping. */
  renderModelLogo?: (model: AiGatewaySessionModel) => ReactNode;
  actions?: AiGatewaySessionListActions;
  locale?: string;
  timeZone?: string;
  /** Reference time used by relative last-active labels. Defaults to the current time. */
  now?: string | number | Date;
  /** Shared AI Gateway navigation. Pass false when the host already owns the same shell. */
  sidebar?: AiGatewaySidebarOptions | false;
}
