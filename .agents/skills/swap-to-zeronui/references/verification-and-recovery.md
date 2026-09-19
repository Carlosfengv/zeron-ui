# Verification and recovery

Use the project's existing checks, supplemented with focused behavioral cases needed for this migration. A built library repository does not prove a consumer installation works. Run the consumer's typecheck/build and real application interactions.

Inspect every in-scope page and its critical states. Test form validation/submission, stable row selection, server pagination/filter parameters, route links, permissions, asynchronous errors, focus return, Escape and narrow/wide navigation. When supported by the product, verify light/dark theme and portals in both. Screenshots support visual review; they do not establish behavior by themselves.

Record four independent dimensions using the paired builder's [verification rules](../../zeron-page-builder/references/verification.md): installation/provenance, functional regression, design contracts and browser verification. The contract check must compare region selections with rendered layout responsibilities, public APIs, retained CSS and adapter exits; preserving API requests is business evidence, not design evidence. Verify DOM/scroll owners against the selected release. Keep mocked-browser and real-backend coverage distinct.

Design lint is currently a private workspace package. Use it when configured; otherwise document the absence and conduct explicit contract review. Do not suggest npm-installing an unpublished package. Existing mandatory checks cannot be waived by changing plan labels.

Evidence must correspond to the latest scan snapshot and include a readable log, report or screenshot file with a hash. After any relevant code/config/lockfile edit, repeat affected checks and refresh their snapshot. The initial implementation invalidates all snapshot-bound checks conservatively. Store baseline findings separately; do not claim failures passed because they were pre-existing.

Report routes reviewed/total, verified mappings/total and critical flows passed/total. List residual, unknown and exception counts. If the denominator is uncertain, explain the missing scope without a completion percentage.

## Reconcile completion

Before binding final evidence, compare the report's remaining-work list against plan mappings and the frozen scope:

- Every retained generic old-API adapter or missing capability inside scope needs a mapping and traceable source selectors. Split completed and unfinished responsibilities; do not mark a broad mapping verified because one resource page passed. Keep real business compositions separate from temporary legacy bridges.
- Each plan check covers its required area across the frozen scope. A subset may have a passing result in the report, but missing required coverage leaves the aggregate check unchecked; a known violation makes it failed. In particular, unaccepted generic adapter residue cannot pass full cleanup, and a known unsatisfied design contract cannot pass contract review. Independent type/build/behavior checks may still pass.
- Keep `status` pending/migrating/partial while required work remains. Only after mappings, coverage, adapter exits and evidence are reconciled may it be declared complete for final checking. With schema version 1, this declaration also covers a finished migration with explicitly accepted divergences; the CLI distinguishes that result as `with-exceptions`. Never change the label alone to clear a diagnostic.
- `plan-incomplete` prevents a non-complete declaration from being silently upgraded; `plan-status-conflict` means a complete declaration disagrees with failed/unchecked verification. Resolve the underlying work or correct the plan and report. Tool fixes that remove false positives do not remove remaining migration obligations.

The CLI cannot infer undisclosed adapters or contradictions in free-form Markdown. Reconcile those manually; valid attachment hashes only establish file integrity. Updating a report requires rebinding its evidence/index hashes, and relevant source changes still require fresh snapshot-bound checks.

These diagnostics describe the updated CLI implementation; older pinned versions may omit them or misclassify Vite directories. Record the actual CLI version and raw output. Apply the same manual reconciliation regardless of version, and do not treat an older CLI's optimistic result as completion evidence. Recheck with a fixed version when available without discarding the original result.

## Bind reports and attachments

`swap check` validates only the directly referenced evidence file's hash. It does not traverse Markdown links or certify their content. When a check relies on separate region maps, template diffs, logs or screenshots, bind all of them in an evidence index and validate it separately. A self-contained evidence file with no supporting attachments can still use a direct plan reference.

1. Finish source changes, capture the final scan snapshot and run the required checks. Write reports with actual outcomes; missing or failed checks stay unchecked/failed.
2. Create a project-relative `.zeron/migrations/<id>/evidence-index.json` with this format (hashes below illustrate structure; compute real file hashes):

```json
{
  "formatVersion": 1,
  "files": [
    { "path": ".zeron/migrations/example/verification.md", "sha256": "<actual SHA-256>" },
    { "path": ".zeron/migrations/example/regions.md", "sha256": "<actual SHA-256>" },
    { "path": "output/playwright/workspace.png", "sha256": "<actual SHA-256>" }
  ]
}
```

List the readable check report and every local attachment used to justify it, including nested report attachments, with paths relative to the application root (not the index directory). Download any external evidence needed for reproducible verification into that root when permitted, or explicitly report it unverified. The index is a flat list, not recursive Markdown discovery: manually reconcile report references against it. Do not include the index itself, `plan.json` that references its hash, or the verifier's output; that would create a circular hash dependency.

3. Run the [bundled read-only verifier](../scripts/verify-evidence.mjs) with Node, substituting actual absolute skill/application paths:

```sh
node /path/to/swap-to-zeronui/scripts/verify-evidence.mjs --cwd /path/to/app --index .zeron/migrations/example/evidence-index.json
```

It exits 0 only when the nonempty index and all listed file hashes are valid; malformed, missing, changed or outside-root entries exit 1. It does not run tests, inspect screenshots, check omitted attachments or establish that the report is truthful.

4. Reference the index's path and SHA-256 in the existing `checks[].evidence` record(s), keeping each check's own status and final scan snapshot. One index may cover multiple checks; report rows must identify which files support each. Preserve baseline evidence separately. No change to the migration plan schema or CLI is needed.
5. Re-run this verifier and the supported `swap check` before handoff or resume. A passing `swap check` without the attachment verification is insufficient for indexed evidence. On mismatch, inspect what changed and repeat affected checks; never simply rehash attachments to erase failures. Relevant source changes require fresh scan-bound checks even if attachments did not change.

Preserve raw CLI outcomes. For a known framework-detection false positive, document the pinned CLI/version, original diagnostic and manual findings separately. It remains a tool failure/unchecked result; do not alter source directories or label it passed to bypass the limitation.

## Recovery and resume

For recovery retain per-batch original contents outside the project and before/after hashes, including package/lockfile/CSS/install-state. Record which files were absent. Restore only when current hashes still match that batch's output; otherwise merge subsequent user edits. Remove only files created by the batch and unchanged since. Never hard-reset the project. Dependency installation may partially fail; do not assume the installer is transactional or that external effects can be rolled back.

On resume inspect actual files and re-scan. A stale `verified` or `complete` flag is not authority. File snapshots can restore UI changes; unavailable services and framework incompatibility require a precise remaining boundary.
