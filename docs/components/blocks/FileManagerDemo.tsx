"use client";

import { Alert, AlertTitle, AlertAction } from "@zeron/ui/alert";
import { useState } from "react";
import { useLocale } from "next-intl";
import { FileManager, type FileManagerProps } from "@zeron/blocks/file-manager-01";
import { Button } from "@zeron/ui/button";
import { DemoSettingsMenu } from "./DemoSettingsMenu";

/** Only mock states supported by the public file-manager contract are offered. */
export function FileManagerDemo(props: FileManagerProps) {
  const zh = useLocale().startsWith("zh");
  const [scenario, setScenario] = useState<"ready" | "loading" | "error" | "empty">("ready");
  return <><DemoSettingsMenu value={scenario} onChange={setScenario} options={[
    { value: "ready", label: zh ? "正常" : "Ready" },
    { value: "loading", label: zh ? "首次加载" : "Initial loading" },
    { value: "error", label: zh ? "首次失败" : "Initial error" },
    { value: "empty", label: zh ? "确认无数据" : "Empty" },
  ]} description={zh ? "示例文件，不连接外部存储" : "Mock files, no external storage"} />
    <FileManager {...props} items={scenario === "empty" ? [] : props.items} loading={scenario === "loading" || props.loading} error={scenario === "error" ? (zh ? "文件加载失败" : "Files could not be loaded") : props.error} renderErrorState={props.renderErrorState ?? ((error) => <div className="flex min-w-0 w-full items-center justify-center"><Alert status="danger" role="group" className="w-full max-w-xl"><AlertTitle>{error}</AlertTitle><AlertAction><Button variant="secondary" size="sm" onClick={() => setScenario("ready")}>{zh ? "重试" : "Retry"}</Button></AlertAction></Alert></div>)} />
  </>;
}
