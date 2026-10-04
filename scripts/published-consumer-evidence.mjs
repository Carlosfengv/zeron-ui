import { z } from "zod";
import { installationInputSchema, publishedInstallationVerificationSchema } from "./agent-release-record.mjs";
import { ArtifactDownloadError, downloadArtifact } from "./download-agent-artifact.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const matrixSchema = publishedInstallationVerificationSchema.shape.matrices.element.omit({ evidence: true });
export const consumerEvidenceSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("published-consumer-evidence"),
  scope: z.literal("actual-official-cli-and-final-registry-installation"), source: installationInputSchema.shape.source,
  inputSha256: hash, cli: publishedInstallationVerificationSchema.shape.cli,
  registry: z.object({ releaseId: z.string(), manifest: installationInputSchema.shape.registry.shape.manifest }).strict(),
  matrix: matrixSchema, templateSha256: hash, initialLockfileSha256: hash, finalLockfileSha256: hash,
  cliOwnFilesSha256: hash, finalProjectSha256: hash,
  businessSourcePreserved: z.literal(true), themeInstalled: z.literal(true), compiledTheme: z.literal(true),
  nextOnlyRejection: z.object({ item: installationInputSchema.shape.nextOnlyRejectionItem,
    reason: z.literal("requires-next"), unchanged: z.literal(true) }).strict().nullable(),
}).strict();

export class ConsumerEvidenceError extends Error {
  constructor(code) { super(`Consumer evidence failed: ${code}`); this.code = code; }
}
const same = (left, right) => serialize(left) === serialize(right);

/** Validate the entire batch before exposing any file to a writer. */
export function validateConsumerEvidenceBatch(prepared, completed) {
  const input = installationInputSchema.parse(prepared.input);
  if (!Array.isArray(completed) || completed.length !== 4) throw new ConsumerEvidenceError("EVIDENCE_MATRIX_COUNT");
  const seen = new Set();
  return completed.map(entry => {
    const evidence = consumerEvidenceSchema.parse(entry.evidence);
    const key = `${evidence.matrix.framework}:${evidence.matrix.packageManager}`;
    const scope = prepared.scope.matrices.find(row => `${row.framework}:${row.packageManager}` === key);
    if (seen.has(key) || !scope || !same(evidence.matrix, entry.result)
      || !same(evidence.source, input.source) || evidence.inputSha256 !== sha256(serialize(input))
      || !same(evidence.cli, prepared.npm.cli) || !same(evidence.registry.manifest, input.registry.manifest)
      || evidence.registry.releaseId !== input.registry.releaseId
      || !same(evidence.matrix.testedItems, scope.testedItems) || !same(evidence.matrix.registryClosure, scope.registryClosure)
      || (evidence.matrix.framework === "vite" ? evidence.nextOnlyRejection?.item !== input.nextOnlyRejectionItem : evidence.nextOnlyRejection !== null)) {
      throw new ConsumerEvidenceError("EVIDENCE_INPUT_BINDING");
    }
    seen.add(key);
    const bytes = Buffer.from(serialize(evidence));
    if (bytes.length > 2 * 1024 * 1024) throw new ConsumerEvidenceError("EVIDENCE_SIZE");
    const digest = sha256(bytes);
    return { evidence, bytes, reference: { url: `${input.artifactBaseUrl}/evidence/consumer/${digest}.json`, bytes: bytes.length, sha256: digest } };
  });
}

/** Only fixed content-hash paths are accepted; unknown writes recover by exact anonymous readback. */
export async function publishConsumerEvidence(prepared, completed, { writer, fetcher = fetch,
  timeoutMs = 12000, maxDurationMs = 600000, downloadOptions = {} } = {}) {
  if (typeof writer !== "function" || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000) throw new ConsumerEvidenceError("EVIDENCE_IO_CONFIG");
  const batch = validateConsumerEvidenceBatch(prepared, completed);
  const deadline = Date.now() + maxDurationMs;
  const remaining = () => {
    const ms = deadline - Date.now();
    if (ms <= 0) throw new ConsumerEvidenceError("EVIDENCE_TIMEOUT");
    return ms;
  };
  const references = [];
  for (const item of batch) {
    const readback = allowMissing => downloadArtifact(item.reference.url, { ...downloadOptions,
      origin: prepared.input.artifactBaseUrl, bytes: item.reference.bytes, hash: item.reference.sha256,
      maxBytes: 2 * 1024 * 1024, timeoutMs: Math.min(timeoutMs, remaining()),
      maxDurationMs: Math.min(90000, remaining()), allowMissing, fetcher });
    if (!await readback(true)) {
      const controller = new AbortController();
      let timer;
      let writeFailed = false;
      try {
        const expiry = new Promise((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(new ConsumerEvidenceError("EVIDENCE_WRITE_TIMEOUT")); }, Math.min(timeoutMs, remaining()));
        });
        const result = await Promise.race([writer(new URL(item.reference.url).pathname.slice(1), item.bytes, {
          access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 31536000,
          contentType: "application/json", abortSignal: controller.signal,
        }), expiry]);
        if (result?.url !== item.reference.url) throw new ConsumerEvidenceError("EVIDENCE_UPLOAD_URL");
      } catch (error) {
        if (error.code === "EVIDENCE_UPLOAD_URL") throw error;
        writeFailed = true;
      } finally { clearTimeout(timer); controller.abort(); }
      try { await readback(false); }
      catch (error) {
        if (writeFailed && error instanceof ArtifactDownloadError && error.code === "NOT_FOUND") throw new ConsumerEvidenceError("EVIDENCE_WRITE_NOT_CONFIRMED");
        throw error;
      }
    }
    references.push(item.reference);
  }
  return references;
}

export function assembleConsumerVerification(prepared, completed, references) {
  const batch = validateConsumerEvidenceBatch(prepared, completed);
  if (!Array.isArray(references) || !same(references, batch.map(item => item.reference))) {
    throw new ConsumerEvidenceError("EVIDENCE_REFERENCE_BINDING");
  }
  return publishedInstallationVerificationSchema.parse({ schemaVersion: 1, kind: "published-consumer-verification",
    sourceRevision: prepared.input.source.sourceRevision, cli: prepared.npm.cli,
    registry: { releaseId: prepared.input.registry.releaseId, baseUrl: prepared.registry.manifest.baseUrl,
      manifestSha256: prepared.input.registry.manifest.sha256, staticCheckedItems: prepared.scope.staticCheckedItems },
    matrices: completed.map((entry, index) => ({ ...entry.result, evidence: references[index] })),
  });
}
