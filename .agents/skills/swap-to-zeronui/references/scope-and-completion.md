# Scope and completion

First release targets React 19, Tailwind 4, TS/TSX, npm/pnpm, Next App Router and Vite React with explicitly inventoried routes. Treat this as a constrained workflow, not certification of every library combination. Inspect resolved dependencies, not just loose package.json ranges. Source candidates are inspected shadcn-style implementations and custom React controls. Other systems require explicit mapping and gap analysis.

Record the initial scope in the plan and baseline report/version history. Include shared files and affected consumers. Scope changes require a recorded reason grounded in the user's request. Do not exclude troublesome routes to improve completion counts.

Determine the mode from the existing request without asking again for an already authorized choice:

| Mode | UI boundary |
| --- | --- |
| Ordinary page work | Use the builder; preserve the surrounding host. |
| Scoped migration | Replace UI inside the frozen region and inspect shared impacts; preserve the outside host. |
| Full design-system migration | Prefer matching Zeron blocks, layouts and semantic components, replacing old shell, structure, styles and generic APIs where their responsibilities overlap. |

Preserve navigation destinations, information meaning, data flow, permissions, validation and business outcomes. This does not require preserving old DOM structure, control positions, CSS or component APIs. Record a concrete capability conflict or explicit user constraint when retaining an old UI implementation. Existing brand requirements use public theme APIs. Pixel fidelity to the old design and framework upgrades are separate requirements. Project requirements such as an account entry's location belong in the project record, not a universal Zeron rule.

Ordinary HTML, domain logic, routing/state libraries and Zeron's own dependencies remain valid. Evaluate specialized engines by responsibility: retaining an old editor toolbar inside scope is an exception; retaining a headless engine behind a Zeron interface is not automatically one.

Completion requires all in-scope routes inventoried and reviewed, region selections justified and implemented, mappings verified, no unresolved references or gaps, old UI and temporary compatibility wrappers cleaned up, trusted managed files intact, template ports attributed, and fresh type/build/behavior/visual/contract/provenance/cleanup/scope evidence. Installation, functional regression, design contracts and browser checks must each have their own result; passing one does not imply the others passed.

Use `complete and verified` only when all required checks and coverage are satisfied. Use `migrated with accepted exceptions` only for a specific divergence with an explicit user acceptance reference and no failed mandatory check. Missing evidence is not an accepted exception, and the agent cannot accept on the user's behalf. Otherwise use `partial / awaiting verification`. Existing build failures remain failures even when no new failures were introduced.

For partial tasks report completion only for the agreed region and inspect its shared impacts. Missing credentials/browser/test infrastructure should be recorded precisely. Do not create backend mocks and claim real business integration.
