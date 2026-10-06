"use client";

import { useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Button } from "@zeron/ui/button";
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownLabel, DropdownSeparator } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Switch } from "@zeron/ui/switch";
import { PreviewToolbarPortal, usePreviewToolbarFloating } from "@docs/components/content/PreviewToolbar";

export interface DemoSettingToggle {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  control?: "checkbox" | "switch";
}

interface DemoSettingsMenuProps<Value extends string> {
  value?: Value;
  onChange?: (value: Value) => void;
  options?: readonly { value: Value; label: string }[];
  toggles?: readonly DemoSettingToggle[];
  actions?: readonly { label: string; onSelect: () => void }[];
  description?: string;
}

/** Documentation-only controls shared by block and page previews. */
export function DemoSettingsMenu<Value extends string>({ value, onChange, options = [], toggles = [], actions = [], description }: DemoSettingsMenuProps<Value>) {
  const zh = useLocale().startsWith("zh");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const floating = usePreviewToolbarFloating();
  const [open, setOpen] = useState(false);
  const SettingsIcon = useIcon("settings");
  const CheckIcon = useIcon("check");
  const label = zh ? "演示数据设置" : "Demo data settings";
  const selectedIndex = options.findIndex((option) => option.value === value);
  const changed = (options.length > 0 && selectedIndex > 0) || toggles.some((toggle) => toggle.checked);
  const currentLabel = options[selectedIndex]?.label;

  return <PreviewToolbarPortal onDragStart={() => setOpen(false)}>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownTrigger ref={triggerRef} render={<Button variant={floating ? "neutral" : "ghost"} size={floating ? "md" : "sm"} iconOnly className={floating ? "touch-none cursor-grab active:cursor-grabbing" : undefined} aria-label={label} aria-description={floating ? (zh ? "拖动调整位置，松开后吸附屏幕边缘。" : "Drag to reposition; release to dock at the screen edge.") : undefined} title={currentLabel ? `${label} · ${currentLabel}` : label} active={changed}><SettingsIcon aria-hidden="true" /></Button>} />
      <DropdownContent align="end" className="w-72 max-w-[var(--available-width)]" aria-label={label} checkedIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape" && event.target instanceof Element && event.target.closest('[role="switch"]')) triggerRef.current?.focus();
        }}>
        {options.length > 0 && <>
          <DropdownLabel>{zh ? "模拟数据状态" : "Mock data state"}</DropdownLabel>
          {options.map((option, index) => <MenuItem key={option.value} index={index} label={option.label} checked={option.value === value} onSelect={() => onChange?.(option.value)} />)}
        </>}
        {toggles.length > 0 && <>
          {options.length > 0 && <DropdownSeparator />}
          <DropdownLabel>{zh ? "模拟行为" : "Simulated behavior"}</DropdownLabel>
          {toggles.map((toggle, index) => toggle.control === "switch"
            ? <Switch key={toggle.id} label={toggle.label} checked={toggle.checked} onCheckedChange={toggle.onChange} disabled={toggle.disabled} />
            : <MenuItem key={toggle.id} index={options.length + index} label={toggle.label} role="menuitemcheckbox" aria-checked={toggle.checked} disabled={toggle.disabled} closeOnClick={false} trailing={toggle.checked ? <CheckIcon aria-hidden="true" className="size-4" /> : undefined} onSelect={() => toggle.onChange(!toggle.checked)} />)}
        </>}
        {actions.length > 0 && <>
          {(options.length > 0 || toggles.length > 0) && <DropdownSeparator />}
          {actions.map((action, index) => <MenuItem key={action.label} index={options.length + toggles.length + index} label={action.label} onSelect={action.onSelect} />)}
        </>}
        <DropdownSeparator />
        <p className="px-3 py-2 text-label text-fg-subtle">{description ?? (zh ? "仅影响示例数据，不连接真实服务。" : "Example data only; no live service is connected.")}</p>
      </DropdownContent>
    </DropdownMenu>
  </PreviewToolbarPortal>;
}
