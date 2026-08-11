"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabItem } from "@/components/ui/tabs";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { BADGE_ITEMS, BUTTON_ITEMS, SWITCH_ITEMS, TABS_DEFAULT, TABS_ITEMS } from "@/docs/site/demo-data";

function BadgePreview() {
  return <div className="flex flex-wrap items-center gap-1.5">{BADGE_ITEMS.map((item) => <Badge key={item.label} variant="dot" color={item.color}>{item.label}</Badge>)}</div>;
}

function ButtonPreview() {
  return <div className="flex flex-wrap items-center gap-2">{BUTTON_ITEMS.map((item) => <Button key={item.label} variant={item.variant} size="sm">{item.label}</Button>)}</div>;
}

function InputPreview() {
  return <div className="flex w-full max-w-[280px] flex-col gap-2"><Input placeholder="you@example.com" aria-label="Email address" /><Input variant="secondary" placeholder="Search projects…" aria-label="Search projects" /></div>;
}

function CheckboxPreview() {
  const [checked, setChecked] = useState(true);
  return (
    <div className="flex flex-col gap-3 text-body">
      <label className="flex cursor-pointer items-center gap-2.5"><Checkbox checked={checked} onCheckedChange={setChecked} /><span>Product updates</span></label>
      <label className="flex cursor-pointer items-center gap-2.5 text-fg-muted"><Checkbox checked="indeterminate" /><span>Selected projects</span></label>
    </div>
  );
}

function KbdPreview() {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-3 text-body">
      <div className="flex items-center justify-between gap-4"><span className="text-fg-muted">Command palette</span><KbdGroup aria-label="Command K"><Kbd aria-label="Command">⌘</Kbd><Kbd>K</Kbd></KbdGroup></div>
      <div className="flex items-center justify-between gap-4"><span className="text-fg-muted">Quick open</span><KbdGroup aria-label="Command P"><Kbd aria-label="Command">⌘</Kbd><Kbd>P</Kbd></KbdGroup></div>
    </div>
  );
}

function SwitchPreview() {
  const [on, setOn] = useState<Set<string>>(() => new Set(SWITCH_ITEMS.filter((item) => item.initial).map((item) => item.id)));
  return <div className="flex flex-col gap-3">{SWITCH_ITEMS.map((item) => <Switch key={item.id} label={item.label} checked={on.has(item.id)} onToggle={() => setOn((previous) => { const next = new Set(previous); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} />)}</div>;
}

function TabsPreview() {
  const [tab, setTab] = useState(TABS_DEFAULT);
  return <div className="w-full max-w-[360px]"><Tabs value={tab} onValueChange={setTab} variant="pill"><TabsList>{TABS_ITEMS.map((item) => <TabItem key={item.value} value={item.value} label={item.label} />)}</TabsList></Tabs></div>;
}

function ThinkingIndicatorPreview() {
  return <ThinkingIndicator />;
}

export const featuredPreviewMap: Record<string, React.FC> = {
  badge: BadgePreview,
  button: ButtonPreview,
  checkbox: CheckboxPreview,
  input: InputPreview,
  kbd: KbdPreview,
  switch: SwitchPreview,
  tabs: TabsPreview,
  "thinking-indicator": ThinkingIndicatorPreview,
};
