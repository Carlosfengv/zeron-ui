import type { AgentTask } from "./agent-tasks-types";

export const agentTasksDemoData: readonly AgentTask[] = [
  { id: "crm", title: "Clean up duplicate CRM contacts", model: "Haiku 5.5", duration: "2m 41s", status: "failed", events: [
    { id: "duplicates", message: "Found 18 duplicate contacts", time: "3m ago" },
    { id: "failed", message: "CRM connection expired — reconnect to continue", time: "now", current: true },
  ] },
  { id: "migration", title: "Migrate users table to Postgres 17", model: "Opus 5.5", duration: "6m 19s", status: "running", events: [
    { id: "write", message: "Wrote migration 0042_split_users", time: "4m ago" },
    { id: "dry-run", message: "Dry run on staging – no errors", time: "2m ago" },
    { id: "request", message: "Wants to run it on production", time: "1m ago" },
    { id: "approved", message: "Approved by you – running on production", time: "now", current: true },
  ] },
  { id: "review", title: "Review PR #482 – billing webhooks", model: "Sonnet 5.5", duration: "3m 47s", status: "running" },
  { id: "release", title: "Write release notes for v2.4", model: "Sonnet 5.5", duration: "1m 25s", status: "running" },
  { id: "translate", title: "Translate onboarding emails to German", model: "Haiku 5.5", duration: "59s", status: "running" },
  { id: "metrics", title: "Weekly metrics digest", model: "Haiku 5.5", duration: "4m 12s", status: "done" },
  { id: "react", title: "Upgrade React to 19.2", model: "Opus 5.5", duration: "11m 03s", status: "done" },
];
