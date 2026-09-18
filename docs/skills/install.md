# Install Zeron skills

This is the official installation guide for the paired `zeron-page-builder` and
`swap-to-zeronui` skills. Follow the user's requested installation scope and the
target project's instructions. Installing these skills does not require Zeron UI,
React, a package manager, or a clone of the Zeron repository.

## Download the complete release

- Bundle version (SHA-256): `{{version}}`
- [Pinned manifest]({{manifestPath}})
- [Latest manifest](/skills/manifest.json) (for checking updates)

Resolve these root-relative URLs against the origin of this guide. Fetch the
pinned manifest first, then download its `archive.url` from that same origin.
Use a tool that can download raw bytes, not a web-page summary. HTTP errors or
HTML responses are not archives. The ZIP contains two sibling directories:

```text
zeron-page-builder/SKILL.md
zeron-page-builder/references/...
swap-to-zeronui/SKILL.md
swap-to-zeronui/references/...
swap-to-zeronui/assets/...
```

Verify the ZIP byte length and SHA-256 against `archive.bytes` and
`archive.sha256` before extraction. Extract to a fresh temporary directory;
reject absolute paths, `..` segments, symlinks and entries outside the two named
directories. Check the extracted file list, byte lengths and SHA-256 values
against **every** entry in `files`. Do not install only the two `SKILL.md` files:
their supporting resources and sibling references are required.

## Install into the user's project

1. Identify the target project and the agent's supported skill directory. For
   Codex, use `<project>/.agents/skills/` by default. If the user explicitly asks
   for a personal Codex install, use `~/.agents/skills/`. For another agent, check
   its documented location; do not assume all agents discover Codex directories.
   Codex directory reference: https://developers.openai.com/zh-Hans/docs/build-skills
2. Inspect both destination directories before writing either. Do not follow a
   destination symlink. If both are absent, copy the two verified directories
   together, preserving their names and sibling relationship. The result must
   include `<skill-directory>/swap-to-zeronui/SKILL.md` and
   `<skill-directory>/zeron-page-builder/SKILL.md`, without an extra bundle folder.
3. If an existing skill is byte-for-byte identical (including its complete file
   list), keep it. If any content differs or additional files exist, report the
   differences and preserve the existing directories. Do not partially update the
   pair or silently overwrite local changes. Updating a differing installation
   requires an explicit user choice and a recoverable backup of both directories.
4. Recheck all installed files against the manifest and confirm that relative
   Markdown references resolve within the installed pair. Report the installed
   version, both absolute paths and whether the agent can discover them. If the
   current session has not refreshed its skill list, open a new task/session in
   the project and verify discovery; files on disk alone do not prove activation.

Do not edit application source, install UI packages, run `zeron-ui init`, or
start a migration unless the user also requested that work. Do not modify global
agent configuration or install into every agent directory by default.

## Use after installation

For a new page:

> Use $zeron-page-builder to build a settings page in this project. Check the
> existing stack and introduce Zeron UI as needed, preserving real business logic.

For migration:

> Use $swap-to-zeronui to migrate this project's UI to Zeron UI. Check compatibility
> and initialize Zeron as needed. Preserve routes, data, permissions and behavior;
> report any gaps and verify the affected flows.

Installing skills has no React/Tailwind prerequisite. **Using Zeron components**
currently targets React 19 and Tailwind 4; Next-only blocks cannot be used in Vite.
An incompatible application needs a separate compatibility decision, not an
unrequested framework upgrade.

## CLI availability and updates

These are agent instructions, not a bundled CLI or automatic migration engine.
Use the available Zeron CLI's help and pin a verified version when doing actual
UI installation. Do not assume `swap scan` or `swap check` exists in the published
CLI: the initial distribution does not depend on those commands. If absent,
follow the skill's inventory, migration and verification steps with the project's
existing tools and record static helper checks as unavailable. Do not fabricate a
passing CLI result or install an unpublished workspace-only lint package.

For updates, fetch the latest manifest and compare its version and file hashes
with the installed files. Apply the same conflict rules above. If a pinned release
is no longer available after a site deployment, refetch this guide and restart
verification from its new pinned manifest; never mix files from two versions.

If network or file-write access is unavailable, explain that boundary and provide
the manifest's archive URL for manual download. Do not claim the skills were installed.
