---
schema_version: 1
name: tree
kind: component
status: stable
summary: 展示或选择具有层级关系的通用节点、部门成员或文件目录。
package_import: "@zeron/ui/tree"
registry_import: "@/components/ui/tree"
source: packages/ui/src/components/tree/index.ts
registry: packages/ui/registry.json
related:
  - member-tree
  - file-tree
  - checkbox-group
  - select
  - combobox
  - dropdown
---

# Tree

## Agent intent

使用 Tree 展示可展开的层级数据，或从层级中选择实体。调用方必须为全部节点提供稳定、非空且全局唯一的 `key`，并为 Tree 提供 `aria-label` 或 `aria-labelledby`。

生成或修改界面时，必须遵守以下规则：

- 展开、焦点和选择是独立状态；方向键移动焦点时不得改变选择。
- `selectionMode="single"` 至多传入一个 `selectedKeys` 或 `defaultSelectedKeys`；多选必须显式声明 `selectionMode="multiple"`。
- `selectionIndicator="checkbox"` 只能与多选一起使用；`checkStrategy="cascade"` 也只能与多选复选框一起使用。
- 外部搜索只传入 `query` 或 `filterNode`，不要为了搜索裁剪 `items`；组件需要完整层级以保留祖先路径和正确计算级联。
- 行尾互动内容放进 `renderActions`。其中的图标 Button 必须提供 `aria-label`，并使用项目的 Button、Dropdown 等组件。

## Use when

- 展示或选择通用分类、地区、项目、权限、指标、资源等层级节点。
- 用户需要沿父子关系浏览、展开分支，并通过键盘完成定位或选择。
- 需要让一个明确的集合节点批量选择符合资格的后代，例如“选择某个分类下的全部指标”。
- 需要在节点尾部添加数量、状态、More 菜单或打开详情等局部信息与操作。

## Do not use when

- 数据没有层级且选项较少：使用 Select、RadioGroup 或 CheckboxGroup。
- 需要远程筛选、异步子节点加载、虚拟滚动、拖拽排序或弹出式 TreeSelect：这些能力当前不属于 Tree 的公共契约。
- 需要多列单元格、列头、行列键盘模型或表格级操作：单独设计 TreeGrid。
- 整个行点击应跳转到常规页面且不需要层级交互：使用链接或列表，而不是 Tree。

## Variant, density and hierarchy rules

| API | 使用场景 | 规则 |
| --- | --- | --- |
| `variant="plain"` | 页面已有明确容器或与内容连续排列 | 默认选择，不改变交互语义 |
| `variant="bordered"` | Tree 是独立工作区、选择器或需要明确边界的面板 | 不要用额外自定义边框重建组件表面 |
| `density="compact"` | 高密度资源、指标或文件列表 | 保持文本可读，适合工具区而非触控优先任务 |
| `density="regular"` | 一般层级浏览 | 默认选择 |
| `density="comfortable"` | 成员、较长描述或需要更大点击区域的任务 | MemberTree 默认使用此密度 |
| `showLines` | 深层结构需要辅助阅读 | 连接线表达关系，不能替代正确缩进和可访问层级 |
| `indent` | 适配受限面板或深层结构 | 使用有限且一致的值，必须是非负有限数 |

节点的 `label` 是可见标签、typeahead 文本和 treeitem 名称。`description` 与 label 同行展示，并作为补充说明；不要把唯一标识、长日志或主要操作塞入 description。

## Selection and entity semantics

