import type { AgentRuntime } from "../../lib/agent-catalog/schema";
import { skillTextSelectionPath } from "../../lib/agent-catalog/skill-references.mjs";

/** Explicit test-only references still have to satisfy the runtime allowlist. */
export function addSkillReference(runtime: AgentRuntime, reference: string, text: string) {
  runtime.skills["zeron-page-builder"][reference] = text;
  const policyKey = skillTextSelectionPath.split("/").slice(1).join("/");
  const policyText = runtime.skills["zeron-page-builder"][policyKey];
  if (policyText !== undefined) {
    const policy = JSON.parse(policyText);
    policy.references = [...new Set([...policy.references, `zeron-page-builder/${reference}`])].sort();
    runtime.skills["zeron-page-builder"][policyKey] = JSON.stringify(policy);
  }
}
