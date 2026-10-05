/**
 * Text shared by fixed Markdown and MCP's paginated examples section.
 * @param {Array<{exampleId: string, source: string, instructions: string, verification: string, profiles: Array<{framework: string, packageManager: string}>}>} links
 */
export function renderExampleLinks(links) {
  return links.map(link => `### ${link.exampleId}\n\n- [Source entry](${link.source})\n- [Run instructions](${link.instructions})\n- [Fixed verification report](${link.verification})\n- Verified combinations: ${link.profiles.map(profile => `${profile.framework} × ${profile.packageManager}`).join(", ")}\n`).join("\n");
}

/** The archived manifest owns hostEntry/hostAdoptedItems; page coverage stays separate. */
export function renderHostSources(examples, catalogUrl) {
  if (!examples || !catalogUrl) return "";
  const base = catalogUrl.slice(0, -"/catalog.json".length);
  const url = path => `${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
  return `\n### 完整示例宿主\n\n- [完整源码清单](${url(examples.sourceManifest.path)})：先读取 declarations.hostEntry，再读取该入口及 hostSources。\n- hostAdoptedItems 描述整个宿主；页面 adoptedItems 只描述该页面，不据此提高宿主组件的 coverage。\n- 可替换业务路由、数据与回调，保留公共组件组合。\n${examples.sources.map(file => `- [${file.path}](${url(file.path)})`).join("\n")}\n`;
}
