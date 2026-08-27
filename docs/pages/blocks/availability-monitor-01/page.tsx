import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AvailabilityMonitorBlockDocClient } from "./AvailabilityMonitorBlockDocClient";

export default async function AvailabilityMonitorBlockDoc() {
  const code = await readFile(
    join(
      process.cwd(),
      "packages/blocks/src/application/availability-monitor-01/availability-monitor.tsx"
    ),
    "utf8"
  );

  return <AvailabilityMonitorBlockDocClient code={code} />;
}
