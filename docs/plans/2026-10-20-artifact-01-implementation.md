# Artifact block implementation

Reference: https://hextaui.com/preview/blocks/artifact (inspected 2026-10-20).

The reference uses a resizable conversation and a generated document panel. The initial pricing HTML streams in Code and switches to Preview on completion. The panel supports reload, copy, download, expand and close. Follow-up prompts append versions; a version menu and a changes toggle provide historical inspection. Message cards reopen the represented version. Other examples produce Markdown and TypeScript.

The implementation preserves Zeron’s existing shell, theme, component geometry and responsive ownership. ArtifactWorkspace composes ChatWorkspace and ArtifactPreviewPanel; GeneratedArtifactCard composes ArtifactCard. This follows the requested adaptation into the existing system. No reference font, icon, favicon, or global CSS replaces the host design system. No external assets are needed.

Panel structure: title / version / expand / close; Code / Preview / Changes tabs and document actions; scrollable code or Markdown, or a full-height sandboxed HTML frame; status and historical restore action. The host owns documents and revisions. Restoring appends a revision. Content-generation states are ready, streaming and error. Browser fullscreen provides Escape and focus management.

ChatWorkspace owns desktop split sizing and uses a single pane below its 760px container threshold. The preview toolbar wraps on narrow containers. ChatThread owns conversation scrolling and the shared InputMessage composer. This block does not introduce another shell or replace shared primitives.

Verification evidence and component inventory: `output/artifact-01/`. Demo generation uses local presets, with no model or persistence service.
