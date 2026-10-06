# Zeron Design

Refined UI components with satisfying hover. Built on [shadcn/ui](https://ui.shadcn.com) and Base UI primitives — every transition exists to make a state change legible.

[Live docs & demos](https://zeron-ui.vercel.app) | [Browse components](https://zeron-ui.vercel.app/docs)

AI assistants can start with [llms.txt](https://zeron-ui.vercel.app/llms.txt) for installation, semantic tokens, the complete documentation catalog, and component API guidance. Its source is [`public/llms.txt`](public/llms.txt); keep the index aligned with `docs/manifest.ts` and the published agent-guide routes when documentation changes.

## Install

Initialize shadcn in a project that does not already have a `components.json`:

```bash
npx zeron-ui init
```

Install one or more components:

```bash
npx zeron-ui add button
npx zeron-ui add button dialog popover
npx zeron-ui add code-block
```

The Zeron CLI installs from the live Registry and delegates file placement,
dependencies, CSS, and design tokens to a pinned shadcn installation engine.
To inspect the catalog or preview a component without writing files:

```bash
npx zeron-ui list
npx zeron-ui add button --dry-run
```

The supported installation path is the pinned `zeron-ui` CLI. It performs a
write plan before invoking the installer, checks supported framework and React
requirements, and preserves existing files unless `--overwrite` is explicit.
Use `--path` only through `components.json` aliases: that flag is temporarily
unsupported while custom output placement is validated.

### Migrating from older Zeron CLI versions

Older installers could rewrite source outside the requested component. Upgrade
before installing again; the current CLI only post-processes files in its
explicit plan. Existing projects without `.zeron/install-state.json` should
run `npx zeron-ui doctor --check`, which reports the installation as unchecked
rather than claiming it is healthy. Next-only Blocks are rejected outside
Next.js, and template Blocks remain application skeletons rather than a
drop-in business backend.

Maintainers create an immutable Registry candidate with
`pnpm registry:release --release-id <id> --artifact-base-url <https-origin>`.
This writes an unuploaded candidate to `output/agent-releases/registry/<id>/`,
leaving `/r/*.json` unchanged. Its dependency URLs use the supplied origin's
`/r/releases/<id>/` prefix; its manifest hashes every distribution file.
Identical retries reuse existing bytes; different content requires a new ID.
Add `--require-clean` to reject uncommitted sources before creating a formal
candidate. Run `pnpm registry:release:check` for isolated build and retry checks.
Candidates are not publicly available until a separate verified upload completes.

### Use design tokens without installing components

`@zeron/tokens` is currently a workspace package used by this repository and
the Registry build. It is not advertised as an independently installable npm
package until a published version and its CSS, ESM, and type entrypoints have
been verified from npm. Consumers should install `surfaces` through the Zeron
Registry instead of relying on an unpublished package name.

Dependencies resolve automatically. Font weight animations require the [Inter](https://fonts.google.com/specimen/Inter) variable font.

## Migrate an existing application

The repository includes a paired `swap-to-zeronui` and `zeron-page-builder`
skill workflow for migrating existing React UI while retaining business behavior.
It inventories the agreed scope, maps old APIs, installs Zeron components,
adapts callers and verifies cleanup and product flows. It reports capability gaps
and accepted exceptions instead of claiming an unconditional full replacement.

### Install skills from the website

The localized homepage (`/` and `/en`) covers component installation, agent skill
installation, capability summaries and copyable usage prompts. Its release panel
reads the npm `zeron-ui` latest tag with hourly revalidation, labels prereleases,
and uses the verified version in CLI commands. Registry failures show an explicit
unavailable state and `@latest` commands instead of presenting a local version as
published. The homepage shares the existing site shell and Zeron components.

The introduction page includes a bilingual **Copy install prompt** section at
`/docs#skills` (English: `/en/docs#skills`). After deploying this version, an agent
with network and file access can read `https://zeron-ui.vercel.app/skills/install.md`
and install both skills into a project that does not yet use Zeron UI.

The entrypoint links a versioned manifest and ZIP containing both complete skill
directories. Agents verify archive/file hashes, preserve differing local skills,
and install skills without modifying the application. Migration is a subsequent
user request. Other agents must use their own supported skill directory.

`pnpm skills:build` generates the website assets in `public/skills/`. `pnpm dev`
and development-mode `pnpm build` run it automatically. Generated downloads are not committed; a
website deployment is required before the public URL serves this implementation.
The legacy schema 1 manifest version is the archive's SHA-256. A retained guide can refer to an
older release; if unavailable after deployment, fetch the current guide again.

Create an unuploaded schema 2 Skill candidate with
`pnpm skills:build --mode release --artifact-base-url <https-origin> --site-base-url <https-origin>`.
The output is `output/agent-releases/skills/<skillVersion>/` with a ZIP,
`manifest.json`, a fixed installation guide and all source references.
`skillVersion` identifies the archive, effective guide template and configured
origins; `archive.sha256` identifies only the ZIP. `artifacts.json` hashes the
complete distribution without including itself. Source provenance is recorded
outside this content-addressed inventory. Add `--require-clean` to reject dirty
sources, and run `pnpm skills:release:check` for candidate and retry verification.
The builder prints a `.source.json` record beside the version directory; retain
it for the publisher's source binding check.

`pnpm agents:publish --manifest <artifact-manifest> --dry-run` validates Registry
or Skill payloads and lists the objects, hashes, byte sizes and final completion
marker. It performs no network requests or upload.

`pnpm agents:publish --manifest <artifact-manifest> --upload` publishes Registry
or Skill resources using the explicitly configured `ARTIFACT_BASE_URL` and a
publishing identity. Skill uploads also require `--provenance <source-record>`.
The publisher requires a clean source checkout, rebuilds the candidate's source
binding, disables overwrite and random suffixes, verifies every public object,
and writes completion last. Failed gates and interrupted writes produce failed
reports; retries reuse only identical bytes. Blob credentials belong to the
publishing job, not the documentation app or MCP runtime. This implementation
has local fault tests; an actual Blob upload has not yet been verified.

### Build from a frozen Agent release

`pnpm agents:build --mode release --release <record-or-selection>` restores a
committed record from `docs/agent-data/releases/`. Each record pins public
resource URLs, byte counts and hashes; it can include two prior records. The
restorer validates stages, installation summaries, historical Skill bytes,
catalog identity and identity evolution before replacing generated outputs.
It stops on incomplete resources or mismatches without using development data.

For a site build, configure `AGENT_CATALOG_MODE=release` and
`AGENT_RELEASE_RECORD=docs/agent-data/releases/current.json`, then run
`pnpm build`. Release builds restore inputs and skip legacy Skill generation.
These interfaces are implemented and tested with temporary fixtures; no actual
frozen release record is committed yet. Catalog publication, actual npm
consumer verification, and cloud deployment remain pending. See the
[AI implementation plan](docs/plans/2026-10-03-agent-access-and-mcp-plan.md)
for complete scope and evidence boundaries.

For the initial website and readonly MCP deployment, use the default
`development` catalog mode with `pnpm build`. The same Next.js deployment
serves the website, generated documentation, Skill downloads and `/api/mcp`.
This mode does not need Blob credentials or a frozen release record;
`get_install_command` rejects installation combinations that have not been
verified. With the repository connected to Vercel and `main` configured as
the production branch, `vercel.json` enables Git deployments from `main`.
Verify the deployment reaches `READY` and check the live MCP tools after
pushing. A local build does not establish that the new code is online.

Before consumer verification, run `pnpm agents:installation:prepare` with
`--registry-manifest <file> --skill-artifacts <file> --skill-provenance <file>`
and `--config <file> --output <new-isolated-directory>` from a clean Node 22
source checkout. The strict configuration contains `schemaVersion: 1`,
`siteBaseUrl`, `cli` (exact name/version/SRI), four `matrices` and
`nextOnlyRejectionItem`; see `installationConfigurationSchema` in
`scripts/prepare-published-installation-input.mjs`.
The preparer rebuilds source bindings and matches actual public completion
bytes before writing `installation-input.json`. It pins installation resources
without depending on a Catalog that does not exist yet. Run
`pnpm agents:installation:check --input <descriptor> --output <new-isolated-directory>`
from a clean fixed source checkout with Node 22. The checker reads every public
Registry/Skill object, verifies closures and archive bytes, rebuilds source
bindings, and checks the official npm tarball against its pinned SHA-512.
Output directories must be new; failures retain a safe `failure.json`.
Successful `input-verification.json` means the inputs are verified. It does not
claim consumer installation, produce an installation pass record, or enable MCP
installation commands.

`pnpm test:consumer:published --input <descriptor> --output <new-isolated-directory>`
runs the four fixed Next/Vite × npm/pnpm templates on Node 22 Linux. It reuses
the input/source checker, verifies the actual CLI package bytes resolved by
npm exec or pnpm dlx, then checks dry-run preservation, Vite's Next-only
rejection, installation, types, framework builds and emitted theme utilities.
Projects and caches are isolated; each step has a deadline and kills descendants
on failure. Raw command logs stay under `private-logs/`.
Default output is `local-verification.json`, which cannot freeze a release.
Explicit `--publish-evidence` requires the publishing identity, appends cleaned
content-addressed evidence, anonymously reads it back and only then writes
the strict `verification.json`. Any failure writes `failure.json` without a
success report; output directories cannot be reused.

Fault tests and actual template builds/CLI launches have passed locally.
The exact-version npm metadata and official tarball for `zeron-ui@0.2.0-beta.17`
have since passed identity and integrity checks, and
`docs/agent-data/installation-config.json` pins that CLI and the four test
profiles. Earlier metadata failures remain in the evidence appendix.
Actual published Registry installation matrices, Blob evidence writes and
release-mode deployment remain unverified; the prepared configuration does
not enable MCP installation commands.

For an offline or local transfer, bundle both skills with their references:

```sh
pnpm skills:bundle --output /path/to/new/zeron-migration-bundle
```

Copy both generated skill directories together into the target project's
`.agents/skills/`, resolving any existing skill versions before replacing them.
Then ask: “Use $swap-to-zeronui to migrate this application's UI to Zeron while
preserving its business behavior.” Check the installed CLI's help for optional
`swap scan` and `swap check` support; new source commands are documented in the
[CLI README](packages/cli/README.md#migration-inspection-local-development).

The first workflow targets React 19, Tailwind 4, Next App Router or Vite React,
and inspected shadcn-style/custom React sources. Framework upgrades, arbitrary
third-party component parity and a production backend are outside that promise.
See the [implementation plan](docs/plans/2026-09-18-swap-to-zeronui-plan.md)
for phase status and validation boundaries. No npm release is implied by local
source availability.

## Icons

Components render icons through named slots with HugeIcons Stroke Rounded defaults. To use another icon library, wrap your app in the installed `IconProvider` and override any slot; names you leave out keep their HugeIcons default:

```tsx
import { IconProvider } from "@/lib/icon-context";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";

<IconProvider icons={{ "chevron-right": CaretRight, "search": MagnifyingGlass }}>
  <App />
</IconProvider>
```

The site and default Registry components use only the public HugeIcons packages, so installs and builds do not require a license token. The optional `pro-icon-provider` Registry item adds HugeIcons Stroke Standard, Bulk Rounded, and Duotone Rounded. It requires a HugeIcons Pro subscription and is intentionally excluded from the site's dependency graph.

To opt in, copy the local registry configuration, provide your own token, install the Registry item, and use `ProIconProvider` at the app root. Keep `.npmrc` local; it is ignored by Git. Pro icon definitions are never included in this Registry.

```bash
cp .npmrc.example .npmrc
export HUGEICONS_TOKEN="your-token"
npx zeron-ui add pro-icon-provider
```

```tsx
import { ProIconProvider } from "@/lib/pro-icon-provider";

<ProIconProvider>
  <App />
</ProIconProvider>
```

## Components

| Component | Description |
|---|---|
| [Accordion](https://zeron-ui.vercel.app/docs/accordion) | Collapsible sections with animated expand/collapse and proximity hover |
| [AskUserQuestions](https://zeron-ui.vercel.app/docs/ask-user-questions) | Stepped question flow with single/multi-select, inline "other" input, and multi-question navigation |
| [Badge](https://zeron-ui.vercel.app/docs/badge) | Compact label with solid and dot variants, Tailwind color palette |
| [BadgeOverflow](https://zeron-ui.vercel.app/docs/badge-overflow) | Responsive badge list that collapses hidden items into an overflow count |
| [Breadcrumb](https://zeron-ui.vercel.app/docs/breadcrumb) | Composable path navigation with separators, current-page state, and collapsed levels |
| [Button](https://zeron-ui.vercel.app/docs/button) | Variants, sizes, loading state, and icon support |
| [Card](https://zeron-ui.vercel.app/docs/card) | One prop-driven card — stacked, inline, or grid layouts, borderless dividers, media/logo/feature slots, and 2-D proximity hover |
| [Checkbox](https://zeron-ui.vercel.app/docs/checkbox) | Compact checkbox with checked, mixed, disabled, validation, and form states |
| [CheckboxGroup](https://zeron-ui.vercel.app/docs/checkbox-group) | Merged backgrounds for contiguous selections |
| [ColorPicker](https://zeron-ui.vercel.app/docs/color-picker) | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper; inline or popover |
| [DataGrid](https://zeron-ui.vercel.app/docs/data-grid) | Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns |
| [DataTable](https://zeron-ui.vercel.app/docs/data-table) | TanStack data table with sorting, filters, pagination, selection, visibility, and pinning |
| [Dialog](https://zeron-ui.vercel.app/docs/dialog) | Modal with smooth enter/exit animations and overlay |
| [Dropdown](https://zeron-ui.vercel.app/docs/dropdown) | Menu-style dropdown with proximity hover |
| [Input](https://zeron-ui.vercel.app/docs/input) | Text input with three variants, five sizes, and accessible validation states |
| [InputCopy](https://zeron-ui.vercel.app/docs/input-copy) | Read-only input with copy-to-clipboard and animated feedback |
| [InputGroup](https://zeron-ui.vercel.app/docs/input-group) | Composable input with addons, compact actions, textarea support, and validation |
| [Kbd](https://zeron-ui.vercel.app/docs/kbd) | Compact keycaps and shortcut groups for keyboard commands and interaction hints |
| [InputMessage](https://zeron-ui.vercel.app/docs/input-message) | Chat-style composer with auto-resizing textarea, action slots, and built-in send button |
| [Popover](https://zeron-ui.vercel.app/docs/popover) | Collision-aware floating content with a liquid anchor-to-panel transition |
| [RadioGroup](https://zeron-ui.vercel.app/docs/radio-group) | Composable radio controls with form support and enhanced proximity-hover rows |
| [Select](https://zeron-ui.vercel.app/docs/select) | Animated select with bordered/borderless variants |
| [Slider](https://zeron-ui.vercel.app/docs/slider) | Range slider with step snapping, range mode, animated thumb |
| [Stepper](https://zeron-ui.vercel.app/docs/stepper) | Multi-step navigation with validation, completion states, and keyboard controls |
| [Surfaces](https://zeron-ui.vercel.app/docs/surfaces) | Semantic elevation roles with relative nesting so popovers, dropdowns, and dialogs stay distinct at any depth |
| [Switch](https://zeron-ui.vercel.app/docs/switch) | Toggle with animated thumb and label |
| [Table](https://zeron-ui.vercel.app/docs/table) | Data table with row hover effects |
| [Tabs](https://zeron-ui.vercel.app/docs/tabs) | Pill, segment, and underline tabs with sliding indicators and proximity hover |
| [ThinkingIndicator](https://zeron-ui.vercel.app/docs/thinking-indicator) | Animated status indicator with morphing SVG |
| [ThinkingSteps](https://zeron-ui.vercel.app/docs/thinking-steps) | Chain-of-thought display with sequential animation |
| [Tooltip](https://zeron-ui.vercel.app/docs/tooltip) | Spring-based floating tooltip with configurable placement |

## What makes these different

- **Motion as information** — transitions make state changes legible, nothing moves for decoration
- **Hover as preview** — proximity highlights show where your action will land before you click
- **Spring physics** — springs replace fixed durations, adapting naturally to interruption
- **Drop-in compatible** — your existing shadcn theme and tokens apply automatically

## Tech stack

- [Next.js](https://nextjs.org) 15 + React 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://www.framer.com/motion/)
- [Base UI](https://base-ui.com) primitives
- [shadcn/ui](https://ui.shadcn.com) registry protocol

## Validation

Use Node 22 (`nvm use`) and the pinned pnpm version from `packageManager`. Install with
`pnpm install --frozen-lockfile` and `pnpm exec playwright install chromium`, then run `pnpm test`, `pnpm cli:test`,
`pnpm typecheck`, `pnpm lint`, and `pnpm lint:design`.

`pnpm test` runs the source/component suites with two workers, followed by the
actual Chromium control observations in a separate test process. Run those
steps individually with `pnpm test:unit` and `pnpm test:controls:browser`.
Production routing suites
require a completed build: run `pnpm build && pnpm test:production`. They are
kept separate so a fresh checkout does not try to start a nonexistent build.
The existing Playwright commands additionally cover browser navigation, focus,
and CodeBlock interactions.

After changing Registry sources, regenerate with `pnpm registry:build` and run
`pnpm registry:check`; commit the resulting `public/r` changes together with
their source changes. Consumer installation/migration checks remain part of CI.

For initialization styles, install Chromium with `pnpm exec playwright install chromium`
and run `pnpm test:consumer:styles`. This packs the local CLI and installs it into
independent Next (npm and pnpm) and Vite consumers through an HTTP Registry. It
checks production pages after `init` and repeated component installation, including
light/dark colors, control sizes, native radii, and portal styles. Screenshots and
computed styles are saved in `output/consumer-styles` and uploaded by CI.

For the frozen Block/Page unification scope, run `pnpm test:consumer:unification`.
It verifies 43 installable entries and 7 shared items in 192 independent
Next/Vite × npm/pnpm targets, with production builds and rendered examples.
Logs, screenshots and recursive Registry payload fingerprints are saved in
`.zeron/reports/stage-six/`. Default runs are fresh. Use `--resume` only within
a fixed CLI/fixture/checker run; recursive Registry bytes must also match.
Changing the CLI, examples or verifier requires a fresh run. Local candidate
artifacts do not imply a public CLI or Registry release.

Set `ZERON_UNIFICATION_EVIDENCE_DIR` to a separate directory when verifying a
new candidate so the historical stage-six evidence remains intact.

Block/Page documentation source previews use the explicit allowlist in
`scripts/preview-source-allowlist.mjs`. After changing those sources, run
`pnpm docs:sources:build`, verify with `pnpm docs:sources:check`, and commit the generated URL mapping and
`public/docs-source` assets. `pnpm dev` regenerates them automatically;
`pnpm build` and the unit tests reject stale output. Source URLs are
content-hashed, locale-independent text files fetched only on Code-tab intent
or selection. Keep short component example snippets inline. Never add a
request-controlled filesystem source endpoint.

## License

[MIT](LICENSE) © Zeron Design
