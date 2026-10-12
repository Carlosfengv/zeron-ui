import path from "node:path";
import { fileURLToPath } from "node:url";

export function checkCiResults(jobs) {
  if (jobs.changes?.result !== "success") throw new Error("CI change detection did not succeed");
  const { code, clean } = jobs.changes.outputs ?? {};
  if (![code, clean].every(value => ["true", "false"].includes(value)) || (code === "false" && clean === "true")) {
    throw new Error("Missing or inconsistent CI scope outputs");
  }
  for (const name of ["quality", "e2e", "consumers", "migrations", "agent-clean-checkout"]) {
    const required = (name === "agent-clean-checkout" ? clean : code) === "true";
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
