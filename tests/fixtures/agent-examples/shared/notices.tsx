import { Button } from "#components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#components/empty";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "#components/alert";
import { ExampleApiError } from "./contracts";

export function ExampleError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const code = error instanceof ExampleApiError ? error.code : "unavailable";
  const title = code === "forbidden" ? "Access denied" : code === "not-found" ? "Resource not found" : code === "conflict" ? "Reload required" : "Request failed";
  return <Alert status="danger"><AlertTitle>{title}</AlertTitle><AlertDescription>{error instanceof ExampleApiError ? error.message : "The service could not complete this request. Try again."}</AlertDescription>{onRetry && <AlertAction><Button variant="secondary" onClick={onRetry}>Retry</Button></AlertAction>}</Alert>;
}

export function EmptyResources({ filtered }: { filtered: boolean }) {
  return <Empty reason={filtered ? "no-filter-results" : "no-data"} announce><EmptyHeader><EmptyTitle>{filtered ? "No matching resources" : "No resources"}</EmptyTitle><EmptyDescription>{filtered ? "Try another search or clear your filters." : "Resources will appear here when they become available."}</EmptyDescription></EmptyHeader></Empty>;
}
