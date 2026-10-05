# Agent business examples

Three pages use public Zeron components and an injected `ExampleApi` from `shared/contracts.ts`. The deterministic adapter is an in-memory demonstration service. It records calls and provides controlled delays, failures and permissions; it does not represent a deployed backend.

`app.tsx` is the complete host: AppShell owns the frame, Sidebar owns responsive navigation, NavMenu owns grouped feedback, and SidebarAccountMenu owns account actions. On mobile, choosing a destination closes the drawer. The source manifest separates host adoption from each page's adoption; installing a page alone does not imply that its host components are verified page examples. Reuse existing application navigation when integrating these pages into a host that already has a shell.

Run from the repository with Node 22 and pnpm 10.12.4. Use a fresh output directory on every attempt:

```sh
pnpm agents:examples --framework vite --package-manager pnpm --output output/agent-examples/vite-local --serve --port 4187
pnpm agents:examples --framework next --package-manager pnpm --output output/agent-examples/next-local --serve --port 4188
```

For repeatable browser acceptance, replace `--serve` with `--check-browser` and use a new output directory. The runner starts and stops its own production preview, checks all applicable page states and keyboard flows at 390/1440px, then writes `local-browser-verification.json` and `browser/`. `shell-observations.json` records grouped navigation, actual icon/label geometry, collapse/expand, mobile drawer closing and account action separately from page coverage. This local entry does not establish a published release or independent Agent development success. Do not combine `--serve` and `--check-browser`.

The runner bootstraps a fixed consumer template, runs the workspace CLI executable against a loopback Registry, installs components, adapts imports to consumer aliases, checks types and builds production output before serving. `local-verification.json` describes this development combination. It does not prove installation from a published CLI or a public immutable release. The production acceptance runner must bind the same sources to the verified installation input separately.

The runner also accepts `--package-manager npm` with npm 10.9.2. Support is recorded only for combinations that actually pass their own checks. A passing pnpm consumer does not establish npm support.

Open `/` for resources, `/?example=detail` for resource details, and `/?example=settings` for settings. Add the following `scenario` parameter to reproduce applicable states:

| Scenario | Pages | Behavior |
| --- | --- | --- |
| success | All | Normal service responses |
| slow | All | Initial read takes two seconds |
| race | All | Initial read ignores abort and takes two seconds; change the list query or navigate away to test stale-response handling |
| error | All | First read fails; Retry succeeds |
| forbidden | All | First read denies access; sensitive content is hidden |
| empty | List | Confirmed empty inventory; detail/settings have no collection empty state |
| missing | Detail | Resource does not exist; editor is absent |
| readonly | Detail, settings | Read succeeds but fields and submit are disabled |
| save-error | Detail, settings | First save fails and preserves the draft; next save succeeds |
| save-forbidden | Detail, settings | First save denies access and disables further editing |
| saving | Detail, settings | First save takes two seconds; duplicate dispatch is blocked |

Settings validation and dirty/reset states are exercised by changing inputs. List search/status/sort and pagination are owned by the host query, with filtering and sorting applied before service pagination. Detail navigation returns the original query. Native keyboard interaction follows the installed components; behavior tests and browser checks are separate from type/build evidence.

For application integration, render `ExamplesApp` with a stable API object scoped to the current account. Implement real authorization on the service, map failures to `ExampleApiError`, propagate `AbortSignal`, and enforce mutation revisions on the server. Remount `ExamplesApp` when account/tenant changes. Replace its demonstration navigation with your application's router and persist `ResourceQuery` as appropriate. Cancelling a request prevents stale UI updates; it cannot undo a mutation already committed by a backend.

The source tree contains page/business logic only. Registry components, styles and their dependency closure are installed into each consumer. Browser screenshots and reports belong in ignored output directories, and never change the frozen source snapshot.
