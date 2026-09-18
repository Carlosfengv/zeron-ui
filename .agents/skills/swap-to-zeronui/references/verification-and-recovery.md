# Verification and recovery

Use the project's existing checks, supplemented with focused behavioral cases needed for this migration. A built library repository does not prove a consumer installation works. Run the consumer's typecheck/build and real application interactions.

Inspect every in-scope page and its critical states. Test form validation/submission, stable row selection, server pagination/filter parameters, route links, permissions, asynchronous errors, focus return, Escape and narrow/wide navigation. When supported by the product, verify light/dark theme and portals in both. Screenshots support visual review; they do not establish behavior by themselves.

Design lint is currently a private workspace package. Use it when configured; otherwise document the absence and conduct explicit contract review. Do not suggest npm-installing an unpublished package. Existing mandatory checks cannot be waived by changing plan labels.

Evidence must correspond to the latest scan snapshot and include a readable log, report or screenshot file with a hash. After any relevant code/config/lockfile edit, repeat affected checks and refresh their snapshot. The initial implementation invalidates all snapshot-bound checks conservatively. Store baseline findings separately; do not claim failures passed because they were pre-existing.

Report routes reviewed/total, verified mappings/total and critical flows passed/total. List residual, unknown and exception counts. If the denominator is uncertain, explain the missing scope without a completion percentage.

For recovery retain per-batch original contents outside the project and before/after hashes, including package/lockfile/CSS/install-state. Record which files were absent. Restore only when current hashes still match that batch's output; otherwise merge subsequent user edits. Remove only files created by the batch and unchanged since. Never hard-reset the project. Dependency installation may partially fail; do not assume the installer is transactional or that external effects can be rolled back.

On resume inspect actual files and re-scan. A stale `verified` or `complete` flag is not authority. File snapshots can restore UI changes; unavailable services and framework incompatibility require a precise remaining boundary.
