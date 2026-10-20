/** Original, local example content. No model or external data request. */
export function createChatMarkdownDemoText(locale = "en"): string {
  return locale.startsWith("zh") ? `## 让搜索结果跟上你的输入

建议把搜索拆成**即时输入、延迟请求、保留结果**三步。用户可以连续输入，列表则在下一次结果准备好后平稳更新。

> **建议**：先保留上一次结果，再补上加载提示。避免每次输入都清空列表，让用户始终知道自己正在看什么。

### 方案对比

| 体验 | 当前方案 | 调整后 |
| :--- | :--- | :--- |
| 输入反馈 | 输入与请求绑定 | 输入立即响应 |
| 请求时机 | 每次按键发送 | 停顿后发送 |
| 等待状态 | 清空结果 | 保留上一次结果 |
| 异常处理 | 覆盖整个列表 | 行内提示，可重试 |

### 一个简单的起点

用一个小型 Hook 稳定输入值，再把它传给现有的查询逻辑。下面的 \`delay\` 是可调整的示例值。

\`\`\`ts filename="hooks/use-debounced-value.ts"
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
\`\`\`

### 实施步骤

1. 保持输入框即时更新。
2. 用延迟后的值发起查询。
   - 清理过期的计时器。
   - 取消过期请求，或忽略过期结果。
3. 补齐加载、空结果与失败重试。

#### 上线前检查

- [x] 输入过程中保持键盘焦点
- [x] 等待时保留上一次结果
- [ ] 验证慢速网络下的反馈
- [ ] 检查移动端与键盘操作

---

**验收标准**：连续输入时不跳动，搜索失败后仍可阅读已有结果。~~每次输入都清空列表~~的处理可以移除。[^review]

关于副作用与清理，可阅读 [React 的 Effect 使用指南](https://react.dev/learn/synchronizing-with-effects)。

[^review]: 这是一份本地演示方案；实际请求时机与验收结果由项目验证。
` : `## Keep search in step with your typing

Split the experience into **instant input, delayed requests, and persistent results**. People can keep typing while the list updates when the next result is ready.

> **Recommendation**: keep the previous results and add a loading hint. A stable list helps people understand what they are looking at.

### Compare the approaches

| Experience | Current approach | Proposed approach |
| :--- | :--- | :--- |
| Input feedback | Coupled to requests | Respond immediately |
| Request timing | Every keystroke | After a short pause |
| Loading | Clear the list | Keep previous results |
| Errors | Replace the entire list | Inline hint with retry |

### A small starting point

Stabilize the input with a small Hook, then pass the value to your existing query. The \`delay\` below is an adjustable example.

\`\`\`ts filename="hooks/use-debounced-value.ts"
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
\`\`\`

### Implementation steps

1. Update the input immediately.
2. Query using the delayed value.
   - Clean up outdated timers.
   - Cancel stale requests or ignore their results.
3. Cover loading, empty results, and retry.

#### Before shipping

- [x] Preserve keyboard focus while typing
- [x] Keep previous results while waiting
- [ ] Verify feedback on a slow connection
- [ ] Check mobile and keyboard navigation

---

**Acceptance**: typing keeps the list stable, and existing results remain readable after a failure. Remove ~~clearing the list on every keystroke~~.[^review]

Read the [React guide to Effects](https://react.dev/learn/synchronizing-with-effects) for more about setup and cleanup.

[^review]: This is a local example. Validate request timing and acceptance in your project.
`;
}
