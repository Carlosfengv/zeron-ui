import { Field, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";

/** Rendered to static HTML with the same component/theme sources as the docs. */
export function ArtifactPreviewDocument({ locale, updated }: { locale: "en" | "zh-CN"; updated: boolean }) {
  const zh = locale === "zh-CN";
  return <main className="min-h-screen space-y-4 bg-surface-floating p-6 text-fg-default">
    <h1 className="text-heading font-semibold">{zh ? updated ? "欢迎回到项目" : "欢迎来到项目" : updated ? "Welcome back" : "Welcome to the project"}</h1>
    <p className="text-body text-fg-muted">{zh ? "切换代码与预览，输入内容会保留；刷新预览会重建页面。" : "Switch between Code and Preview to retain this input; reloading rebuilds the page."}</p>
    <Field name="draft" className="max-w-sm">
      <FieldLabel>{zh ? "预览内的草稿" : "Draft inside the preview"}</FieldLabel>
      <Input name="draft" size="md" placeholder={zh ? "在这里输入" : "Type here"} />
    </Field>
  </main>;
}
