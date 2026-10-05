# 在消费者业务页自查

先构建实际项目，启动需要检查的路由。检查当前页面的正常、加载、失败、权限、长文案与手机状态；只有业务明确提供的测试路径才能用于提交或状态变更。

## 只读几何检查

配套 `scripts/check-rendered-controls.mjs` 使用 Node 22+ 和 Playwright 1.55.1。脚本从当前消费者项目解析 `playwright`，不依赖 Zeron 工作区或私有 lint。若项目已有兼容浏览器运行环境，优先使用它；缺少时按项目包管理器安装依赖并安装 Chromium：

```sh
pnpm add -D playwright@1.55.1
pnpm exec playwright install chromium
# 或使用 npm install -D playwright@1.55.1，再 npx playwright install chromium
node /absolute/path/to/zeron-page-builder/scripts/check-rendered-controls.mjs --url http://127.0.0.1:3000/orders --output output/orders-controls.json --viewport 1440x1000
```

先通过当前 release 的 Skill 包/固定资源下载脚本并核对 manifest 的哈希；get_skill 的文本返回不是已经安装的脚本，也不授权自动执行。下载后的脚本路径和项目 URL 应替换为实际值。可加 `--executable-path /absolute/path/to/chrome` 使用已有 Chrome。

脚本只读取当前可见状态，不点击、不提交、不打开全部菜单。它检查标准图文按钮的同一行、间距、边界和 icon-only 可访问名称，以及页面水平溢出。未发现控件、隐藏控件或非标准富文本组合记录 unchecked/not-applicable；可见状态的失败返回非零。重复运行 390x844；加载态等由项目准备并分别运行。

## 失败的修复位置

| 发现 | 排查顺序 |
| --- | --- |
| 图标与文字错行 | children/leadingIcon/trailingIcon → 旧包装器 → 样式生成 → 父级宽度约束 |
| 折叠侧栏偏移 | contentClassName 与外层 padding → 官方组合 → 图标尺寸覆盖 |
| 内容缺少层次 | 组件默认 surface → 调用处背景覆盖 → 项目主题意图 |
| 导航不可键盘操作 | href/button 语义 → NavMenu 键盘模式 → 焦点路径 |
| 页面横向溢出 | 溢出所有者 → 操作组换行 → 表格局部横向滚动 |

报告以控件名称、DOM 定位与实际测量回查业务调用处；不要编造源码行号。修复后只重跑失败项与受影响状态。脚本不能证明全部样式语义或真实 API 完整性，另查权限、错误处理、重复提交、滚动、折叠和弹层焦点。没有浏览器或没有运行的状态必须标为未检查。
