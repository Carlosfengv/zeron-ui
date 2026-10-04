"use client";

import { useCallback, useState } from "react";
import { Button } from "#components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "#components/field";
import { Input } from "#components/input";
import { PageBody, PageContent, PageDescription, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "#components/page-layout";
import { ExampleApiError, validateSettings, type ExampleApi, type Settings, type SettingsInput } from "../shared/contracts";
import { ExampleError } from "../shared/notices";
import { useLatestRequest } from "../shared/use-latest-request";
import { useSingleSubmit } from "../shared/use-single-submit";

function SettingsEditor({ api, initial }: { api: ExampleApi; initial: Settings }) {
  const [baseline, setBaseline] = useState(initial);
  const [email, setEmail] = useState(initial.notificationEmail);
  const [retention, setRetention] = useState(String(initial.retentionDays));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const mutation = useSingleSubmit((input: SettingsInput, signal) => api.saveSettings(input, baseline.revision, signal), result => {
    setBaseline(result); setEmail(result.notificationEmail); setRetention(String(result.retentionDays)); setSaved(true); setErrors({});
  });
  const dirty = email !== baseline.notificationEmail || retention !== String(baseline.retentionDays);
  const blocked = !baseline.canEdit || mutation.pending || (mutation.error instanceof ExampleApiError && mutation.error.code === "forbidden");
  const fieldErrors = { ...(mutation.error instanceof ExampleApiError ? mutation.error.fields : {}), ...errors };
  return <form className="flex min-w-0 flex-col gap-4" noValidate onSubmit={event => {
    event.preventDefault();
    if (!dirty || blocked) return;
    const input = { notificationEmail: email.trim(), retentionDays: Number(retention) };
    const fields = validateSettings(input);
    setErrors(fields); setSaved(false);
    if (!Object.keys(fields).length) void mutation.submit(input);
  }}>
    {!baseline.canEdit && <p role="status" className="text-body text-fg-muted">You have read-only access.</p>}
    <Field invalid={Boolean(fieldErrors.notificationEmail)}><FieldLabel htmlFor="notification-email">Notification email</FieldLabel><Input id="notification-email" type="email" value={email} disabled={blocked} aria-invalid={Boolean(fieldErrors.notificationEmail)} onChange={event => { setEmail(event.target.value); setErrors(current => ({ ...current, notificationEmail: "" })); setSaved(false); mutation.clearError(); }} /><FieldDescription>Operational updates go to this address.</FieldDescription>{fieldErrors.notificationEmail && <FieldError match>{fieldErrors.notificationEmail}</FieldError>}</Field>
    <Field invalid={Boolean(fieldErrors.retentionDays)}><FieldLabel htmlFor="retention-days">Retention days</FieldLabel><Input id="retention-days" type="number" min={1} max={365} step={1} value={retention} disabled={blocked} aria-invalid={Boolean(fieldErrors.retentionDays)} onChange={event => { setRetention(event.target.value); setErrors(current => ({ ...current, retentionDays: "" })); setSaved(false); mutation.clearError(); }} /><FieldDescription>Keep records for 1 to 365 days.</FieldDescription>{fieldErrors.retentionDays && <FieldError match>{fieldErrors.retentionDays}</FieldError>}</Field>
    {Boolean(mutation.error) && <ExampleError error={mutation.error} />}
    <p role="status" className="text-body text-fg-muted">{saved ? "Settings saved." : dirty ? "You have unsaved changes." : "All changes saved."}</p>
    <div className="flex flex-wrap items-center gap-2"><Button type="submit" loading={mutation.pending} disabled={blocked || !dirty}>Save settings</Button><Button type="button" variant="secondary" disabled={mutation.pending || !dirty} onClick={() => { setEmail(baseline.notificationEmail); setRetention(String(baseline.retentionDays)); setErrors({}); setSaved(false); mutation.clearError(); }}>Reset</Button></div>
  </form>;
}

export function SettingsPage({ api }: { api: ExampleApi }) {
  const load = useCallback((signal: AbortSignal) => api.settings(signal), [api]);
  const request = useLatestRequest("settings", load);
  const forbidden = request.error instanceof ExampleApiError && request.error.code === "forbidden";
  return <PageLayout size="md"><PageHeader><PageHeaderContent><div className="min-w-0"><PageTitle>Settings</PageTitle><PageDescription>Manage notification delivery and record retention.</PageDescription></div></PageHeaderContent></PageHeader><PageContent><PageBody>
    {request.loading && !request.data && <p role="status">Loading settings</p>}
    {Boolean(request.error) && <ExampleError error={request.error} onRetry={request.reload} />}
    {!forbidden && request.data && <SettingsEditor key={request.data.revision} api={api} initial={request.data} />}
  </PageBody></PageContent></PageLayout>;
}
