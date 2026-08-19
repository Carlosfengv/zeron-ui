# @zeron/tokens

Zeron Design 的可发布语义 Design Token 包。

```bash
pnpm add @zeron/tokens
```

在全局样式入口导入 CSS 变量和 Tailwind v4 `@theme` 映射：

```css
@import "@zeron/tokens/styles.css";
```

在 JavaScript 或 TypeScript 中读取 token 元数据：

```ts
import { semanticTokens, surfaceTokens } from "@zeron/tokens";
```

`tokens.css` 不包含字体文件；消费项目应自行加载所选字体。
