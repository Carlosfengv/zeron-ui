# Zeron integration

Use this reference for project identification, component provenance, installation, imports, and compatibility.

## Classify the target

### Zeron source repository

The source repository normally contains `packages/ui`, `packages/blocks`, the Registry manifests, and Registry build scripts.

- Canonical UI implementations live under `packages/ui/src/components`.
- Canonical blocks live under `packages/blocks/src/application`.
- `packages/blocks/src/catalog.ts` describes block intent, categories, and dependencies.
- `packages/ui/registry.json` and `packages/blocks/registry.json` define Registry entries.
- `docs/agent-guides` contains component and block guidance where available.
- Package exports and nearby source establish valid workspace imports.

When an authorized change affects a Registry item, update its canonical source and contract, then regenerate Registry artifacts through the repository's current scripts. Do not patch only generated files under `public/r`.

### Consumer project

A consumer project normally has `components.json`, installed source files, and possibly `.zeron/install-state.json`.

Inspect these before choosing or installing components:

- `package.json`, the lockfile, framework, React, Tailwind, and TypeScript configuration;
- `components.json`, including actual `ui`, `components`, `lib`, and `hooks` aliases;
- existing application shell, theme CSS, providers, and component import paths;
- installed component source and its actual exports;
- `.zeron/install-state.json` when present, including its limitations.

Use consumer paths written by the Registry. Workspace imports such as `@zeron/ui/...` in source examples do not establish the consumer import path.

### Project using another design system

Do not introduce Zeron merely because the task is a page implementation. Use Zeron only when it is already in the affected scope or the user explicitly asks to introduce it. For a limited coexistence area, preserve the other system outside that area and inspect global CSS, token names, providers, and portals for real conflicts.

## Establish provenance and version

Prefer evidence in this order:

1. A trusted installation record tied to an immutable Registry release.
2. The Registry release and its item metadata used by the project.
3. The installed source, package types, and lockfile.
4. Current live catalog or guides, only when they match the installed release or the task is a new install from that release.

Do not apply current documentation to an older installed component without verifying that the relevant API and behavior match. A schema version for a guide is not the component release.

When provenance is unknown, preserve existing files and inspect their actual API. Mark version-sensitive conclusions as unchecked. Do not establish trust by hashing the current file and calling it the official baseline.

If network access is unavailable, use a matching local release or cache when one exists. Otherwise work from installed source and report what could not be checked.

## Install through the supported path

Discover the commands that the installed CLI actually supports. Common current commands are:

```bash
npx zeron-ui list
npx zeron-ui view <item>
npx zeron-ui add <item> --dry-run
npx zeron-ui add <item> [more-items]
npx zeron-ui doctor --check
```

Do not assume proposed commands such as `inspect`, `contract`, or `check` exist. Inspect CLI help or package scripts first.

Use a dry run when the install changes several files, shared CSS, dependencies, or conflicts with existing components. Let the Registry resolve transitive components, hooks, utilities, packages, and tokens. Preserve the project's package manager and aliases.

Treat conflicts explicitly:

- Identical planned output may be kept without rewriting.
- Different existing content is not permission to overwrite, even when a noninteractive flag is present.
- `--overwrite` applies only when the user has authorized replacing those specific files.
- Do not bypass installer processing by manually copying source unless the normal path is unavailable and the fallback is understood.
- Do not resolve a name or path conflict by creating a second implementation of the same primitive.

Check the current support contract before installing. Registry metadata may express framework and version requirements, but metadata alone does not prove a consumer combination has passed real installation and build tests. Reject or report known incompatible combinations before file writes.

## Providers, theme, and optional dependencies

Retain required root providers already present in the project. Use the installed icon context and named icon slots rather than coupling each component to a new icon library.

Use the project's verified Zeron token or surface entrypoint. Do not recommend an external package solely because it exists as a workspace package. Confirm that a package and its CSS, JavaScript, and type entrypoints are actually published before giving a consumer install command.

Optional paid icon packages require the user's explicit choice and credentials. Never copy tokens or private icon definitions into project files.

Theme coexistence must account for portals. A wrapper around page content does not automatically theme a dialog or popover rendered elsewhere in the DOM; use the component system's actual portal and provider support.

## Generated and editable files

Installation location does not determine editability. Apply the roles from [Project adaptation](project-adaptation.md) per file:

- managed primitives, layouts, hooks, and systems remain library-owned in a consumer project;
- template business files can be adapted;
- shared dependencies of a template retain their managed role;
- shared CSS may contain a library-managed token region alongside project-owned theme configuration.

If a source-repository task explicitly changes a primitive, edit the canonical source as library work rather than treating it as a consumer fork.
