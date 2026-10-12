# Zeron Design

**English** · [简体中文](README.zh-CN.md)

React components and blocks built with [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com), and Tailwind CSS. Refined hover feedback, purposeful motion, and source code you can make your own.

[Website](https://zeron-ui.vercel.app/en) · [Documentation](https://zeron-ui.vercel.app/en/docs) · [Report an issue](https://github.com/Carlosfengv/zeron-ui/issues)

## Features

- **Components and blocks** — Build forms, data tables, dashboards, and application layouts.
- **Purposeful motion** — Spring transitions and proximity highlights make interactions easier to follow.
- **Customizable design** — Semantic tokens, light and dark themes, and replaceable icons.
- **Own the source** — Install components into your project and adapt them to your product.

## Quick start

Use a React 19 project with Tailwind CSS 4 already configured and Node.js 20.18.1 or newer.

If your project does not have a `components.json`, initialize it first:

```bash
npx zeron-ui@latest init
```

Add the components you need:

```bash
npx zeron-ui@latest add button dialog popover
```

The CLI installs component source and resolves dependencies automatically. See the [CLI guide](packages/cli/README.md) for more commands and options.

## Documentation

- [Components](https://zeron-ui.vercel.app/en/docs/components) — Live examples, APIs, and usage.
- [Blocks](https://zeron-ui.vercel.app/en/docs/blocks) and [pages](https://zeron-ui.vercel.app/en/docs/pages) — Composed UI and application layouts.
- [Icons](https://zeron-ui.vercel.app/en/docs/icons) — Icon libraries and custom providers.
- [Agent skills](https://zeron-ui.vercel.app/en/docs#skills) — Build pages or migrate an existing React UI with an AI assistant.
- [llms.txt](https://zeron-ui.vercel.app/llms.txt) — Documentation index for AI assistants.

## Project structure

```text
app/                Next.js routes and site entry points
docs/               Documentation content and examples
packages/
  ui/               React components
  blocks/           Composed blocks and page templates
  cli/              zeron-ui command-line tool
  icons/            Icon providers and assets
  tokens/           Semantic design tokens
  registry/         Registry build tooling
  lint/             Design lint rules
public/             Static assets and generated registry files
scripts/            Build and validation scripts
tests/              Automated tests and consumer fixtures
```

## Contributing

Issues and pull requests are welcome. To run the documentation site locally, use Node.js 22 and pnpm 10.12.4:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). See the [maintenance guide](docs/maintaining.md) for validation, registry updates, and release workflows.

## License

[MIT](LICENSE) © Zeron Design
