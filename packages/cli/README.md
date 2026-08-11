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
--path <dir>      Override the component output path
--dry-run         Inspect resolved Registry items without writing
--registry <url>  Use another Registry base URL
```

The default Registry is `https://www.zerondesign.com/r`.

## License

MIT