- `selectionMode="none"` 用于展示型 Tree：Enter/Space 可切换分支，不传选择相关 props。
- `selectionMode="single"` 用于选择一个目标，例如一个项目、目录或指标；使用受控 `selectedKeys` 时始终传入至多一个 key。
- `selectionMode="multiple"` 且 `selectionIndicator="highlight"` 用于彼此独立的多实体选择。
- `selectionIndicator="checkbox"` 适合用户需要看见选择范围的批量任务。`checkStrategy="independent"` 只切换当前符合资格的节点；`cascade` 切换符合资格的整个后代集合，并在父节点显示 mixed 状态。
- `selectionScope="leaf"` 禁止直接选择分支；在 checkbox cascade 中，父分支仍可作为其可选叶子集合的开关。
- `disabled` 节点可被发现但不可展开或选择；有业务原因时提供 `disabledReason`。`readOnly` 保留浏览和展开，但锁定选择改变。
- 刷新数据后 `selectedKeys` 中无法解析的 key 会保留在回调详情的 `unresolvedKeys`；提交前由业务层决定是否清理或提示用户。

不要把“选择部门实体”与“选择该部门下全部成员”混为同一个配置：前者是 independent 选择 `department`，后者是 member-only checkbox cascade。

## MemberTree and FileTree

| 场景 | 组件与配置 | 返回的 key |
| --- | --- | --- |
| 选择一个或多个部门 | `MemberTree selectableTypes={["department"]}` + single 或 independent multiple | 部门节点 key |
| 按部门批量选择成员 | `MemberTree selectableTypes={["member"]}` + multiple checkbox cascade | 符合资格的成员 key，不含部门 key |
| 选择文件或目录 | `FileTree selectableTypes={["file"]}` 或 `selectableTypes={["folder"]}` | 文件或目录 key |
| 批量选择文件 | `FileTree selectableTypes={["file"]}` + multiple checkbox cascade | 符合资格的文件 key，不含文件夹 key |
| 限制可选文件类型 | `FileTree allowedExtensions={["pdf", "xlsx"]}` | 不允许的文件仍可见，但不可选择 |

MemberTree 会拒绝重复 `memberId` 或 `departmentId`。FileTree 根据 MIME type 和扩展名渲染文件图标。两者都会保留 Tree 的键盘、搜索、展开和无障碍契约。

## Controlled state, search and refresh states

- 简单静态 Tree 使用 `defaultExpandedKeys` 与 `defaultSelectedKeys`；当展开或选择需要和 URL、表单、权限或其他区域同步时，使用 `expandedKeys` / `selectedKeys` 及其回调。
- `onExpandedChange` 会报告变更的 key、展开结果和 pointer/keyboard 原因；`onSelectionChange` 提供新增、移除、已解析节点和未解析 key。
- `query` 支持默认的 label / keywords 匹配；需要领域匹配时使用 `filterNode(node, normalizedQuery)`。
- 查询期间命中节点的祖先会保持可见且展开；不要把这类临时展开状态写回业务的 `expandedKeys`。
- `loading`、`error` 或 `readOnly` 时不能改变选择。已有数据在 loading/error 下仍可显示；`onRetry` 只用于重新请求整棵树。
- `messages` 仅用于本地化 Tree 自身状态与辅助文本。业务错误、权限说明和空状态的业务指导应由页面提供。

## Composition

受控的指标叶子单选：

```tsx
import { useState } from "react";
import { Tree, type TreeNode } from "@zeron/ui/tree";

function MetricTree({ items }: { items: readonly TreeNode[] }) {
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>([]);

  return (
    <Tree
      aria-label="选择指标"
      defaultExpandedKeys={["source:cloud"]}
      items={items}
      selectedKeys={selectedKeys}
      selectionMode="single"
      selectionScope="leaf"
      onSelectionChange={setSelectedKeys}
    />
  );
}
```

带搜索、受控展开和行尾 More 操作：

```tsx
import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Tree, type TreeNode } from "@zeron/ui/tree";
import { useIcon } from "@zeron/icons/context";

function ProjectTree({ items }: { items: readonly TreeNode[] }) {
  const More = useIcon("ellipsis");
  const [query, setQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<readonly string[]>(["workspace"]);

  return (
    <>
      <input aria-label="搜索项目" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Tree
        aria-label="项目层级"
        expandedKeys={expandedKeys}
        items={items}
        query={query}
        showLines
        variant="bordered"
        onExpandedChange={setExpandedKeys}
        onNodeAction={(node) => openProject(node.data)}
        renderActions={({ node }) => (
          <DropdownMenu>
            <DropdownTrigger
              render={
                <Button iconOnly size="xs" type="button" variant="ghost" aria-label={`操作：${node.label}`}>
                  <More aria-hidden />
                </Button>
              }
            />
            <DropdownContent align="end">
              <MenuItem index={0} label="重命名" onSelect={() => renameProject(node.data)} />
              <MenuItem index={1} label="归档" onSelect={() => archiveProject(node.data)} />
            </DropdownContent>
          </DropdownMenu>
        )}
      />
    </>
  );
}
```

