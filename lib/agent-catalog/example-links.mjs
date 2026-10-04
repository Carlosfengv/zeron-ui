/**
 * Text shared by fixed Markdown and MCP's paginated examples section.
 * @param {Array<{exampleId: string, source: string, instructions: string, verification: string, profiles: Array<{framework: string, packageManager: string}>}>} links
 */
export function renderExampleLinks(links) {
  return links.map(link => `### ${link.exampleId}\n\n- [Source entry](${link.source})\n- [Run instructions](${link.instructions})\n- [Fixed verification report](${link.verification})\n- Verified combinations: ${link.profiles.map(profile => `${profile.framework} × ${profile.packageManager}`).join(", ")}\n`).join("\n");
}
