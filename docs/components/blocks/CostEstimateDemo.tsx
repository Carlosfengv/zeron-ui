"use client";

import { useEffect, useRef, useState } from "react";
import { CostEstimate, costEstimateDemoInputs, costEstimateDemoPresets, costEstimateDemoRateCards, costEstimateDemoRegions, type CostEstimateInputs, type CostEstimateResult, type CostEstimateSaveState } from "@zeron/blocks/cost-estimate-01";
import { DemoSettingsMenu } from "./DemoSettingsMenu";
import { ToastStack, type ToastData } from "@zeron/ui/toast";

type DemoState = "ready" | "loading" | "stale" | "error" | "empty";

export function CostEstimateDemo() {
  const [value, setValue] = useState({ ...costEstimateDemoInputs });
  const [dataState, setDataState] = useState<DemoState>("ready");
  const [saveState, setSaveState] = useState<CostEstimateSaveState>({ status: "idle" });
  const [failSave, setFailSave] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const saving = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const urls = useRef(new Set<string>());
  useEffect(() => () => { timers.current.forEach(clearTimeout); urls.current.forEach(URL.revokeObjectURL); }, []);

  function notify(title: string, status: "success" | "error" = "success") {
    setToasts([{ id: `${Date.now()}`, title, status, createdAt: Date.now(), duration: 5000 }]);
  }
  function change(next: CostEstimateInputs, reason: string) {
    setValue(next);
    if (reason === "reset") { setDataState("ready"); notify("已重置为 Startup 预设"); }
  }
  function save(snapshot: CostEstimateResult) {
    if (saving.current) return;
    saving.current = true;
    setSaveState({ status: "pending" });
    const clicked = structuredClone(snapshot);
    timers.current.push(setTimeout(() => {
      try {
        if (failSave) throw new Error("示例保存失败，请关闭失败模拟后重试。");
        const url = URL.createObjectURL(new Blob([JSON.stringify({ demonstration: true, tax: "excluded", savedAt: new Date().toISOString(), snapshot: clicked }, null, 2)], { type: "application/json" }));
        urls.current.add(url);
        const link = document.createElement("a"); link.href = url; link.download = `cost-estimate-example-${clicked.inputs.regionId}-${clicked.inputs.billing}.json`;
        document.body.append(link); link.click(); link.remove();
        timers.current.push(setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url); }, 1000));
        setSaveState({ status: "succeeded", fingerprint: clicked.fingerprint });
        notify("点击时的示例估算已保存为 JSON");
      } catch (error) {
        const message = error instanceof Error ? error.message : "示例文件生成失败，请重试。";
        setSaveState({ status: "error", message }); notify(message, "error");
      } finally { saving.current = false; }
    }, 650));
  }
  const rateCard = costEstimateDemoRateCards[value.regionId];
  const state = dataState === "empty" ? "ready" : dataState;
  return <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8"><div className="m-auto w-full max-w-xl space-y-4">
    <CostEstimate value={value} onValueChange={change} rateCard={dataState === "empty" ? null : rateCard} regions={costEstimateDemoRegions} presets={costEstimateDemoPresets} defaultInputs={costEstimateDemoInputs} state={state} saveState={saveState} labels={{ save: "保存示例估算" }} actions={{ onSave: save, onRetry: () => setDataState("ready") }} />
    <DemoSettingsMenu<DemoState> value={dataState} onChange={setDataState} options={[{ value: "ready", label: "正常费率" }, { value: "loading", label: "首次加载" }, { value: "stale", label: "过期费率" }, { value: "error", label: "加载失败" }, { value: "empty", label: "无费率" }]} toggles={[{ id: "save-failure", label: "模拟保存失败", checked: failSave, onChange: setFailSave, disabled: saveState.status === "pending" }]} />
    <p className="text-center text-label text-fg-subtle">交互演示 · 固定示例费率，未连接真实计费服务</p>
    <ToastStack toasts={toasts} placement="static" portal={false} onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))} closeLabel="关闭通知" />
  </div>
  </div>;
}
