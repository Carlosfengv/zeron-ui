---
schema_version: 1
name: combobox
kind: component
status: stable
locale: zh-CN
summary: 在可搜索的候选集合中选择一个或多个值，保留稳定身份和受控状态。
package_import: "@zeron/ui/combobox"
registry_import: "@/components/ui/combobox"
source: packages/ui/src/components/combobox.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [select, input, field]
---

# Combobox

## 使用与选型

适用于候选多、需要输入检索或多选的字段。小型固定枚举优先 Select；自由文本用 Input；页面全文检索不要把结果强行当成表单选项。

## 公共契约

- Root 接收 `items`、`value`、`onValueChange`；设置 `multiple` 时值为数组，单选值可以是 null。不要在一次挂载中改变单选／多选模式。
- 对象值明确提供 `itemToStringLabel`、`itemToStringValue` 和 `isItemEqualToValue`。标签可以重复，身份不能依赖标签或数组位置。
- `size` 控制输入尺寸；`itemDensity` 控制候选密度，二者分别设置。输入的 `variant` 为 outline、secondary 或 ghost。
- `ComboboxInput` 提供 `showClear`、`showTrigger`、`clearAriaLabel` 和 `triggerAriaLabel`；给输入本身提供标签或 `aria-label`。
- Popup 通过 `ComboboxContent` 组合，定位可用 `side`、`align`、`anchor`、`collisionBoundary`；受限容器通过公开 `container` 配置，不修改 Portal 实现。
- 多选使用 `ComboboxChips`、`ComboboxChip`、`ComboboxChipsInput`、`useComboboxAnchor`；为移除按钮提供对应项目的可访问名称。

## 对象值接入

示例中的回调与集合由调用者提供；它不加载演示数据，也不实现后端。

```tsx
"use client";
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@zeron/ui/combobox";
type Owner = { id: string; name: string };
export function OwnerPicker({ items, value, onChange, disabled = false }: {
  items: Owner[]; value: Owner | null;
  onChange: (owner: Owner | null) => void; disabled?: boolean;
}) {
  return <Combobox<Owner> items={items} value={value} onValueChange={onChange}
    disabled={disabled} itemToStringLabel={(item) => item.name}
    itemToStringValue={(item) => item.id}
    isItemEqualToValue={(item, selected) => item.id === selected.id}>
    <ComboboxInput aria-label="负责人" showClear clearAriaLabel="清除负责人" triggerAriaLabel="展开负责人" />
    <ComboboxContent>
      <ComboboxEmpty>没有匹配的负责人</ComboboxEmpty>
      <ComboboxList>{(item: Owner) => <ComboboxItem key={item.id} value={item}>{item.name}</ComboboxItem>}</ComboboxList>
    </ComboboxContent>
  </Combobox>;
}
```

## 异步与权限

远程候选由业务层读取，取消过期请求或用请求序号拒绝晚到结果。加载中、网络失败和查询成功但为空是不同状态：不要将失败显示成“没有结果”。外部筛选核对 Root 的 `filter/filteredItems` 契约，避免对服务器结果再次过滤。已选对象不能因为下一页候选未包含它而被清除。

不可编辑时禁用控件，并解释原因；后端仍核验权限。清除回调应把 null／空数组交给业务层，不擅自写入默认值。

## 验收

检查同名不同 ID、对象刷新后选中值、多选移除、清除、键盘选择、Escape、加载／错误／空集合和只读权限。在窄屏与嵌入 Dialog 中验证 Popup 定位、滚动及主题。示例由 `agents:guides:examples:check` 做类型检查；业务行为与视觉验收另行执行。消费者导入必须按实际 aliases 改写，仓库导入不证明安装路径。
