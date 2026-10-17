"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { LocalModels, localModelsDemoData, localModelsDemoValue, localModelsDemoAppliedValue, localModelsOverflowDemoValue, type LocalModelsValue } from "@zeron/blocks/local-models-01";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

type DemoState = "ready" | "overflow" | "empty" | "error";
export function LocalModelsDemo() {
  const zh = useLocale().startsWith("zh");
  const [state, setState] = useState<DemoState>("ready");
  const [value, setValue] = useState(localModelsDemoValue);
  const [applied, setApplied] = useState(localModelsDemoAppliedValue);
  const [selected, setSelected] = useState("gemma-3-27b");
  const [message, setMessage] = useState("");
  function changeState(next: DemoState) {
    setState(next); setMessage(""); setApplied(localModelsDemoAppliedValue);
    setValue(next === "overflow" ? localModelsOverflowDemoValue : localModelsDemoValue);
    setSelected(next === "overflow" ? "gpt-oss-20b" : "gemma-3-27b");
  }
  function apply(next: LocalModelsValue) {
    if (state === "error") { setMessage(zh ? "示例保存失败，草稿已保留，可重试或丢弃。" : "Example save failed. Your draft is preserved; retry or discard it."); return; }
    setApplied(structuredClone(next)); setMessage(zh ? "示例配置已应用（未连接 GPU 服务）。" : "Example configuration applied locally. No GPU service is connected.");
  }
  async function copy(next: LocalModelsValue) {
    try { await navigator.clipboard.writeText(JSON.stringify(next, null, 2)); setMessage(zh ? "配置已复制。" : "Configuration copied."); }
    catch { setMessage(zh ? "无法访问剪贴板，请检查浏览器权限。" : "Clipboard access is unavailable. Check browser permissions."); }
  }
  return <div className="h-full overflow-auto bg-surface-base p-3 sm:p-6">
    <DemoSettingsMenu value={state} onChange={changeState} options={[
      { value: "ready", label: zh ? "正常状态" : "Normal" }, { value: "overflow", label: zh ? "显存超限（8.3 GB）" : "Over capacity (8.3 GB)" },
      { value: "empty", label: zh ? "空模型列表" : "No models" }, { value: "error", label: zh ? "保存失败" : "Save failure" },
    ]} />
    <div className="mx-auto w-full max-w-7xl"><LocalModels data={state === "empty" ? { ...localModelsDemoData, models: [] } : localModelsDemoData} value={value} appliedValue={applied} onValueChange={(next) => { setValue(next); setMessage(""); }} selectedModelId={selected} onSelectedModelChange={setSelected} onApply={apply} onCopy={copy} error={state === "error" ? message || undefined : undefined} />
      {message && state !== "error" && <p role="status" className="mt-3 text-label text-fg-muted">{message}</p>}
    </div>
  </div>;
}
