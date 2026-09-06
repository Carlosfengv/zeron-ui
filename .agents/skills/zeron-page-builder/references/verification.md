# Verification

Use this reference before choosing checks and before handing off a Zeron implementation. Match effort to the change and report actual coverage.

## Discover available checks

Inspect the target project's package scripts, CLI help, and installed dependencies. Do not assume a future Zeron usage checker or MCP exists.

Common current capabilities may include:

- `npx zeron-ui add <items> --dry-run` for the planned install;
- `npx zeron-ui doctor --check` for recorded installation presence and basic compatibility;
- the project's typecheck, lint, unit, integration, and production build scripts;
- browser automation or a running development application.

`doctor --check` does not automatically prove that managed source is unchanged, component usage is semantically correct, styles respect contracts, or the page behaves correctly. Inspect what the current command actually checks.

If a future `zeron-ui inspect`, `contract`, or `check` command is present in CLI help, use its documented behavior. Do not invoke these names merely because they appear in planning material.

## Verify three layers

### Installation and provenance

Confirm the planned or installed files, aliases, dependency versions, required providers, Registry source, and known compatibility requirements. A missing or old installation record is `unchecked`, not healthy.

In a consumer project, test the installed consumer imports. A passing build of the Zeron source monorepo does not prove that consumer aliases or the Registry closure are correct.

### Contract usage

Review the change for:

- modifications or deletion of managed files;
- duplicated primitive behavior or a second application shell;
- props, slots, and callbacks that do not exist in installed source or types;
- broken compound-component or direct-DOM-child structure;
- internal state, color, focus, loading, portal, or surface overrides;
- new global styles that reach managed slots;
- demo data, no-op actions, fake integrations, and changes outside task scope.

Distinguish pre-existing differences from changes made for the current task. A similar component name is not sufficient evidence of duplication; trace import source and responsibility.

### Runtime and product behavior

Run the narrowest relevant type, build, and interaction checks, then broaden only when the risk or project convention requires it.

When a page can run, verify the primary interaction and relevant loading, empty, error, disabled, permission, overflow, and retry states. Check representative narrow and wide widths, long labels, keyboard focus, responsive navigation, scroll ownership, and overlays where they are part of the change.

Static source checks do not establish computed layout, contrast, portal placement, or keyboard behavior. Browser evidence is needed for those claims.

## Result states

Use these states precisely:

- `passed`: the named check ran successfully over the stated scope;
- `failed`: the check ran and found a problem;
- `unchecked`: required evidence or a tool was unavailable or could not cover the case;
- `excluded`: the scope was intentionally outside the current task or policy;
- `exception`: a specific, documented, authorized divergence applies.

Do not convert `unchecked` into `excluded` or `exception`. Do not reset a baseline, add an exception, or weaken a check to obtain a passing result.

If an automated checker provides warnings for probable duplicate components or dynamic styles, assess the evidence. Deterministic source or API violations can block completion; heuristic warnings require review and should not cause automatic destructive rewrites.

## Source-repository checks

For an authorized component or block change, run targeted contract tests first. Regenerate tokens or Registry content when the canonical source requires it, verify generated artifacts are current, and run the Registry checks and consumer smoke path appropriate to the affected item.

Do not manually edit final generated CSS or Registry JSON to make a check pass. Use the maintained source and generator.

## Consumer-project checks

Use the project's own commands and installed component paths. A proportional sequence is:

1. inspect the final diff and managed-file boundaries;
2. run component or page-specific tests;
3. run typecheck and the relevant build;
4. exercise the primary flow in the browser when UI behavior changed;
5. run broader repository checks when project policy or the change's reach requires them.

Do not install missing test infrastructure solely to claim coverage unless that infrastructure is part of the authorized task. Report the missing check instead.

## Handoff evidence

Report:

- chosen blocks, layouts, and important components with brief reasons;
- how business data, routing, permissions, theme, or icons were adapted;
- changed routes and files, identifying any intentional managed-source change;
- checks that passed, failed, or remained unchecked, with their scope;
- capability gaps, explicit exceptions, or external integration still required.

Do not list routine commands without their outcome. Do not claim backend, authentication, payment, analytics, or live-data integration is complete unless it was actually connected and verified.
