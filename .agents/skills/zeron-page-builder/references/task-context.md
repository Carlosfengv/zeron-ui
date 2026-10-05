# 按任务读取 Zeron 上下文

先检查实际项目的框架、组件别名、安装版本、主题/provider、路由和宿主布局。以下分流不要求安装 Skill；通过同版本 get_skill 或静态资源读取即可。

| 任务 | 需要的上下文 |
| --- | --- |
| 空项目创建后台 | [选型](selection-guide.md)、[布局归属](composition-contracts.md)，再读选中 AppShell/Sidebar/PageLayout 的 usage/api/examples |
| 已有应用新增页面 | 保留现有宿主，读相关页面组合和[页面标题](page-header-contracts.md)；不新增第二套外壳 |
| 修改少量控件 | 只读相关组件 usage/api；普通图文 Button 使用图标插槽，children 是标签 |
| 接入接口、权限或业务状态 | [项目适配](project-adaptation.md)及组合的数据/回调接口 |
| 主题或迁移 | 先确认改变宿主的授权范围，再读主题适配或 swap-to-zeronui 对应流程 |

页面任务依次明确：已有宿主、任务结构、样式与业务修改边界、选中组件、业务状态、自查范围。保留简短工作记录，不为小改动额外创建计划文档。

业务数据、菜单、路由、权限、接口和状态适配由项目拥有；组件的几何、surface、focus/disabled/loading 和交互反馈按公开 API 保留。主题通过已支持的统一入口设置。不要用内部 data-slot CSS、全局样式或修改受管理文件掩盖调用错误；合法业务排列与可视化可以自定义。

完成后在实际业务路由运行[消费者自查](consumer-verification.md)，再核对真实动作、失败/空/权限状态及键盘路径。构建通过不证明图标对齐、侧栏行为或业务连接完成。

MCP 的每次后续读取保留 catalogVersion，reference 使用响应中列出的精确路径；较长内容按 continuation 继续。未提供某组件指南时检查实际安装源码，不按别的组件猜 API。开发目录不能证明正式安装组合可用。
