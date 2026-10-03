# Changelog

## 0.2.0-beta.18 (prepared, not published)

- Check installed React and React DOM versions before Registry installation instead of guessing from manifest ranges. Support catalog/workspace/alias specifications when the installed runtime is compatible, and reject missing, mismatched, or incompatible runtimes before writing files.
- Includes the installation protections merged after beta.17: immutable recursive Registry snapshots, existing-file conflict detection, repeated-install preservation, path/symlink guards, JavaScript output tracking, and installed Tailwind compatibility checks.
- Registry assets rebuilt with the accompanying data-grid, data-table, temporal picker, Stepper, SortableCollection, and MCP-detail fixes.

Release preparation only: merge and npm publication require separate maintainer approval. Before publication, confirm this version is still unused, rerun CLI/Registry/consumer checks, and publish the matching Registry assets through the normal release workflow.
