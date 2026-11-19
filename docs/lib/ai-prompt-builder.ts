import { ZERON_DESIGN_TASTE_RULES } from "@/lib/agent-catalog/design-rules.mjs";

export interface AiDesignPromptOptions {
  kind: "component" | "block" | "page";
  registryName: string;
  installItems: string;
  contractUrl: string;
  title: string;
  description?: string;
  locale?: string;
  relatedComponents?: string[];
}

export function buildAiDesignPrompt({
  kind,
  registryName,
  installItems,
  contractUrl,
  title,
  description,
  locale = "zh-CN",
  relatedComponents = [],
}: AiDesignPromptOptions): string {
  const isEn = locale === "en";
  const rules = isEn ? ZERON_DESIGN_TASTE_RULES.en : ZERON_DESIGN_TASTE_RULES.zh;

  if (isEn) {
    const taskLine =
      kind === "component"
        ? `Please design and implement a polished UI section using Zeron Design's \`${title}\` (\`${registryName}\`) component${description ? ` (${description})` : ""}.`
        : `Please design and adapt a product interface based on Zeron Design's \`${title}\` (\`${registryName}\`) ${kind === "page" ? "page template" : "block"}${description ? ` (${description})` : ""}.`;
    const relatedLine =
      relatedComponents.length > 0
        ? `\nKey Zeron building blocks involved: ${relatedComponents.map((c) => `\`${c}\``).join(", ")}.`
        : "";
    return `${taskLine}${relatedLine}

Install / inspect source:
\`\`\`bash
npx zeron-ui add ${installItems}
\`\`\`
Design & implementation contract: ${contractUrl}

Follow Zeron Design's 5 core aesthetic & layout rules:
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
  }

  const taskLine =
    kind === "component"
      ? `请使用 Zeron Design 的「${title}」（\`${registryName}\`）组件为我的页面设计并实现对应的界面区域${description ? `（组件定位：${description}）` : ""}。`
      : `请参考 Zeron Design 的「${title}」（\`${registryName}\`）${kind === "page" ? "整页模板" : "业务模块"}版式与交互质感，结合我的业务需求进行设计改写${description ? `（模板定位：${description}）` : ""}。`;
  const relatedLine =
    relatedComponents.length > 0
      ? `\n推荐协同组合的 Zeron 底层组件：${relatedComponents.map((c) => `\`${c}\``).join("、")}。`
      : "";

  return `${taskLine}${relatedLine}

安装命令：
\`\`\`bash
npx zeron-ui add ${installItems}
\`\`\`
组件与版式设计契约（供 AI 读取）：${contractUrl}

在设计与生成代码时，请严格遵守 Zeron Design 的 5 条审美与版式准则：
${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
}
