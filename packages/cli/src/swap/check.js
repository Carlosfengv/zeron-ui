import { scanProject } from "./scan.js";
import { hash, isWithin, readProjectFile } from "./project.js";
import { validatePlan, verifyEvidence } from "./state.js";

const requiredChecks = ["typecheck", "build", "behavior", "visual", "contract", "provenance", "cleanup", "scope-review"];
const unwaivable = new Set(["compatibility", "unsupported-project", "unsupported-router", "config", "parse"]);

export async function checkMigration(cwd, plan) {
  const diagnostics = validatePlan(plan).map((detail) => ({ severity: "failed", code: "invalid-plan", detail }));
  if (diagnostics.length) return { staticStatus: "failed", completionStatus: "partial", diagnostics, exitCode: 1 };
  const scan = await scanProject(cwd);
  const add = (severity, code, detail) => diagnostics.push({ severity, code, detail });
  const inScope = (file) => plan.scope.roots.some((root) => isWithin(file, root));
  const exceptionIds = new Set();
  for (const exception of plan.exceptions) {
    if (!plan.mappings.some((m) => m.id === exception.mappingId) || !await verifyEvidence(cwd, exception.acceptance)) {
      add("failed", "invalid-exception", exception.mappingId);
    } else exceptionIds.add(exception.mappingId);
  }
  if (!await verifyEvidence(cwd, plan.baseline.evidence)) add("unchecked", "baseline", "Missing or changed initial scope/baseline evidence");
  for (const root of plan.scope.roots) if (!Object.keys(scan.files).some((file) => isWithin(file, root))) add("failed", "empty-scope", root);
  for (const file of plan.scope.routes) {
    if (!inScope(file) || !scan.files[file]) add("failed", "missing-route", file);
  }
  for (const file of scan.routes.filter(inScope)) if (!plan.scope.routes.includes(file)) add("unchecked", "untracked-route", file);
  for (const [file, expected] of Object.entries(plan.managedFiles)) {
    try {
      if (hash(await readProjectFile(cwd, file)) !== expected) add("failed", "managed-drift", file);
    } catch { add("failed", "managed-missing", file); }
  }
  for (const unknown of scan.unknowns) {
    const resolution = plan.unknownResolutions.find((entry) => entry.id === unknown.id);
    if (unwaivable.has(unknown.code) || !resolution || !await verifyEvidence(cwd, resolution.evidence)) add("unchecked", unknown.code, `${unknown.file}:${unknown.line} ${unknown.detail}`);
  }
  for (const mapping of plan.mappings) {
    const accepted = exceptionIds.has(mapping.id);
    if (!accepted && (mapping.state !== "verified" || mapping.strategy === "gap" || !mapping.targets.length)) add("unchecked", "mapping-pending", mapping.id);
    const residuals = [];
    // Report shared consumers separately; scoped migration must not rewrite them.
    for (const edge of scan.imports) {
      if (mapping.source.modules.some((name) => edge.specifier === name || edge.specifier.startsWith(`${name}/`))) {
        if (inScope(edge.file)) residuals.push(`${edge.file}:${edge.line} imports ${edge.specifier}`);
        else add("info", "shared-consumer", `${edge.file}:${edge.line} still imports ${edge.specifier}; retain its dependencies outside this scope`);
      }
    }
    if (inScope("package.json")) for (const name of mapping.source.modules) if (scan.project.dependencies[name]) residuals.push(`Old direct dependency: ${name}`);
    for (const style of scan.styles.filter((entry) => inScope(entry.file))) {
      for (const specifier of style.imports) if (mapping.source.modules.some((name) => specifier === name || specifier.startsWith(`${name}/`))) residuals.push(`${style.file} imports old stylesheet ${specifier}`);
    }
    for (const file of mapping.source.files) {
      if (!scan.files[file]) continue;
      const usedInScope = scan.imports.some((edge) => inScope(edge.file) && edge.resolved === file);
      if (!inScope(file) && !usedInScope) { add("info", "shared-file", file); continue; }
      const replaced = plan.managedFiles[file] === scan.files[file] && plan.baseline.files[file] && plan.baseline.files[file] !== scan.files[file];
      if (!replaced) residuals.push(`Old implementation exists: ${file}`);
    }
    for (const [file, text] of scan.contents) {
      if (!inScope(file)) continue;
      for (const marker of mapping.source.text) if (text.includes(marker)) residuals.push(`${file} contains ${marker}`);
    }
    if (residuals.length) add(accepted ? "exception" : "failed", "residual", `${mapping.id}: ${residuals.join("; ")}`);
  }
  for (const kind of requiredChecks) {
    const check = plan.checks.find((entry) => entry.kind === kind);
    if (!check || check.status === "unchecked") add("unchecked", "check-missing", kind);
    else if (check.status === "failed") add("failed", "check-failed", kind);
    else if (check.snapshot !== scan.snapshot || !await verifyEvidence(cwd, check.evidence)) add("unchecked", "check-stale", kind);
  }
  for (const batch of plan.batches) {
    if (!["verified", "restored"].includes(batch.status)) add("unchecked", "batch-pending", batch.id);
    for (const file of batch.files) {
      const expected = batch.status === "restored" ? file.before : file.after;
      let actual = null;
      try { actual = hash(await readProjectFile(cwd, file.path)); } catch (error) {
        if (error.code !== "ENOENT") { add("failed", "batch-unreadable", file.path); continue; }
      }
      // Earlier batches may be superseded by a later recorded batch.
      const later = plan.batches.slice(plan.batches.indexOf(batch) + 1).some((b) => b.files.some((f) => f.path === file.path));
      if (!later && actual !== expected) add("unchecked", "batch-drift", file.path);
    }
  }
  // The declared workflow state is a gate, never proof of completion. Keep this
  // command read-only so a passing scan cannot silently close unfinished work.
  if (plan.status !== "complete") {
    add("unchecked", "plan-incomplete", `Plan declares status=${plan.status}. Reconcile remaining work, adapter exits and scope-wide evidence before declaring complete; accepted exceptions must be recorded separately.`);
  } else if (diagnostics.some((d) => d.severity === "failed" || d.severity === "unchecked")) {
    add("unchecked", "plan-status-conflict", "Plan declares complete but verification found failed or unchecked work. Resolve the diagnostics or update the plan and report to partial; the complete label does not waive any gate.");
  }
  const failed = diagnostics.some((d) => d.severity === "failed");
  const unchecked = diagnostics.some((d) => d.severity === "unchecked");
  return {
    staticStatus: failed ? "failed" : unchecked ? "unchecked" : "passed",
    completionStatus: failed || unchecked ? "partial" : exceptionIds.size ? "with-exceptions" : "complete",
    evidenceTrust: "Recorded evidence is checked for existence and freshness, not independently certified business equivalence.",
    snapshot: scan.snapshot,
    counts: { routes: plan.scope.routes.length, mappings: plan.mappings.length, verified: plan.mappings.filter((m) => m.state === "verified" && m.strategy !== "gap" && !exceptionIds.has(m.id)).length, residuals: diagnostics.filter((d) => d.code === "residual").length, unknowns: scan.unknowns.length, exceptions: exceptionIds.size },
    diagnostics,
    exitCode: failed ? 1 : unchecked ? 2 : 0,
  };
}
