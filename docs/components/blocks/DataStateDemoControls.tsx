"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
