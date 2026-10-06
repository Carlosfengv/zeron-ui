"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { DemoSettingsMenu, type DemoSettingToggle } from "./DemoSettingsMenu";

const scenarios = [
  ["ready", "正常"], ["loading", "首次加载"], ["initial-error", "首次失败"],
  ["refreshing", "后台刷新"], ["refresh-error", "刷新失败 · 保留旧数据"],
  ["stale", "数据过期"], ["stale-refreshing", "数据过期并刷新"], ["empty", "确认无数据"],
] as const;
export type DataStateDemoScenario = typeof scenarios[number][0];
const englishLabels = ["Ready", "Initial loading", "Initial failure", "Refreshing", "Refresh failed · Keep previous data", "Stale data", "Stale data + refreshing", "Confirmed empty"];

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

export function DataStateDemoControls({ value, onChange, failNextRefresh, onFailNextRefreshChange, toggles = [], description }: {
  value: DataStateDemoScenario; onChange: (value: DataStateDemoScenario) => void;
  failNextRefresh?: boolean; onFailNextRefreshChange?: (value: boolean) => void;
  toggles?: readonly DemoSettingToggle[]; description?: string;
}) {
  const zh = useLocale().startsWith("zh");
  return <DemoSettingsMenu value={value} onChange={onChange}
    options={scenarios.map(([id, label], index) => ({ value: id, label: zh ? label : englishLabels[index] }))}
    toggles={[...(onFailNextRefreshChange ? [{ id: "fail-next-refresh", label: zh ? "下次刷新失败" : "Fail next refresh", checked: failNextRefresh ?? false, onChange: onFailNextRefreshChange, control: "switch" as const }] : []), ...toggles]}
    description={description ?? (zh ? "示例数据 · 重试或刷新后恢复正常" : "Example data · Retry or refresh to recover")} />;
}
