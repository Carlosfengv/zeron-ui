"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { FleetHealth, createFleetHealthDemoData, fleetHealthDemoClusters, fleetHealthZhLabels } from "@zeron/blocks/fleet-health-01";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { useIcon } from "@zeron/ui/system/icon-context";

/** Local simulation. Rebalancing and telemetry never contact a real cluster. */
export function FleetHealthDemo() {
  const locale = useLocale(); const zh = locale === "zh-CN";
  const [cluster, setCluster] = useState(fleetHealthDemoClusters[0].id);
  const [step, setStep] = useState(0);
  const [now, setNow] = useState(0);
  const [running, setRunning] = useState(true);
  const [interval, setIntervalMs] = useState(1600);
  const [settings, setSettings] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);
  const [balanced, setBalanced] = useState(false);
  const [notice, setNotice] = useState("");
  const rebalanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const More = useIcon("ellipsis"); const Pause = useIcon("pause"); const Play = useIcon("play"); const Reset = useIcon("rotate-ccw");
  useEffect(() => { setNow(Date.now() / 1000); }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => { setNow(Date.now() / 1000); setStep((current) => current + 1); }, interval);
    return () => window.clearInterval(timer);
  }, [running, interval, cluster]);
  useEffect(() => () => { if (rebalanceTimer.current) clearTimeout(rebalanceTimer.current); }, []);
  function reset(nextCluster = cluster) {
    if (rebalanceTimer.current) clearTimeout(rebalanceTimer.current);
    setCluster(nextCluster); setStep(0); setBalanced(false); setRebalancing(false); setNotice("");
  }
  const data = createFleetHealthDemoData(step, now, cluster);
  if (balanced) data.nodes = data.nodes.map((node) => ({ ...node, gpus: node.gpus.map((gpu) => ({ ...gpu,
    utilization: gpu.status === "idle" ? 0 : 70 + (gpu.index % 4), temperatureC: gpu.status === "idle" ? 34 : 70 + (gpu.index % 5),
  })) }));
  return <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="m-auto w-full max-w-xl shrink-0">
      <FleetHealth key={cluster} data={data} clusterId={cluster} clusters={fleetHealthDemoClusters}
        onClusterChange={(id) => reset(id)} locale={locale} labels={zh ? fleetHealthZhLabels : undefined} live={running}
        refreshIntervalMs={interval} region={cluster.includes("iad") ? "Ashburn" : "San Francisco"}
        onSettings={() => setSettings(true)} rebalancing={rebalancing}
        onRebalance={() => {
          if (rebalancing) return;
          setRebalancing(true); setNotice("");
          rebalanceTimer.current = setTimeout(() => { setBalanced(true); setRebalancing(false); setNotice(zh ? "演示已均衡：热点负载已分散。" : "Demo rebalanced: hot workloads redistributed."); }, 900);
        }} notice={notice}
        footerActions={<DropdownMenu><DropdownTrigger render={<Button variant="ghost" size="sm" iconOnly aria-label={zh ? "演示选项" : "Demo options"}><More /></Button>} />
          <DropdownContent side="top" align="start">
            <MenuItem index={0} icon={running ? Pause : Play} label={zh ? running ? "暂停演示" : "继续演示" : running ? "Pause demo" : "Resume demo"} onClick={() => setRunning((current) => !current)} />
            <MenuItem index={1} icon={Reset} label={zh ? "重置演示" : "Reset demo"} onClick={() => reset()} />
          </DropdownContent>
        </DropdownMenu>}
      />
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent><DialogHeader><DialogTitle>{zh ? "演示设置" : "Demo settings"}</DialogTitle>
          <DialogDescription>{zh ? "本地模拟数据，刷新间隔" : "Local simulation · refresh interval"}</DialogDescription></DialogHeader><div className="space-y-3">
          <Select value={String(interval)} onValueChange={(value) => setIntervalMs(Number(value))}><SelectTrigger aria-label={zh ? "刷新间隔" : "Refresh interval"} /><SelectContent><SelectItem value="800">0.8 s</SelectItem><SelectItem value="1600">1.6 s</SelectItem><SelectItem value="3200">3.2 s</SelectItem></SelectContent></Select>
          <Button variant="secondary" onClick={() => setSettings(false)}>{zh ? "完成" : "Done"}</Button>
        </div></DialogContent>
      </Dialog>
    </div>
  </div>;
}
