---
schema_version: 1
name: file-upload-01
kind: block
status: stable
summary: Container 内的受控文件上传队列，支持选择、拖拽、进度、取消、清空和重试。
registry_import: "@/components/blocks/file-upload-01"
source: packages/blocks/src/application/file-upload-01/file-upload.tsx
registry: packages/blocks/registry.json
related:
  - container
  - info-item
  - chart-primitives
  - badge
  - button
  - badge
  - inline-notice
  - separator
---

# File Upload 01

Use as an embedded file upload surface. The root is Container; the block does not add an application shell or dialog.

```tsx
import { FileUpload } from "@/components/blocks/file-upload-01";

<FileUpload items={queue} onFilesSelected={addFiles} onRemove={cancelOrRemove} onRemoveAll={clearQueue} onRetry={retryUpload} onDone={finish} />
```

- Supply stable, unique item IDs, name, size and uploadedBytes in bytes, and explicit queued/uploading/complete/error status. The host owns upload transport, queue updates and cancellation. Removing an uploading item should abort its host-owned request.
- Browse and drag-and-drop send accepted files to the same onFilesSelected callback. maxFileSize defaults to 20,000,000 bytes; files over the limit are rejected individually with visible feedback. No extension restriction is implied by the reference.
- Selection is guarded while the callback promise is pending. Rejections show an alert. Missing callbacks disable their corresponding actions. The Done action requires a nonempty queue of completed files.
- Progress is clamped to 0–100; a complete status always displays completion. Unknown/non-finite totals have 0% progress. Progress uses accessible progressbar semantics; it is not a health timeline.
- Override labels for localization. footerActions accepts a host-owned menu; without it no inert options trigger is displayed.
- The header uses the default 14px body typography and has no close control. An empty queue renders no list or placeholder message.
- Container, ContainerHeader, ContainerFooter, InfoItemGroup, InfoItem, its leading/content/title/description/trailing parts, Badge plain, Badge, Button, InlineNotice and Separator retain their public styling and surface contracts. Native elements arrange business content. SegmentedBar capacity mode owns progress geometry and semantics; its public color prop references var(--brand). InfoItemTitle and InfoItemDescription own 14px/12px typography; InfoItemLeading owns the 32px frame and 16px icon. File-type Badge sits beside the title, not over the icon. Do not enlarge icons or override font family/letter spacing. The shared icon system supplies document and action icons. Default brand tokens own the accent color.
- The documentation demo uses local simulation, initially frozen at the reference values. Its menu starts/pauses the simulation or resets the fixture. File data never leaves the browser.
