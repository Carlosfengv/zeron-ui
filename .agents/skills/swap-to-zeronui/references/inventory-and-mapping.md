# Inventory and mapping

Discover the actual installed CLI help. When available:

```sh
zeron-ui swap scan --cwd <app> --json
zeron-ui swap check --cwd <app> --plan .zeron/migrations/<id>/plan.json --json
```

Both commands are read-only. Never redirect scan output over source or an existing plan. Scan exits 2 on incomplete parsing/compatibility; check exits 2 on unchecked evidence, 1 on failures, 0 only when its static/evidence gates pass. Read completionStatus separately: evidence records are user-editable, not independent business certification.

Scan facts include project versions, file hashes, static import/re-export/dynamic-import edges, JSX uses, route candidates and CSS text clues. Unknown dynamic expressions, unsupported routing and spread props require inspection. A native element or a familiar filename is not proof of old UI. Scan traverses the application root, excludes dependency/build/hidden directories, and does not follow source symlinks; omitted linked source is reported. Generated/imported code outside this boundary requires manual scope review.

Use the schema in assets. The CLI package contains the canonical identical schema; the skill copy is checked during distribution tests. All paths are relative to the consumer application, using forward slashes; roots are paths, not globs. `scope.roots` limits the completion area, while the scan still records whole-app facts to expose shared impacts. A whole application uses `["."]`.

- `scope.routes`: actual reviewed route entry files, with representative URL/state detail in the scope-review evidence. Vite routes must be explicitly inventoried here even when scanner has no filesystem convention.
- `scope.digest`: SHA-256 of the JSON encoding of `{roots, routes}` in that order. Freeze it in the baseline report too. This detects accidental edits, not malicious changes to both plan and digest.
- `baseline.files`: hashes before migration. Keep initial unknowns and routes in baseline evidence.
- `source`: pinned CLI version, registry release/base and manifest hash. Keep actual downloaded-source/clean-install proof in provenance evidence.
- `managedFiles`: installed file → hash verified against the same release's clean transformed installation. Never trust a modified consumer file just because its hash was copied here.
- `mappings`: stable id, strategy, state, target Registry names, and source selectors (`modules`, `files`, `text`). Module selectors match package/subpath prefixes; file selectors use exact relative files. Text selectors are exact residual strings, not regex. Explicitly select old tokens/providers not identifiable through imports.
- `unknownResolutions`: scanner diagnostic id, explanation and evidence path/hash. Use only after inspection; unsupported stack/config and parser errors must actually be fixed.
- `checks`: required kind, outcome, current scan snapshot digest and evidence path/hash. Capture evidence after the final source change. Required kinds: typecheck, build, behavior, visual, contract, provenance, cleanup, scope-review. A scan snapshot covers source/config/lockfiles; it is not a dependency integrity attestation.
- `exceptions`: mapping id, rationale and explicit acceptance reference. Resolve critical failures; an exception cannot waive a failed mandatory check.
- `batches`: file-level before/after hashes and recovery reference. Record absence as null and preserve snapshots outside the repository.

Use direct only when APIs and behavior were verified; adapt for props/events/data changes; compose for a new Zeron composition; gap when capability/evidence is absent. Each mapping's evidence should cover callers and product states. Check automatically revisits current source selectors so setting state=verified alone cannot erase an old import.

Managed implementations often contain intentional prop spreads or low-level CSS. Explain diagnostics for verified release files with provenance evidence; do not blanket-ignore a directory of arbitrary custom code. Unknowns outside a scoped migration still need assessment when shared dependencies can affect that region.
