# Full migration review

- Region inventory includes shell, navigation, resources and login, with pinned candidates and reasons. Existing shell presence is not used as the sole reason to retain it.
- Inspect actual public imports, DOM and CSS: one shell owner; justified page/auth layouts; explicit bounded heights and scroll owners. A wrapper that merely keeps old shell styling or generic control APIs does not satisfy full adoption.
- Reconcile retained `.legacy-*` rules with callers and responsibilities. Zero old package imports is insufficient if custom page and login surfaces still supply the old design system.
- Exercise navigation to both routes, resource loading/empty/error/retry, username validation, pending and failed login using documented API fixtures. Payload remains `{username,password}`. No real authentication claim from mocks.
- Inspect direct-child slots, narrow/wide layout, long resource names, keyboard focus and error visibility. No additional registration, social login, notification or theme features.
- Require separate functional, design-contract and browser outcomes. If a selected layout is absent despite green functional tests, contract is failed and completion is partial. Known Vite scanner false positives remain raw tool non-passes.
- Change a listed screenshot or region report after verification: the attachment verifier must fail; merely refreshing hashes without checking the change is not an acceptable recovery.
