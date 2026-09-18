# zeron-ui

Install Zeron Design components into your project.

```bash
npx zeron-ui add button
```

Install multiple components:

```bash
npx zeron-ui add button dialog popover
```

Discover and inspect components:

```bash
npx zeron-ui list
npx zeron-ui view button
npx zeron-ui doctor
```

`zeron-ui add` only writes files covered by its resolved Registry plan. It
rejects `--path` for now; configure the target aliases in `components.json`
instead. Use `--dry-run` to inspect the planned files first. Next-only Blocks
are rejected outside a Next.js project, and React 19 is required for published
Registry items.

After a successful install, `zeron-ui doctor --check` verifies the local
installation record and reports missing files. Older projects without a record
are shown as unchecked rather than healthy.

Zeron UI installs source code from the official Zeron Design Registry and uses
the shadcn installation engine to resolve component files, package dependencies,
shared utilities, CSS, and design tokens.

## Requirements

- Node.js 20.18.1 or newer
- A project supported by the shadcn CLI
- A `components.json` file; run `npx zeron-ui init` if your project does not have one

## Options

```text
--cwd <dir>       Run against another project directory
--overwrite       Replace existing component files
--yes             Skip confirmation prompts
--path <dir>      Temporarily unsupported; configure components.json instead
--dry-run         Inspect resolved Registry items without writing
--registry <url>  Use another Registry base URL
```

The default Registry is `https://zeron-ui.vercel.app/r`.

Explicit Registry targets in the pinned installer follow the root/`src` layout.
The CLI resolves TypeScript aliases and rejects disagreements before any writes;
it does not silently create a second component tree. When an application has
`src`, aliases for these Registry items must resolve to the corresponding `src`
locations. Arbitrary output directories are not supported by this installer.

## Migration inspection (local development)

The source CLI now includes read-only migration helpers. These commands are not
an automatic replacement engine, and availability in a published CLI must be
checked with `--help` before use.

```sh
node packages/cli/src/index.js swap scan --cwd /path/to/app --json
node packages/cli/src/index.js swap check --cwd /path/to/app --plan .zeron/migrations/example/plan.json --json
```

`scan` inventories source imports (including re-exports), JSX, CSS tokens and
Next App Router files. It resolves installed React/Tailwind versions and reports
unknown dynamic references, prop spreads and unsupported project configurations.
Vite route discovery requires explicit review. It skips hidden, public, generated
and dependency directories and reports source symlinks instead of following them.
Neither command writes files, installs dependencies or executes project code.

`check` reads the versioned plan schema in `src/swap/migration-plan.schema.json`.
It detects selected old imports/files/text, changed managed files, stale evidence
and incomplete mappings. All paths are relative to the selected application;
evidence paths cannot escape it, including through symlinks. Scope roots are
paths rather than globs. Shared consumers outside the selected scope are reported
separately. Full-app scope also checks selected old direct dependencies.

Both helpers emit JSON, with or without `--json`. Scan exits 0 when analysis is
complete, 2 when compatibility or parsing needs attention, and 1 on operational
errors. Check exits 0 for satisfied static/evidence gates, 1 for failures, and 2
for unchecked work. Always read `completionStatus`: accepted exceptions are
`with-exceptions`, never `complete`. Evidence existence, hashes and freshness
cannot independently prove behavioral equivalence. The paired migration skill
requires real product and visual verification.

The initial supported workflow is React 19/Tailwind 4 with Next App Router or
Vite React, npm/pnpm, and inspected shadcn-style or custom React controls.
This is a prototype with consumer fixture validation, not a guarantee for every
application. There is no `swap apply` command.

## License

MIT
