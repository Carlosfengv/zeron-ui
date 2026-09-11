# Design QA: credit-usage-01

- Reference: `/var/folders/r5/6gjktm311kjf665jpm4bfyz40000gn/T/codex-clipboard-20f4ad36-3790-4881-a07e-4d892d67387e.png`
- Implementation screenshot: `/Users/carlos/Downloads/zeron-ui/.codex/design-qa/credit-usage-01.jpg`
- Combined comparison: `/Users/carlos/Downloads/zeron-ui/.codex/design-qa/credit-usage-01-comparison.jpg`
- Preview: `http://127.0.0.1:3002/en/block-demo/credit-usage-01`
- Comparison viewport and state: 2048 × 1280, light theme, current cycle, auto-switch enabled

## Visible comparison

- Preserves the source hierarchy: compact title and plan badge, cycle selector, dominant percentage, segmented credit bar, depletion note, model attribution, automatic-switch setting, and plan actions.
- Uses the repository's Card, Badge, Tabs, Switch, Button, InlineNotice, icon, color, surface, border, typography, and shadow contracts.
- Applies the requested density change deliberately: default buttons and tab triggers are 32px, the usage bar is 28px, the card is capped at 520px, and Block section padding is standardized at 12px.
- Adds model identity without changing the usage-color encoding: Claude, OpenAI, and Gemini rows use their official library marks; unrecognized/private models use the shared fallback icon and can supply a custom logo through the Block API.
- The original screenshot is the visual source, while the implementation uses Zeron semantic tokens; minor color and icon-shape differences are theme-library differences rather than hardcoded approximations.
- Verified the 390 × 844 responsive state: header controls wrap, model attribution becomes one column, the automatic-switch row remains readable, and footer actions wrap without horizontal overflow.
- Verified cycle switching, automatic-switch toggling, set-limit feedback, and upgrade feedback in the live preview.

## Iteration history

1. Built a 930px source-scale composition from existing Zeron components and matched the supplied desktop hierarchy.
2. Reduced the complete density system after review: 36px actions became 32px, the card width became 840px, the progress bar became 32px, and typography, section padding, gaps, and rows were tightened proportionally.
3. Rechecked desktop source comparison and mobile wrapping, then restored the default preview state.
4. Added 18px provider logos inside 20px aligned slots, visually checked their color, optical size, row alignment, and fallback behavior against the compact 32px control scale.
5. Replaced the Block's 20–28px responsive section padding with a consistent 12px horizontal and vertical rhythm, then rechecked the rendered hierarchy and alignment.
6. Reduced the segmented progress bar from 32px to 28px while preserving its radius, segment proportions, labels, and accessibility semantics.
7. Reduced the card maximum width to 520px and converted model attribution to a permanent single-column list with one model per row.

## Final result

passed
