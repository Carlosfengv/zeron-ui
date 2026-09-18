# Migration workflow

1. Record source state and baseline product checks. Pin the Registry; local release candidates must actually be served or available to the installer. Preserve unrelated user edits.
2. Map components and every caller before replacing shared files. Document form events, data types, query state, focus, async errors and responsive behavior.
3. Preview installation closure. `add --dry-run --overwrite` can inspect a conflicting plan without writes, but does not authorize blind overwrite. Package/lockfile/CSS side effects still need review.
4. Snapshot every affected file including CSS, package, lockfile and `.zeron/install-state.json`. Identify existing source customizations and move domain logic to project-owned adapters. Recheck hashes immediately before applying changes.
5. Install a batch only when all conflicts in its closure have a resolution. The current overwrite flag applies to the batch, not individual files. Use the project's actual aliases and package manager.

The pinned installer's explicit Registry targets follow the root/`src` layout. Current development CLI resolves TypeScript aliases and rejects disagreements before writes. If it reports an unsupported layout, do not bypass this check or relocate existing components as a routine side effect. Determine whether a coherent layout change is already in scope; otherwise record the installation gap. Older CLIs may lack this guard, so test unfamiliar layouts in an isolated copy first.
6. Adapt callers and verify the batch. Keep public UI implementations unchanged. Temporary compatibility adapters require an explicit removal condition; avoid a permanent generic wrapper around all Zeron components.
7. Replace shell/layout/theme as required by the frozen scope. Shared root themes and portals may force larger coherent batches; inspect impact before continuing. Preserve routes and business state, one shell, direct-child layout contracts and deliberate scroll ownership.
8. Repeat by dependencies. Then clean old imports, providers, CSS, files and unused direct dependencies, considering scope-external consumers. Necessary transitive packages are not residual UI by themselves.
9. Perform the final scan and fresh product checks after cleanup. Record evidence and report honest coverage.

Use the paired builder's integration, adaptation, composition and verification references for implementation details. Its default “preserve existing shell” applies to ordinary page changes; explicit full migration authorizes replacing that shell implementation, while retaining navigation behavior and avoiding duplicate shells.

Real gaps require either a canonical library change with appropriate Registry verification, an accepted retained component, or a blocked item. Do not patch component internals or alter baselines just to make checks pass.
