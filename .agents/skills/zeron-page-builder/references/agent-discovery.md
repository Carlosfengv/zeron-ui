# Discover and retain one Zeron version

Use this procedure when selecting or installing Zeron components. First inspect
the host framework, package manager, aliases, installed sources, theme and shell.
Installed public types and local customizations remain authoritative for existing
code; a current catalog does not authorize overwriting them.

## Connected MCP

1. Search by the task and actual framework with `search_components`, or browse
   with `list_components`. Record the returned `catalogVersion` and `catalogUrl`.
2. Read selected stable IDs with `get_component`, passing that same
   `catalogVersion`. Check compatibility, coverage, ownership and actual exports.
3. Request `get_install_command` for those IDs with the same version, the host's
   `next` or `vite` framework, and `npm` or `pnpm`. Keep its exact CLI version,
   Registry URL, warnings and distinction between static and consumer checks.
4. Inspect the returned dry run before installation. Integrate through actual
   installed paths and public contracts, then check the affected business flow.

Keep the version on every subsequent call, including paginated reads and
`get_skill`. A cursor belongs to its original version and parameters. If the
service returns `VERSION_UNAVAILABLE`, use the previously saved fixed catalog
and item links, or explicitly restart selection from the current version. Do not
combine an old detail with a new install command.

## Static discovery or MCP unavailable

Enter through the documentation site's `/llms.txt` and follow its catalog link.
For a release catalog, retain its immutable `catalogUrl` and read the item links
from that catalog. Follow the pinned installation guide and verified CLI /
Registry binding from the same release; inspect CLI help before assuming a
command exists. Do not construct a command from `latest` or a Preview URL.

A development catalog has a null `catalogUrl` and no verified installation
binding. Its static item pages can guide source-repository work, but cannot prove
a public install combination. Use a matching trusted local release when one is
available; otherwise report the missing provenance and inspect installed source.
An unreachable fixed resource is an error, not permission to substitute another
version silently.

## Read Skills separately from installing them

`get_skill` returns an allowlisted reference, not the installed Skill bundle.
Use its reported reference names and available sections rather than guessing
paths or headings. For a long response, follow the complete continuation
arguments, retaining the same version. Non-Markdown references are text only;
reading a script does not authorize executing it.

To install or update Skills, follow the exact release's full installation guide:
verify manifest and ZIP hashes, install both paired directories, and preserve
local modifications according to that guide. The Skill release identity and ZIP
hash have different roles; do not interchange them.

## Handoff

Record the catalog / Registry / Skill / CLI identities actually used, selected
stable IDs, installed-source differences and checks performed. Development,
static closure, representative consumer and business-flow evidence have separate
scopes. Missing release binding or runtime evidence remains unchecked.
