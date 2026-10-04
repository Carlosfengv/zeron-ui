import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { zipSync } from "fflate";
import { releaseFixture } from "./agent-release-fixture.mjs";
import { loadAgentSchema } from "../../scripts/load-agent-schema.mjs";
import { ciArtifactName, ciTrustPath } from "../../scripts/agent-ci-contract.mjs";
import { executionIndexSchema, executionRoles } from "../../scripts/agent-execution-index.mjs";
import { consumerEvidenceSchema } from "../../scripts/published-consumer-evidence.mjs";
import { serialize, sha256 } from "../../scripts/agent-utils.mjs";

const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const buffer = value => Buffer.from(serialize(value));

// All platform responses, logs, success declarations and PNGs are synthetic contract fixtures.
// This helper does not run the official CLI, browser, GitHub, Blob, or a production entry point.
export async function ciEvidenceFixture(directory) {
  const publicObjects = new Map(), fixture = await releaseFixture({ directory, label: "a", objects: publicObjects,
    schemas: await loadAgentSchema(), includeExamples: true });
  const prepared = fixture.examples.prepared;
  prepared.registry = { manifest: fixture.registry.manifest };
  prepared.scope = { ...prepared.scope, staticCheckedItems: fixture.verification.registry.staticCheckedItems,
    matrices: fixture.verification.matrices.map(({ evidence: _ref, ...matrix }) => matrix) };
  const policy = JSON.parse(await readFile(ciTrustPath, "utf8"));
  const workflow = Buffer.from("name: Agent release validation\non: workflow_dispatch\n# synthetic source fixture\n");
  const sourceFiles = new Map([[ciTrustPath, buffer(policy)], [policy.workflowPath, workflow]]);
  for (const filename of Object.values(executionRoles).flatMap(value => [value.producer, value.worker]).filter(Boolean)) sourceFiles.set(filename, await readFile(filename));
  const locator = { schemaVersion: 1, consumer: { runId: 101, runAttempt: 2, jobId: 201, artifactId: 301 },
    examples: { runId: 101, runAttempt: 2, jobId: 202, artifactId: 302 } };
  const files = {}, archives = {}, artifacts = {}, jobs = [], metadata = new Map(), requests = [];
  const base = `/repos/${policy.repository}`, revision = prepared.input.source.sourceRevision;
  metadata.set(base, { id: 17, full_name: policy.repository });
  metadata.set(`${base}/branches/main`, { name: "main", protected: true, commit: { sha: revision } });
  metadata.set(`${base}/compare/${revision}...${revision}`, { status: "identical", merge_base_commit: { sha: revision } });
  metadata.set(`${base}/rules/branches/main?per_page=100&page=1`, []);
  metadata.set(`${base}/branches/main/protection`, { enforce_admins: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } });
  metadata.set(`${base}/environments/agent-artifact-publication`, { id: 18, name: "agent-artifact-publication", url: `https://api.github.com${base}/environments/agent-artifact-publication`,
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }, protection_rules: [{ id: 19, type: "branch_policy" }] });
  metadata.set(`${base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`, { total_count: 1, branch_policies: [{ id: 20, name: "main", type: "branch" }] });
  metadata.set(`${base}/actions/workflows/agent-release-validation.yml`, { id: 13, name: policy.workflowName, path: policy.workflowPath, state: "active" });
  metadata.set(`${base}/contents/${policy.workflowPath}?ref=${revision}`, { type: "file", path: policy.workflowPath, encoding: "base64", size: workflow.length,
    content: workflow.toString("base64"), sha: createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${workflow.length}\0`), workflow])).digest("hex") });
  metadata.set(`${base}/actions/runs/101/attempts/2`, { id: 101, run_attempt: 2, workflow_id: 13, name: policy.workflowName, path: `${policy.workflowPath}@main`,
    head_sha: revision, head_branch: "main", event: "workflow_dispatch", status: "completed", conclusion: "success",
    repository: { id: 17, full_name: policy.repository }, head_repository: { id: 17, full_name: policy.repository } });

  for (const role of ["consumer", "examples"]) {
    const report = structuredClone(role === "consumer" ? fixture.verification : fixture.examples.verification), map = new Map(), publicAttachments = [];
    if (role === "consumer") {
      for (const row of report.matrices) {
        row.packageManagerVersion = row.packageManager === "npm" ? "10.9.2" : "10.12.4";
        const { evidence: _ref, ...matrix } = row;
        const evidence = consumerEvidenceSchema.parse({ schemaVersion: 1, kind: "published-consumer-evidence", scope: "actual-official-cli-and-final-registry-installation",
          source: prepared.input.source, inputSha256: sha256(serialize(prepared.input)), cli: report.cli,
          registry: { releaseId: prepared.input.registry.releaseId, manifest: prepared.input.registry.manifest }, matrix,
          templateSha256: "1".repeat(64), initialLockfileSha256: "2".repeat(64), finalLockfileSha256: "3".repeat(64), cliOwnFilesSha256: "4".repeat(64),
          finalProjectSha256: "5".repeat(64), businessSourcePreserved: true, themeInstalled: true, compiledTheme: true,
          nextOnlyRejection: row.framework === "vite" ? { item: prepared.input.nextOnlyRejectionItem, reason: "requires-next", unchanged: true } : null });
        const bytes = buffer(evidence), path = `${row.framework}-${row.packageManager}.evidence.json`;
        row.evidence = { url: `${prepared.input.artifactBaseUrl}/evidence/consumer/${sha256(bytes)}.json`, bytes: bytes.length, sha256: sha256(bytes) };
        publicAttachments.push({ ...row.evidence, path }); map.set(path, bytes); publicObjects.set(row.evidence.url, bytes);
      }
    } else for (const [url, bytes] of fixture.examples.attachments) {
      const path = `attachments/${new URL(url).pathname.split("/").at(-1)}`;
      publicAttachments.push({ url, ...descriptor(path, bytes) }); map.set(path, bytes);
    }
    const log = (path, step, manager = "npm", exitCode = 0) => map.set(path, buffer({ step, file: manager,
      args: ["types", "build"].includes(step) ? ["run", step] : ["fixture"], exitCode, code: null,
      stdout: step === "next-only-rejection" ? "login-01 requires Next.js" : "synthetic test output", stderr: "" }));
    log("private-logs/reference-manager-version.json", "reference-manager-version"); log("private-logs/cli-reference.json", "cli-reference");
    for (const profile of prepared.input.matrices) {
      const key = `${profile.framework}-${profile.packageManager}`, dir = `private-logs/${key}`;
      for (const step of ["manager-version", "bootstrap", "cli-version", "dry-run", "install", "types", "build"]) log(`${dir}/${step}.json`, step, profile.packageManager);
      if (profile.framework === "vite") log(`${dir}/next-only-rejection.json`, "next-only-rejection", profile.packageManager, 1);
      if (role === "examples") {
        log(`${dir}/browser-process.json`, "browser"); map.set(`${dir}/preview.json`, buffer({ scope: "synthetic-preview" }));
        map.set(`${key}-browser/observations.json`, buffer({ scope: "synthetic-observations" }));
      }
    }
    const definition = executionRoles[role]; map.set(definition.report, buffer(report));
    const index = executionIndexSchema.parse({ schemaVersion: 1, kind: "agent-release-execution-index", scope: "archive-byte-binding-not-a-trusted-ci-attestation",
      role, resultKind: "published", source: prepared.input.source, inputSha256: sha256(serialize(prepared.input)), report: descriptor(definition.report, map.get(definition.report)),
      producer: descriptor(definition.producer, sourceFiles.get(definition.producer)), worker: definition.worker ? descriptor(definition.worker, sourceFiles.get(definition.worker)) : null,
      workflowLocator: { repository: policy.repository, workflowRef: `${policy.repository}/${policy.workflowPath}@refs/heads/main`,
        runId: 101, runAttempt: 2, headSha: revision }, outputFiles: [...map].sort(([a], [b]) => a.localeCompare(b, "en")).map(([path, bytes]) => descriptor(path, bytes)),
      publicAttachments: publicAttachments.sort((a, b) => a.url.localeCompare(b.url, "en")) });
    map.set("execution-index.json", buffer(index)); files[role] = map;
    const job = { id: locator[role].jobId, run_id: 101, head_sha: revision, head_branch: "main", workflow_name: policy.workflowName, name: policy.jobs[role].name,
      status: "completed", conclusion: "success", started_at: "2020-01-01T00:00:00Z", completed_at: "2020-01-01T00:02:00Z", labels: ["ubuntu-24.04"],
      steps: [{ name: policy.jobs[role].executeStep, number: 2, status: "completed", conclusion: "success", started_at: "2020-01-01T00:00:01Z", completed_at: "2020-01-01T00:01:00Z" },
        { name: policy.jobs[role].archiveCheckStep, number: 3, status: "completed", conclusion: "success", started_at: "2020-01-01T00:01:00Z", completed_at: "2020-01-01T00:01:01Z" },
        { name: policy.jobs[role].uploadStep, number: 4, status: "completed", conclusion: "success", started_at: "2020-01-01T00:01:01Z", completed_at: "2020-01-01T00:01:30Z" }] };
    jobs.push(job);
    artifacts[role] = { id: locator[role].artifactId, name: ciArtifactName(policy, role, locator[role]), expired: false, created_at: "2020-01-01T00:01:10Z",
      updated_at: "2020-01-01T00:01:30Z", expires_at: "2099-01-01T00:00:00Z", workflow_run: { id: 101, repository_id: 17, head_repository_id: 17, head_branch: "main", head_sha: revision } };
    metadata.set(`${base}/actions/artifacts/${locator[role].artifactId}`, artifacts[role]);
  }
  metadata.set(`${base}/actions/runs/101/attempts/2/jobs?per_page=100&page=1`, { total_count: 2, jobs });
  metadata.set(`${base}/actions/runs/101/artifacts?per_page=100&page=1`, { total_count: 2, artifacts: Object.values(artifacts) });
  const refresh = role => {
    archives[role] = Buffer.from(zipSync(Object.fromEntries([...files[role]].map(([name, bytes]) => [name, [bytes, { mtime: new Date(2020, 0, 1) }]]))));
    artifacts[role].size_in_bytes = archives[role].length; artifacts[role].digest = `sha256:${sha256(archives[role])}`;
  };
  refresh("consumer"); refresh("examples");
  const fetcher = async (url, init) => {
    requests.push({ url, init }); const parsed = new URL(url);
    if (parsed.origin === "https://api.github.com") {
      const role = Object.keys(locator).find(role => locator[role].artifactId && parsed.pathname === `${base}/actions/artifacts/${locator[role].artifactId}/zip`);
      if (role) return new Response(null, { status: 302, headers: { location: `https://fixture.actions.githubusercontent.com/${role}.zip?fixture-signature=opaque` } });
      const value = metadata.get(parsed.pathname + parsed.search);
      if (value === undefined) return new Response(null, { status: 404 });
      return Response.json(value);
    }
    if (parsed.origin === "https://fixture.actions.githubusercontent.com") return new Response(archives[parsed.pathname.slice(1, -4)]);
    const bytes = publicObjects.get(url); return bytes ? new Response(bytes) : new Response(null, { status: 404 });
  };
  return { context: { prepared, sources: fixture.examples.sources, locator, policy, sourceFiles }, fetcher, files, archives, artifacts, jobs, metadata, publicObjects, requests, refresh, base };
}
