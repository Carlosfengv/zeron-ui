# Component and style reporting

Apply this at the end of each implementation or migration. Establish the explicit task file list before editing, capture a baseline when practical, and refresh the report after final fixes. Include added and affected shared files; list deletions separately. Do not infer the task scope from the entire dirty tree, include unrelated changes, or claim whole-project coverage from a subset.

## Generate repeatable facts

The [bundled reporter](../scripts/usage-report.mjs) produces full JSON details and a short Markdown report with three sections: statistics, components, and issues/explanation. It reads the target project's installed TypeScript and, when configured, ESLint. It does not install dependencies, change policy, or certify component provenance. Use verified installed component roots for consumers with copied Registry sources; their directory names alone do not establish Zeron ownership. Workspace UI/block paths are recognized, but their source/version still needs the normal provenance check.

Run from any directory using the actual absolute skill path and target project path:

```sh
node /path/to/zeron-page-builder/scripts/usage-report.mjs \
  --cwd /path/to/app \
  --file src/pages/Orders.tsx \
  --file src/components/OrderFilters.tsx \
  --output .zeron/reports/orders/before \
  --eslint-config eslint.design.config.mjs
```

After implementation, repeat with the final file list, `--output .zeron/reports/orders/after` and `--baseline .zeron/reports/orders/before.json`. New files without baseline coverage prevent automatic attribution for the scope; review their findings manually. For a migration, place these attachments under `.zeron/migrations/<id>/` and use the migration evidence procedure to bind them.

- Repeat `--file` for each real file; no glob or directory expansion is performed. Record removed files in the manual handoff; do not pass nonexistent files.
- Omit `--eslint-config` if no design checker is configured; report lint as unchecked. The private `@zeron/lint` adapter is not installed by this skill. Use the actual config and inspect its enabled rules and ignored files.
- Use `--tsconfig` for a nonstandard project config. In consumers, repeat `--ui-root` and `--block-root` with verified implementation directories when needed. Trace wrappers manually rather than classifying all business components as library files.
- Use `--help` for arguments. Exit 0 means the report was written; inspect the inventory/lint statuses and coverage. Parser/dependency/configuration failures remain unchecked; reported lint errors remain failed.

The component inventory resolves source declarations through the target TypeScript configuration, including named import aliases, namespace uses and resolvable re-exports. Unused imports and native elements are excluded. A project wrapper is its own component; dependencies are not recursively added to source-use totals. Dynamic/value aliases and unresolved components require manual tracing. Counts are distinct resolved source/export pairs and JSX opening/self-closing occurrences, not mounted instances or calls to `React.createElement`.

Block/UI kinds count component exports from their source files, including exported subcomponents; they are not counts of Registry entries or proof of public package entrypoints. Private helpers in library sources are reported separately as `internal`. Verify public API adoption manually against the selected item and release.

Explicit `var(--name)` references are a lexical inventory, not a validated token vocabulary or a full count of token-derived Tailwind utilities. CSS correctness, custom styles, dynamic expressions and token semantic intent need review. Do not calculate a token compliance percentage from these counts.

Baseline comparison requires matching file coverage, enabled rule options, config path and ESLint version. Findings are matched as a multiset by file/rule/message/source line, so moving a line does not create a new finding, while editing that line does. Missing coverage or no true pre-change baseline leaves attribution unverified. Changes to theme discovery, parser dependencies or external lint inputs may change interpretation even when rule options match; disclose those changes and review attribution manually.

## Complete the explanation

Use the [handoff template](../assets/usage-report-template.md) to deliver only three sections:

1. **Statistics:** one short paragraph with scope, component kinds/JSX uses, errors/warnings and check status. Include baseline comparisons only when verified.
2. **Components:** one grouped list or compact table. Explain significant custom compositions and why a suitable existing alternative was not adopted; ordinary native layout and domain composition are not violations. Source details and every use location stay in JSON.
3. **Issues and explanation:** list actual component/token violations, justified customization and unchecked items, with a location, reason and next action. Show at most ten rows and link remaining details. If none were found, say so within the checked scope and omit the empty table. Mention unavailable checks or untested states briefly.

Review API bypasses, internal overrides, managed-file edits and token semantics as before. Do not turn justified customization into a tool pass, infer fixes without comparable evidence, or invent counts. User-accepted migration exceptions retain their normal acceptance record. Preserve provenance, behavior, contract and browser evidence in JSON or the existing migration report; do not duplicate those tables in this summary.

Use the user's language for the final handoff and keep it concise. Link the detailed JSON instead of expanding all rules, token references and evidence metadata. This is a workflow handoff requirement, not an automatic editor hook or an independent quality certificate.
