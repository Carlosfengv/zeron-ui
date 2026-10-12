---
schema_version: 1
name: file-type
kind: component
status: stable
locale: zh-CN
summary: 折角文件格式图标，支持 99 种扩展名、四种样式和六档尺寸。
package_import: "@zeron/ui/file-type"
registry_import: "@/components/ui/file-type"
source: packages/ui/src/components/file-type.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [badge, file-thumbnail, file-tree]
---

# File Type

## Use when

- 在文件列表、附件、上传结果或文件详情中识别文件格式。
- 需要一致的折角纸张图标和可读扩展名，而不是文件内容预览。

## Do not use when

- 需要图片或 PDF 内容预览时使用 FileThumbnail。
- 需要文件操作、链接或上传行为时由宿主控件承担，FileType 只展示格式。

## API and composition

```tsx
import { FileType } from "@zeron/ui/file-type";

export function FileLabel() {
  return (
    <div className="flex items-center gap-3">
      <FileType fileName="Report.PDF" size="default" variant="outline" aria-hidden="true" />
      <span>Report.PDF</span>
    </div>
  );
}
```

- `extension` 可带前导点，不区分大小写，优先于 `fileName`。只传格式时使用 `extension="pdf"`。
- `fileName` 支持原始文件名、路径和绝对 URL，从最后一个后缀识别；`archive.tar.gz` 识别为 GZ。文件名中的 `#`、`?` 保持原义，仅在绝对 URL 中忽略查询参数和片段。没有后缀或只有一个前导点的文件显示 FILE。
- 未知格式保留扩展名，使用中性标签；超过 6 个字符仅缩写视觉标签，可访问名称不缩写。
- `variant` 为 `outline`（默认）、`solid`、`light`、`mono`。分类色复用 Badge 分类配色，不表示成功或危险状态。
- `size` 为 `mini` 18px、`xs` 24px、`sm` 32px、`default` 40px、`lg` 48px、`xl` 56px；通过公开 API 选择，不手工覆盖内部比例。
- 独立图标默认有 img 角色和完整文件名或格式名称；使用 `aria-label` 覆盖或 `aria-labelledby` 引用已有文案。紧邻文件名时使用 `aria-hidden="true"` 避免重复播报。
- 支持原生 SVG 属性与 SVGSVGElement ref。通过 className 调整外部布局，不覆盖图标内部颜色或几何。
- `fileTypeFamilies` 提供 11 类扩展名；`resolveFileType({ extension, fileName })` 返回规范化 extension、完整 label、family 与 color。未知分类为 null，颜色为 gray。

## Verification checklist

- [ ] 文件名识别与显式扩展名的优先级正确。
- [ ] 使用六档公开尺寸；浅色和深色下标签可读。
- [ ] 未知格式、无后缀和点文件具有合理回退。
- [ ] 独立图标有名称，紧邻文件名的装饰图标隐藏。
