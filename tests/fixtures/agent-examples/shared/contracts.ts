export type ResourceStatus = "active" | "paused";
export type ResourceQuery = {
  search: string;
  status: ResourceStatus | "all";
  sort: "name" | "updatedAt";
  direction: "asc" | "desc";
  pageIndex: number;
  pageSize: number;
};
export type Resource = { id: string; name: string; status: ResourceStatus; updatedAt: string; revision: number; canEdit: boolean };
export type ResourcePage = { items: Resource[]; total: number };
export type ResourceDetail = Resource & { description: string; owner: string };
export type SettingsInput = { notificationEmail: string; retentionDays: number };
export type Settings = SettingsInput & { revision: number; canEdit: boolean };
export type ApiErrorCode = "forbidden" | "not-found" | "validation" | "conflict" | "unavailable";

export class ExampleApiError extends Error {
  constructor(readonly code: ApiErrorCode, message: string, readonly fields: Record<string, string> = {}) { super(message); }
}

/** Inject a real service implementing these boundaries; examples do not own HTTP credentials. */
export interface ExampleApi {
  list(query: ResourceQuery, signal: AbortSignal): Promise<ResourcePage>;
  detail(id: string, signal: AbortSignal): Promise<ResourceDetail>;
  rename(id: string, name: string, expectedRevision: number, signal: AbortSignal): Promise<ResourceDetail>;
  settings(signal: AbortSignal): Promise<Settings>;
  saveSettings(input: SettingsInput, expectedRevision: number, signal: AbortSignal): Promise<Settings>;
}

export function validateSettings(input: SettingsInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.notificationEmail)) errors.notificationEmail = "Enter a valid notification email.";
  if (!Number.isSafeInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 365) errors.retentionDays = "Use a whole number from 1 to 365.";
  return errors;
}
