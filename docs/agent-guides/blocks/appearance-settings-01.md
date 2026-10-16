---
schema_version: 1
name: appearance-settings-01
kind: block
status: stable
summary: Container 内的受控外观偏好设置，包含主题、强调色、侧边栏与任务密度和动效。
package_import: "@zeron/blocks/appearance-settings-01"
registry_import: "@/components/blocks/appearance-settings-01"
source: packages/blocks/src/application/appearance-settings-01/appearance-settings.tsx
registry: packages/blocks/registry.json
related:
  - container
  - radio-group
  - color-picker
  - tabs
  - select
---

# Appearance Settings 01

An embedded appearance preferences surface. Container wraps all content. ContainerHeader displays the title and description; ContainerBody contains the settings. No application shell is added.

```tsx
import { useState } from "react";
import { AppearanceSettings, defaultAppearanceSettings } from "@/components/blocks/appearance-settings-01";

export function Preferences() {
  const [value, setValue] = useState(defaultAppearanceSettings);
  return <AppearanceSettings value={value} onValueChange={setValue} />;
}
```

- Supply the complete controlled value: theme (light/dark/system), accent (brand/blue/violet/teal/rose/gray), sidebarDensity and taskDensity (comfortable/compact), and motion (system/reduce/full). The default brand option follows var(--brand), rather than a fixed categorical color.
- onValueChange receives the complete next value, preserving the other preferences. The host applies settings and handles persistence, including OS color-scheme and reduced-motion preferences when following the system. The block never changes the document theme, storage, or global tokens.
- Missing onValueChange or disabled disables all controls. Multiple instances use distinct accessible label IDs.
- RadioGroup and RadioGroupItem own theme input and keyboard behavior. Theme miniatures are decorative semantic UI previews with locally scoped light/dark surfaces; selecting an accent updates all miniature accent colors.
- ColorSwatch retains its default shape and selected ring, follows the brand token for the first option and the existing badgeColors palette for the rest, and exposes color names and pressed state. Density choices use standard Tabs, TabsList and TabItem with variant="pill" and color="default", retaining the component's selection indicator, focus and keyboard navigation. Select owns motion menu, keyboard navigation and focus feedback.
- Exported English and Chinese labels can be replaced through labels; override description to use the host product name.
- The documentation demo stores choices in local state only. Theme, density and motion selections do not alter the documentation host.
- At narrow widths, theme cards stack and setting controls move below their labels. Long translated density labels scroll inside the pill Tabs rather than expanding ContainerBody; TabItem retains its standard text sizing and shape.
