# Component and style handoff

## Statistics

State the task scope, files checked/total, distinct component kinds and JSX use count, remaining errors/warnings and static check status in one short paragraph. Include new/existing/resolved counts only when the baseline is comparable.

## Components

| Category | Components used | Kinds / JSX uses |
| --- | --- | --- |

Group Block, UI, business and third-party components; omit empty categories. Give only a count for private library helpers. Explain custom implementations or alternatives not adopted only when they matter to the task.

## Issues and explanation

| Location | Issue or justified customization | Reason / next action |
| --- | --- | --- |

Omit the table when there are no issues. Give a short sentence for unavailable checks and unreviewed states. Keep component/token violations, justified customization and unchecked items distinct. Do not call missing checks passed.

Keep source paths, all use locations, rule coverage, token reference lists and evidence metadata in the linked JSON or existing migration evidence. Show at most ten issue rows and link the rest. No overall compliance percentage from partial checks.
