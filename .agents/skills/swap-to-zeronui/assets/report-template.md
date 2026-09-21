# Zeron migration report

Result: choose `complete and verified`, `migrated with accepted exceptions`, or `partial / awaiting verification`.

## Scope and source

- Mode and target application/routes; shared impact and frozen baseline reference.
- CLI/Registry release, source hashes and final scan snapshot.
- Project constraints (brand, navigation/account placement, existing capabilities).

## Region adoption

| Region / mapping ID | Required capabilities and states | Candidate and pinned source | Framework / API fit | Adoption and layout/scroll owners | Rejection reason or gap | Evidence |
| --- | --- | --- | --- | --- | --- | --- |

For in-scope charts, attach an inventory keyed to mapping IDs: old renderer/files, purpose, data/query/aggregation/units/timezone, required interactions, target composition, capability gaps and before/after verification. Omit this attachment when the scope contains no charts.

For standard resource lists, record the base-component hierarchy and region owners, domain columns/IDs, query mode/totals, selection scope and CRUD/permission integration. Verify the structural contract rather than requiring a particular block/page name.

For affected list/detail headers, record component sources and the owners of path/context, title or resource summary, description/status, record navigation, tabs and actions. Identify host-owned or absent regions. Link DOM/browser evidence for grouping, duplicate prevention, long titles, narrow-layout action reflow and real navigation/action behavior; unused PageLayout imports do not establish adoption.

## Template ports and adapter exits

| Port | Source release/files/hashes | Project-owned files and changes | Framework imports/dependencies replaced | Managed dependency provenance | Verification |
| --- | --- | --- | --- | --- | --- |

| Mapping ID / temporary old-API export | Source selectors and callers | Target API | Remaining difference / batch / exit condition | Removed / remaining and evidence |
| --- | --- | --- | --- | --- |

- Retained business compositions and CSS: responsibility and actual consumers.
- Removed old implementations, styles and direct dependencies.
- State “not applicable” for a category only when inspected and absent.

## Coverage

- Routes reviewed / total:
- Regions adopted and contract-verified / total in scope:
- Mappings verified / total:
- Critical flows passed / total:
- Residuals / unknowns / accepted exceptions:

## Independent verification

| Dimension | Actual scope and states | Passed / failed / unchecked | Evidence files | Uncovered states |
| --- | --- | --- | --- | --- |
| Installation and provenance | | | | |
| Functional regression | | | | |
| Design contracts | | | | |
| Browser layout and interaction | | | | |

- Label static review, mocked-browser checks and real-backend checks separately.
- For migrated controls, record covered compositions/callers, viewport and label constraints, and normal/focus/disabled/loading states. Include icon/text alignment, wrapping/clipping and size checks; list uninspected states and outstanding visual defects explicitly.
- Preserve individual typecheck, build, cleanup and scope-review outcomes as well as all required plan checks.
- Distinguish passing subsets from scope-wide check outcomes. List missing coverage as unchecked and known violations as failed; do not pass aggregate cleanup/contract checks while their in-scope obligations remain unmet.
- Record raw CLI command/version, exit code and result independently of manual diagnosis; a false positive is not a tool pass.
- For attachment-based evidence, name the index path here. Put its final hash, attachment-verifier output and final scan/check output in the handoff outside indexed files to avoid circular hashes.

## Remaining gaps and accepted exceptions

- Requirement, affected behavior/region, failed or missing evidence, next action.
- Reconcile each in-scope remaining item with its mapping ID, source selectors and current state; split partial mappings instead of marking the entire region verified.
- Record declared plan status and CLI completionStatus separately, with the reason for any disagreement. A partial report must not be handed off with a complete plan; a complete label alone is not verification.
- For each exception: mapping ID and explicit user acceptance reference. Do not sign acceptance on the user's behalf or treat missing verification as acceptance.

## Recovery

- Last verified batch, local snapshot reference and any subsequent user changes.