`renderIcon`、`renderLabel` 和 `renderTrailing` 只放非交互内容。使用 `renderActions` 放按钮、链接与 More 菜单；不要通过点击事件在 `renderTrailing` 内重建行操作隔离逻辑。

## Keyboard and accessibility

- Tree 使用单一 roving Tab 停靠点。方向键在可见节点间移动；左右方向键展开、收起、进入分支或返回父节点；Home/End 跳转到可见首尾节点。
- 展开箭头使用与 More action 一致的 `Button` 基础组件，但不额外占用 Tab 停靠点；它具有展开/收起的可访问名称。
- Enter/Space 在选择模式下执行选择，在展示模式下切换分支。Ctrl/⌘+Enter 或双击触发 `onNodeAction`。
- `renderActions` 中的控件进入正常 Tab 顺序，且不会冒泡为节点选择、展开或双击 action。不要给操作控件添加额外的行级点击处理。
- 需要自定义状态文本时使用 `messages`；不可用原因使用 `disabledReason`，不要只靠颜色或 opacity 表达。

## Safe customization

- 可以用 `variant`、`density`、`showLines`、`indent` 与 Tree 的 render slots 调整已公开的展示能力。
- 可以通过节点 `icon` 或 `renderIcon` 使用项目的 IconProvider；不要手工绘制折叠箭头或替换 Tree 的 focus、selection、checkbox 与 spring 行为。
- `renderTrailing` 适合数量、单位、状态文本或 Badge。`renderActions` 适合 Button、Dropdown 或链接；不要从祖先 CSS 覆盖 Tree 内部 slot 的颜色、间距、disabled opacity 或 focus ring。
- 不要在业务代码中复制搜索祖先展开、mixed checkbox、焦点恢复或键盘导航。这些属于 Tree 的行为契约。

## Verification checklist

- [ ] 每个节点 key 稳定、非空且全局唯一；Tree 有 `aria-label` 或 `aria-labelledby`。
- [ ] 选择模式、indicator、check strategy 与 selection scope 的组合有效。
- [ ] 单选最多有一个受控或默认选中 key。
- [ ] 搜索只更新 `query`/`filterNode`，没有裁剪完整 `items` 数据。
- [ ] MemberTree 与 FileTree 的 `selectableTypes` 和 cascade 语义符合返回实体。
- [ ] icon-only 的展开与行操作 Button 都具有可访问名称。
- [ ] 行尾互动内容使用 `renderActions`，不会误触发节点选择或 `onNodeAction`。
- [ ] 已验证键盘展开/收起、焦点恢复、loading/error/readOnly 与长标签。

## API anchors

Agent 优先关注：

- Tree：`items`、`expandedKeys`、`defaultExpandedKeys`、`onExpandedChange`、`selectionMode`、`selectionIndicator`、`checkStrategy`、`selectionScope`、`selectedKeys`、`defaultSelectedKeys`、`onSelectionChange`、`query`、`filterNode`。
- 展示和状态：`variant`、`density`、`showLines`、`indent`、`disabled`、`readOnly`、`loading`、`error`、`onRetry`、`messages`。
- 插槽和行为：`renderIcon`、`renderLabel`、`renderTrailing`、`renderActions`、`onNodeAction`。
- 场景组件：`MemberTree.selectableTypes`，以及 `FileTree.selectableTypes`、`FileTree.allowedExtensions`。

完整类型以 `source` 指向的实现为准。
