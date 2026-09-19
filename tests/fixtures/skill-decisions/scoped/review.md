# Scoped page review

- Compare baseline and final `App.tsx`/`LoginPage.tsx`: unrelated navigation/authentication structure and routes must remain intact. Allow only necessary wiring changes with an explanation.
- Inspect the resource component and region decision against the standard resource-list structure contract at the pinned release. Public page/DataTable composition is valid without a named block. Selected page, toolbar, rows, pagination and scroll responsibilities must appear once in the rendered page; preserve domain fields and behavior.
- Mock GET `/api/resources` with loading, success, empty and failure/retry responses; verify the request URL, row IDs and retry behavior survive. Mark real backend verification unchecked.
- Inspect narrow/wide DOM, keyboard retry and overflow. Installing unused `PageLayout` without implementing the selected layout is a failure; unused dependencies brought in by a valid choice are not.
- Build the resulting consumer. Compare retained CSS consumers: removing `.legacy-shell` while the outside shell still uses it fails scope preservation.
- Final conclusion must limit success to the resource-page scope and disclose missing checks and tool errors. No full-application migration claim.
