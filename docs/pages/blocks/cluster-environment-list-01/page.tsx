import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ClusterEnvironmentListBlockDocClient } from "./ClusterEnvironmentListBlockDocClient";

export default async function ClusterEnvironmentListBlockDoc() {
  const code = await readFile(
    join(process.cwd(), "packages/blocks/src/application/cluster-environment-list-01/cluster-environment-list.tsx"),
    "utf8"
  );

  return <ClusterEnvironmentListBlockDocClient code={code} />;
}
