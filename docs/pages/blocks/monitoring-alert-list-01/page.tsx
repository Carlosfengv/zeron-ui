import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MonitoringAlertListBlockDocClient } from "./MonitoringAlertListBlockDocClient";

export default async function MonitoringAlertListBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list.tsx"), "utf8");
  return <MonitoringAlertListBlockDocClient code={code} />;
}
