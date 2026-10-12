# Zeron Design

[English](README.md) · **简体中文**

基于 [shadcn/ui](https://ui.shadcn.com)、[Base UI](https://base-ui.com) 和 Tailwind CSS 构建的 React 组件与区块。细腻的悬停反馈、清晰的交互动效，源码可自由定制。

[官网](https://zeron-ui.vercel.app) · [文档](https://zeron-ui.vercel.app/docs) · [反馈问题](https://github.com/Carlosfengv/zeron-ui/issues)

## 特点

- **组件与区块** — 用于构建表单、数据表格、仪表盘和应用布局。
- **交互动效** — 通过弹簧过渡和接近式高亮，让操作与状态变化更清晰。
- **灵活定制** — 支持语义化设计令牌、明暗主题和图标替换。
- **源码归你** — 将组件安装到项目中，按产品需求直接修改。

## 快速开始

准备一个已配置 Tailwind CSS 4 的 React 19 项目，并使用 Node.js 20.18.1 或更高版本。

如果项目中还没有 `components.json`，先完成初始化：

```bash
npx zeron-ui@latest init
```

添加需要的组件：

```bash
npx zeron-ui@latest add button dialog popover
```

CLI 会安装组件源码并自动处理依赖。更多命令与选项请查看 [CLI 使用指南](packages/cli/README.md)。

## 文档

- [组件](https://zeron-ui.vercel.app/docs/components) — 交互示例、API 和使用方法。
- [区块](https://zeron-ui.vercel.app/docs/blocks)与[页面](https://zeron-ui.vercel.app/docs/pages) — 组合式 UI 与应用布局。
- [图标](https://zeron-ui.vercel.app/docs/icons) — 图标库与自定义 Provider。
- [Agent Skills](https://zeron-ui.vercel.app/docs#skills) — 让 AI 助手构建页面或迁移现有 React UI。
- [llms.txt](https://zeron-ui.vercel.app/llms.txt) — 面向 AI 助手的文档索引。

## 项目结构

```text
app/                Next.js 路由与站点入口
docs/               文档内容与示例
packages/
  ui/               React 组件
  blocks/           组合区块与页面模板
  cli/              zeron-ui 命令行工具
  icons/            图标 Provider 与资源
  tokens/           语义化设计令牌
  registry/         Registry 构建工具
  lint/             设计规范检查规则
public/             静态资源与生成的 Registry 文件
scripts/            构建与验证脚本
tests/              自动化测试与使用方测试项目
```

## 参与贡献

欢迎提交 Issue 和 Pull Request。本地运行文档站需要 Node.js 22 和 pnpm 10.12.4：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 [localhost:3000](http://localhost:3000)。验证检查、Registry 更新和发布流程请查看[维护指南](docs/maintaining.md)。

## 开源协议

[MIT](LICENSE) © Zeron Design
