---
schema_version: 1
name: dialog
kind: component
status: stable
locale: zh-CN
summary: 让用户在有焦点管理的临时界面中确认操作或编辑内容，异步提交由业务层管理。
package_import: "@zeron/ui/dialog"
registry_import: "@/components/ui/dialog"
source: packages/ui/src/components/dialog.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [button, field, mobile-drawer]
---

# Dialog

## 使用与选型

用于明确、短暂的确认或编辑任务。复杂详情优先独立路由；移动场景是否改为 MobileDrawer 由任务和现有外壳决定。不要把所有导航与内容都放进层叠 Dialog。

## 公共契约

- Root 提供 `open`、`defaultOpen`、`onOpenChange(open)`、`modal`。Zeron 回调只有布尔值，不能假设获得底层事件详情。
- Trigger／Close 复用底层 `render` 组合，例如 `render={<Button ... />}`；不能把其他库的 `asChild` 当成这里的契约。
- Content 的公开尺寸只有 `sm | lg`，默认 sm。Title／Description 保留对话框的可访问命名与说明。
- `container` 可指定嵌入区域的 Portal 目标；其定位容器和 modal 语义一起设计。普通页面保留默认模式与现有 Portal／主题 Provider。
- Content 已包含关闭按钮。关闭流程、未保存确认与异步状态由受控 Root 协调，不修改组件内部实现。

## 异步确认

```tsx
"use client";
import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@zeron/ui/dialog";
export function DeleteResourceDialog({ canDelete, onConfirm }: {
  canDelete: boolean; onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    if (!canDelete || pending) return;
    setPending(true); setError(null);
    try { await onConfirm(); setOpen(false); }
    catch { setError("删除失败，请重试。"); }
    finally { setPending(false); }
  }
  return <Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next); }}>
    <DialogTrigger render={<Button type="button" variant="secondary" disabled={!canDelete} />}>删除资源</DialogTrigger>
    <DialogContent size="sm">
      <DialogHeader><DialogTitle>删除资源？</DialogTitle><DialogDescription>此操作会永久移除该资源，请确认其影响。</DialogDescription></DialogHeader>
      {error && <p role="alert">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>取消</Button>
        <Button type="button" variant="destructive" loading={pending} disabled={!canDelete} onClick={confirm}>删除资源</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
```

## 业务与验收

回调必须绑定具体资源与真实授权；示例仅定义接入边界。成功后再关闭，失败保留上下文并可重试。编辑任务保存 dirty 草稿，关闭前处理未保存修改；若提交中阻止关闭，应提供明确进行中反馈，并避免无限挂起。

验证打开时焦点、Tab 范围、Escape／关闭策略、关闭后焦点恢复、长文案、窄屏、滚动、Portal 主题及重复提交。示例只由 `agents:guides:examples:check` 做类型检查，未代替这些交互或真实后端验证。不要通过移除 modal、焦点环或动画实现来让局部演示通过。
