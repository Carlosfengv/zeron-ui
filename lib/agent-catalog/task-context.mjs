export const taskContextReference = "references/task-context.md";

/** Keep older snapshots truthful: never advertise a reference they do not contain. */
export function hasTaskContext(skills) {
  return Object.hasOwn(skills?.["zeron-page-builder"] ?? {}, taskContextReference);
}

/** @param {string | null} catalogUrl */
export function taskContextHint(skills, catalogVersion, catalogUrl = null) {
  if (!hasTaskContext(skills)) return "";
  const args = { name: "zeron-page-builder", reference: taskContextReference, catalogVersion };
  const base = catalogUrl ? catalogUrl.slice(0, -"/catalog.json".length) : `https://zeron-ui.vercel.app/ai/releases/${catalogVersion}`;
  return `页面任务先按任务读取布局、业务适配和验收规则；少量控件修改只需相关 usage/api。\nget_skill arguments: ${JSON.stringify(args)}\nStatic context: ${base}/skills/zeron-page-builder/${taskContextReference}`;
}

export function staticTaskContext(skills) {
  return hasTaskContext(skills)
    ? "\n## Task context\n\n[按任务读取布局、业务适配和消费者验收规则](../skills/zeron-page-builder/references/task-context.md)。新后台选择标准宿主；已有应用保留宿主；少量控件只读相关契约。\n"
    : "";
}
