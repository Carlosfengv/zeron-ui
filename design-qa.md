# Design QA: AvatarWithDetails

- Reference: `/var/folders/r5/6gjktm311kjf665jpm4bfyz40000gn/T/codex-clipboard-abdb1f25-2bf5-4e98-ab61-81d58931c571.png`
- Implementation: `public/component-covers/avatar-light.jpg`
- Combined comparison: `/Users/carlos/.codex/visualizations/2026/09/07/01a079d4-56d2-71a1-8a62-da4903710c68/avatar-design-qa.png`

## Result

Passed.

- Matches the reference composition: circular avatar, inline name and badge, and muted secondary detail.
- Uses the regular 32px avatar, body/label typography, spacing, foreground, and inverse-surface tokens.
- The implementation uses an existing product avatar asset; the reference person's photo is not copied into the library.
- The generated component cover intentionally omits the documentation chrome and auto-scales its subject for gallery legibility.
- Verified in the live documentation page at desktop width and at a 390px viewport. The regular-density composition leaves additional room for long names without causing root overflow.
- No browser console errors were reported.
