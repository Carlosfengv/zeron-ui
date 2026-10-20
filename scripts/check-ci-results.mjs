import path from "node:path";
import { fileURLToPath } from "node:url";

export function checkCiResults(jobs) {
  if (jobs.changes?.result !== "success") throw new Error("CI change detection did not succeed");
  const outputs = jobs.changes.outputs ?? {};
  const keys = ["code", "clean", "consumers", "migrations", "e2e"];
  if (!keys.every(key => ["true", "false"].includes(outputs[key])) ||
      (outputs.code === "false" && keys.slice(1).some(key => outputs[key] === "true"))) {
    throw new Error("Missing or inconsistent CI scope outputs");
  }
  for (const name of ["quality", "e2e", "consumers", "migrations", "agent-clean-checkout"]) {
    const required = outputs[name === "agent-clean-checkout" ? "clean" : name === "quality" ? "code" : name] === "true";
    const expected = required ? "success" : "skipped";
    if (jobs[name]?.result !== expected) throw new Error(`${name}: expected ${expected}, received ${jobs[name]?.result ?? "missing"}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    checkCiResults(JSON.parse(process.env.CI_JOB_RESULTS));
    console.log("All required CI checks passed.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
