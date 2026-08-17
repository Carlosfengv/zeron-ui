import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ClusterEnvironmentDetailBlockDocClient } from "./ClusterEnvironmentDetailBlockDocClient";

export default async function ClusterEnvironmentDetailBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/cluster-environment-detail-01/cluster-environment-detail.tsx"), "utf8");
  return <ClusterEnvironmentDetailBlockDocClient code={code} />;
}
