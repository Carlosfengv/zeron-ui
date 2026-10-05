"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Switch } from "@zeron/ui/switch";

const scenarios = [
  ["ready", "正常"], ["loading", "首次加载"], ["initial-error", "首次失败"],
  ["refreshing", "后台刷新"], ["refresh-error", "刷新失败 · 保留旧数据"],
  ["stale", "数据过期"], ["stale-refreshing", "数据过期并刷新"], ["empty", "确认无数据"],
] as const;
export type DataStateDemoScenario = typeof scenarios[number][0];

/** Documentation-only scenarios; async completion never overwrites a newer selection. */
export function useDataStateDemo() {
  const [scenario, setScenario] = useState<DataStateDemoScenario>("ready");
  const [revision, setRevision] = useState(0);
  const [failNextRefresh, setFailNextRefresh] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  const changeScenario = (value: DataStateDemoScenario) => {
    generation.current += 1;
    setRevision((current) => current + 1);
    setScenario(value);
  };
  const recover = async () => {
    const request = ++generation.current;
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    if (request !== generation.current) return;
    setRevision((current) => current + 1);
    setScenario("ready");
  };
  const refresh = async () => {
    if (!failNextRefresh) return recover();
    const request = ++generation.current;
    setFailNextRefresh(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    if (request === generation.current) throw new Error("模拟刷新失败，请重试。旧数据已保留。");
  };
  const status = useMemo(() => ({
    loading: scenario === "loading",
    failed: scenario === "initial-error" || scenario === "refresh-error",
    retainData: scenario === "refresh-error",
    refreshing: scenario === "refreshing" || scenario === "stale-refreshing",
    stale: scenario === "stale" || scenario === "stale-refreshing",
    empty: scenario === "empty",
  }), [scenario]);
  return { scenario, revision, changeScenario, recover, refresh, failNextRefresh, setFailNextRefresh, ...status };
}

export function DataStateDemoControls({ value, onChange, failNextRefresh, onFailNextRefreshChange }: {
  value: DataStateDemoScenario; onChange: (value: DataStateDemoScenario) => void;
  failNextRefresh?: boolean; onFailNextRefreshChange?: (value: boolean) => void;
}) {
  return <div className="flex min-w-0 flex-wrap items-center gap-3 bg-surface-base px-3 py-2">
    <Select value={value} onValueChange={(next) => onChange(next as DataStateDemoScenario)} size="sm">
      <SelectTrigger aria-label="演示状态" wrapperClassName="max-w-full" />
      <SelectContent>{scenarios.map(([id, label]) => <SelectItem key={id} value={id} label={label}>{label}</SelectItem>)}</SelectContent>
    </Select>
    {onFailNextRefreshChange && <Switch label="下次刷新失败" checked={failNextRefresh ?? false} onCheckedChange={onFailNextRefreshChange} />}
    <p className="min-w-0 text-label text-fg-subtle">示例数据 · 重试或刷新后恢复正常</p>
  </div>;
}
