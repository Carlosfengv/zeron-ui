import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ServiceManagementBlockDocClient } from "./ServiceManagementBlockDocClient";

export default async function ServiceManagementBlockDoc() {
  const code = await readFile(join(process.cwd(), "packages/blocks/src/application/service-management-01/service-management.tsx"), "utf8");
  return <ServiceManagementBlockDocClient code={code} />;
}
