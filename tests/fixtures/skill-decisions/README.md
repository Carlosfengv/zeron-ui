# Skill decision regression cases

These are fixed consumer inputs and review criteria for an agent evaluation, not a test that searches skill prose for keywords. The shared Vite input intentionally has an old shell, custom page CSS and a username login. Its API calls have no backend here; mocked browser coverage must remain distinct from real-service verification.

## Prepare each run

1. Create a new temporary directory for each case. Copy every file under `input/`, preserving relative paths and removing the final `.txt` extension. For example, `input/src/App.tsx.txt` becomes `src/App.tsx`.
2. Install the fixture's npm dependencies and record the resulting lockfile. Run its baseline build and capture baseline screens. Pin the Zeron CLI and Registry actually used, with hashes; save this information with the evaluation. Registry changes between runs require a new baseline, not a silent comparison.
3. Copy both current source skills into the fixture's `.agents/skills/`. Give the executing agent only the chosen `prompt.md` and the prepared project. Do not expose `review.md` as implementation instructions. Use a fresh independent agent when available and authorized; otherwise record that the exercise is a maintainer walkthrough, not an independent behavioral test.
4. Ask it to perform the requested change, saving its actual diff, region decisions, checks, raw tool output, browser evidence and final conclusion. Keep all outputs in the temporary project or ignored `output/skill-evaluations/<case>/`, never in the source fixtures. Use controlled API fixtures for browser testing: GET `/api/resources` returns an array of `{id,name}`; POST `/api/session` accepts `{username,password}` or returns 401. Document those fixtures as mocks.
5. Review with that case's `review.md`. Inspect the final implementation and execute the build/flow checks, not just the final prose. Record each criterion as passed, failed or unchecked with evidence. A case passes only if every required criterion is demonstrated; missing browser coverage remains unchecked. Preserve legitimate migration gaps and raw CLI errors rather than requiring the agent to claim success.

## Cases and outputs

| Case | Prompt | Reviewer criteria | Main failure detected |
| --- | --- | --- | --- |
| Scoped page | [prompt](scoped/prompt.md) | [review](scoped/review.md) | Unrequested shell or authentication replacement |
| Full migration | [prompt](full/prompt.md) | [review](full/review.md) | Old CSS/compatibility APIs remain while report says complete |
| Vite login port | [prompt](login-port/prompt.md) | [review](login-port/review.md) | Forced Next installation, invented product capabilities or untraceable redesign |

Additional evidence integrity cases run automatically in `tests/skill-evidence.test.mjs`; they do not prove the agent made correct design decisions. `tests/skill-distribution.test.mjs` verifies the same helper after extraction into a project without Zeron dependencies.
