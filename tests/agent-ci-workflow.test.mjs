import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { parseCiPreparationArgs, prepareAgentCiInput, ciInstallationConfigPath } from "../scripts/prepare-agent-ci-input.mjs";

const policy = JSON.parse(await readFile("docs/agent-data/ci-trust.json", "utf8"));
const workflow = parse(await readFile(policy.workflowPath, "utf8"));
let parent;
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-ci-workflow-check-")); });
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

describe("workflow to CI policy and producer integration", () => {
  it("restricts the secret-using execution chain to the fixed manually dispatched source", () => {
    expect(workflow.name).toBe(policy.workflowName); expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    expect(workflow.jobs.prepare.if).toBe("github.repository == 'Carlosfengv/zeron-ui' && github.ref == 'refs/heads/main'");
    expect(workflow.permissions).toEqual({ contents: "read", actions: "read" });
    expect(workflow.concurrency["cancel-in-progress"]).toBe(false);
    expect(ciInstallationConfigPath).toBe("docs/agent-data/installation-config.json");
    for (const job of Object.values(workflow.jobs)) {
      expect(job["runs-on"]).toBe("ubuntu-24.04");
      for (const step of job.steps.filter(step => step.uses)) expect(step.uses).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/);
      const checkout = job.steps.find(step => step.uses?.startsWith("actions/checkout@"));
      expect(checkout.with).toEqual({ "fetch-depth": 0, "persist-credentials": false });
      expect(job.steps.some(step => step.run?.includes("pnpm install --frozen-lockfile"))).toBe(true);
    }
  });
  it.each(["consumer", "examples"])("binds %s producer and archive identity to the strict policy", role => {
    const job = workflow.jobs[role], execute = job.steps.find(step => step.name === policy.jobs[role].executeStep), check = job.steps.find(step => step.name === policy.jobs[role].archiveCheckStep), upload = job.steps.find(step => step.name === policy.jobs[role].uploadStep);
    expect(job.name).toBe(policy.jobs[role].name); expect(job.needs).toBe("prepare");
    expect(job.environment).toBe("agent-artifact-publication");
    expect(job.steps.indexOf(execute)).toBeLessThan(job.steps.indexOf(check)); expect(job.steps.indexOf(check)).toBeLessThan(job.steps.indexOf(upload));
    expect(execute.run).toContain(role === "consumer" ? "pnpm test:consumer:published" : "pnpm test:examples:published");
    expect(execute.run).toContain("--publish-evidence"); expect(execute.run).not.toMatch(/--(?:mock|skip|import-pass)/);
    expect(execute.id).toBe("execute"); expect(check.id).toBe("archive-check"); expect(check.if).toBe("always()");
    expect(check.env.EXECUTION_OUTCOME).toBe("${{ steps.execute.outcome }}");
    expect(check.run).toContain("node scripts/check-agent-ci-archive.mjs"); expect(check.run).toContain(`--role ${role}`);
    expect(check.run).toContain(`--stage "$RUNNER_TEMP/${role === "consumer" ? "consumer" : "example"}-public-archive"`);
    expect(check["continue-on-error"]).toBeUndefined();
    expect(upload.if).toBe("always() && steps.archive-check.outcome == 'success'"); expect(upload.with["include-hidden-files"]).toBe(true);
    expect(upload.with.path).toBe(`\${{ runner.temp }}/${role === "consumer" ? "consumer" : "example"}-public-archive`);
    expect(upload.with.name).toBe(`${policy.jobs[role].artifactPrefix}-\${{ github.run_id }}-\${{ github.run_attempt }}`);
    expect(upload.with["retention-days"]).toBe(90); expect(upload.with["if-no-files-found"]).toBe("error");
    const download = job.steps.find(step => step.uses?.startsWith("actions/download-artifact@"));
    expect(download.with["artifact-ids"]).toBe("${{ needs.prepare.outputs.artifact-id }}"); expect(download.with["merge-multiple"]).toBe(true);
    expect(download.with.name).toBeUndefined();
    const transfer = job.steps.find(step => step.name === "Verify installation input transport bytes");
    expect(transfer.env).toEqual({ INPUT_SHA256: "${{ needs.prepare.outputs.input-sha256 }}", INPUT_BYTES: "${{ needs.prepare.outputs.input-bytes }}" });
    expect(job.steps.indexOf(transfer)).toBeLessThan(job.steps.indexOf(execute));
    expect(job.steps.filter(step => Object.keys(step.env ?? {}).some(name => name.includes("TOKEN")))).toEqual([execute, check]);
  });
  it("keeps the input preparation job independent of installation success and Blob credentials", () => {
    const job = workflow.jobs.prepare;
    expect(job.steps.some(step => step.run?.includes("prepare-agent-ci-input.mjs"))).toBe(true);
    expect(job.steps.some(step => /(?:test:consumer:published|test:examples:published|--upload)/.test(step.run ?? ""))).toBe(false);
    expect(job.steps.some(step => Object.keys(step.env ?? {}).some(name => name.includes("TOKEN")))).toBe(false);
    expect(job.outputs["artifact-id"]).toBe("${{ steps.input-artifact.outputs.artifact-id }}");
    expect(job.outputs["input-sha256"]).toBe("${{ steps.prepare.outputs.input-sha256 }}");
    expect(workflow.jobs.examples.steps.some(step => step.run === "pnpm exec playwright install --with-deps chromium-headless-shell")).toBe(true);
  });
  it("refuses user-selected configuration, unsafe release IDs and injected output lines", () => {
    const output = path.join(parent, "fresh");
    expect(parseCiPreparationArgs(["--release-id", "registry-1", "--output", output])).toEqual({ releaseId: "registry-1", output });
    for (const args of [["--release-id", "../escape", "--output", output], ["--release-id", "x", "--output", "dir\ninput-file=evil"],
      ["--release-id", "x", "--config", "external.json"], ["--release-id", "x", "--output", output, "--skip", "yes"]]) {
      expect(() => parseCiPreparationArgs(args)).toThrow("CI_PREPARE_ARGUMENTS");
    }
  });
  it("cannot prepare outside the controlled source/runtime and never creates a pass", async () => {
    const output = path.join(parent, "refused"), fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("must never fetch"); });
    vi.stubEnv("GITHUB_ACTIONS", "false");
    try {
      let code; try { await prepareAgentCiInput(["--release-id", "unpublished", "--output", output]); } catch (error) { code = error.code; }
      expect(["CI_PREPARE_RUNTIME", "DIRTY_SOURCE", "CI_PREPARE_WORKFLOW"]).toContain(code); expect(fetcher).not.toHaveBeenCalled();
      const report = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8")); expect(report.status).toBe("failed");
      expect(await readdir(output)).toEqual(["failure.json"]);
    } finally { fetcher.mockRestore(); vi.unstubAllEnvs(); }
  });
});
