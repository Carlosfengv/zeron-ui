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

## License

MIT
