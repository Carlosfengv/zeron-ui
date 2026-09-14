import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TrafficRulesBlockDocClient } from "./TrafficRulesBlockDocClient";

export default async function TrafficRulesBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/traffic-rules-01/traffic-rules-v2.tsx"), "utf8");
  return <TrafficRulesBlockDocClient code={code} />;
}
