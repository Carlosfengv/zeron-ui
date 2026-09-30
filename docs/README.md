# Documentation domain

This directory owns documentation content, document UI, demos, navigation data,
content loading, and documentation SEO helpers.

Next.js route files and site-wide locale negotiation stay in `app/`. Public
components and installable source stay in `packages/` as those packages are
migrated.

`i18n/content-loaders.generated.ts` is the explicit, statically analyzable
document-message import map. Update it through the document loader generator
when entries are added; do not add arbitrary runtime imports.

Component, block, and page detail routes are generated from the document
manifest and loader maps. Run `pnpm docs:routes:build` after adding a document;
`pnpm build` checks that all split route files are current.
