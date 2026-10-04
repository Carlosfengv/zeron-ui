"use client";

import { useCallback, useState } from "react";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "#components/field";
import { Input } from "#components/input";
import { ResourceDetailLayout } from "#components/resource-detail-layout";
import { ExampleApiError, type ExampleApi, type ResourceDetail, type ResourceQuery } from "../shared/contracts";
import { ExampleError } from "../shared/notices";
import { useLatestRequest } from "../shared/use-latest-request";
import { useSingleSubmit } from "../shared/use-single-submit";

function ResourceEditor({ api, resource, onSaved }: { api: ExampleApi; resource: ResourceDetail; onSaved: () => void }) {
  const [baseline, setBaseline] = useState(resource);
  const [name, setName] = useState(resource.name);
  const [saved, setSaved] = useState(false);
  const [validation, setValidation] = useState("");
  const mutation = useSingleSubmit((input: string, signal) => api.rename(resource.id, input, baseline.revision, signal), result => {
    setBaseline(result); setName(result.name); setSaved(true); onSaved();
  });
  const serverFields = mutation.error instanceof ExampleApiError ? mutation.error.fields : {};
  const blocked = !resource.canEdit || mutation.pending || (mutation.error instanceof ExampleApiError && mutation.error.code === "forbidden");
  const nameError = validation || serverFields.name;
  return <form className="flex min-w-0 flex-col gap-4" noValidate onSubmit={event => {
    event.preventDefault();
    if (blocked || name.trim() === baseline.name) return;
    if (!name.trim() || name.trim().length > 80) { setValidation("Use a name from 1 to 80 characters."); return; }
    setValidation(""); setSaved(false); void mutation.submit(name);
  }}>
    <h2 className="text-body font-medium text-fg-default">Resource configuration</h2>
    <p className="text-body text-fg-muted">{resource.description}</p>
    {!resource.canEdit && <p role="status" className="text-body text-fg-muted">You have read-only access.</p>}
    <Field invalid={Boolean(nameError)}><FieldLabel htmlFor="resource-name">Resource name</FieldLabel><Input id="resource-name" value={name} disabled={blocked} aria-invalid={Boolean(nameError)} onChange={event => { setName(event.target.value); setValidation(""); setSaved(false); mutation.clearError(); }} /><FieldDescription>The name shown in your inventory.</FieldDescription>{nameError && <FieldError match>{nameError}</FieldError>}</Field>
    {Boolean(mutation.error) && <ExampleError error={mutation.error} />}
    {saved && <p role="status" className="text-body text-fg-success">Resource saved.</p>}
    <div className="flex flex-wrap items-center gap-2"><Button type="submit" loading={mutation.pending} disabled={blocked || name.trim() === baseline.name}>Save resource</Button><Button type="button" variant="secondary" disabled={mutation.pending || name === baseline.name} onClick={() => { setName(baseline.name); setValidation(""); setSaved(false); mutation.clearError(); }}>Reset</Button></div>
  </form>;
}

export interface ResourceDetailPageProps { api: ExampleApi; id: string; returnQuery: ResourceQuery; onBack: (query: ResourceQuery) => void }
export function ResourceDetailPage({ api, id, returnQuery, onBack }: ResourceDetailPageProps) {
  const load = useCallback((signal: AbortSignal) => api.detail(id, signal), [api, id]);
  const request = useLatestRequest(id, load);
  const forbidden = request.error instanceof ExampleApiError && request.error.code === "forbidden";
  const missing = request.error instanceof ExampleApiError && request.error.code === "not-found";
  const resource = forbidden || missing ? null : request.data;
  return <ResourceDetailLayout title={resource?.name ?? "Resource details"} description={resource ? `Managed by ${resource.owner}` : "Review resource configuration and access."}
    recordNavigation={<Button variant="ghost" onClick={() => onBack(returnQuery)}>Back to resources</Button>}
    status={resource && <Badge status={resource.status === "active" ? "success" : "warning"}>{resource.status === "active" ? "Active" : "Paused"}</Badge>}>
    {request.loading && !resource && <p role="status">Loading resource</p>}
    {Boolean(request.error) && <ExampleError error={request.error} onRetry={request.reload} />}
    {resource && <ResourceEditor key={resource.id} api={api} resource={resource} onSaved={request.reload} />}
  </ResourceDetailLayout>;
}
