import bundle from "@docs/generated/agent-runtime/bundle.json";
import { runtimeSchema, type AgentRuntime } from "./schema";

function freeze(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}

export function loadSnapshots(input: { currentVersion: string; versions: unknown[] }): { currentVersion: string; versions: AgentRuntime[] } {
  const versions = input.versions.map((runtime) => runtimeSchema.parse(runtime));
  if (versions.length > 3 || new Set(versions.map((entry) => entry.catalog.catalogVersion)).size !== versions.length || !versions.some((entry) => entry.catalog.catalogVersion === input.currentVersion)) {
    throw new Error("Invalid runtime version selection");
  }
  const snapshots = { currentVersion: input.currentVersion, versions };
  freeze(snapshots);
  return snapshots;
}

export const snapshots = loadSnapshots(bundle);
