/**
 * Runs the published-shaped CLI against a clean consumer.  It intentionally
 * does not link this workspace: the CLI is packed, Registry files are served
 * over HTTP, and the consumer has its own node_modules and lockfile.
 *
 * `--all` expands the component list; each item gets its own consumer so a
 * preinstalled dependency can never hide a broken Registry closure.
 */

import { createServer } from "node:http";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { consumerRegistryExpectations, snapshotConsumerRegistry } from "./lib/consumer-registry-expectations.mjs";
import { consumerStyleExample, verifyConsumerStyles } from "./lib/consumer-style-verification.mjs";
import { verifyFeedbackConsumer } from "./lib/feedback-consumer-verification.mjs";
import { unificationConsumerExample } from "./lib/unification-consumer-examples.mjs";
import { verifyUnificationConsumer } from "./lib/unification-consumer-verification.mjs";

const execFile = promisify(execFileCallback);
const ROOT = new URL("..", import.meta.url).pathname;
const REGISTRY_DIR = join(ROOT, "public/r");
const all = process.argv.includes("--all");
const styles = process.argv.includes("--styles");
const keepConsumers = process.env.ZERON_CONSUMER_KEEP === "1";
const verifyFeedback = process.env.ZERON_CONSUMER_FEEDBACK === "1";
const verifyUnification = process.env.ZERON_CONSUMER_UNIFICATION === "1";
const registrySnapshot = await snapshotConsumerRegistry(REGISTRY_DIR);
const registryItems = JSON.parse(registrySnapshot.get("registry.json")).items;
const allRegistryItems = registryItems.map((item) => item.name).filter((name) => typeof name === "string");
const components = styles ? ["button"] : process.env.ZERON_CONSUMER_COMPONENTS?.split(",").filter(Boolean) ?? (all
  ? allRegistryItems
  : ["button", "card", "ask-user-questions", "code-block", "infinite-log-table-01"]);
const packageManagers = process.env.ZERON_CONSUMER_PACKAGE_MANAGERS?.split(",").filter(Boolean) ?? ["npm", "pnpm"];
const vitePackageManagers = process.env.ZERON_VITE_CONSUMER_PACKAGE_MANAGERS?.split(",").filter(Boolean) ?? ["npm"];
const viteComponents = styles ? ["button"] : process.env.ZERON_VITE_CONSUMER_COMPONENTS?.split(",").filter(Boolean) ?? ["button", "card", "ask-user-questions", "code-block"];
const BUSINESS_SOURCE = "export const identity = <T>(value: T): T => value;\n";

if ([...packageManagers, ...vitePackageManagers].some((manager) => !["npm", "pnpm"].includes(manager))) {
  throw new Error("Consumer package managers must contain only npm and/or pnpm");
}

function registryServer() {
  const server = createServer(async (request, response) => {
    const name = basename(new URL(request.url ?? "/", "http://localhost").pathname);
    if (!/^[a-z0-9-]+\.json$/.test(name)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const origin = `http://${request.headers.host}`;
      const source = registrySnapshot.get(name);
      if (!source) { response.writeHead(404).end(); return; }
      const data = source.replaceAll("https://zeron-ui.vercel.app/r", origin);
      response.writeHead(200, { "content-type": "application/json" }).end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolveServer) => server.listen(0, "127.0.0.1", () => resolveServer(server)));
}

async function command(file, args, options) {
  const { stdout, stderr } = await execFile(file, args, { ...options, encoding: "utf8" });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  return stdout;
}

async function writeConsumer(directory, packageManager, { starter = false } = {}) {
  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "zeron-consumer-fixture",
    private: true,
    packageManager: packageManager === "pnpm" ? "pnpm@10.12.4" : undefined,
    dependencies: { next: "15.5.24", react: "19.2.0", "react-dom": "19.2.0" },
    devDependencies: { "@tailwindcss/postcss": "4.3.3", typescript: "5.9.3", "@types/node": "20.19.9", "@types/react": "19.2.14", "@types/react-dom": "19.2.3", tailwindcss: "4.3.3" },
  }, null, 2));
  await writeFile(join(directory, "components.json"), JSON.stringify({
    style: "new-york", rsc: true, tsx: true,
    tailwind: { config: "", css: "app/globals.css", baseColor: "neutral", cssVariables: true, prefix: "" },
    aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" },
  }, null, 2));
  await writeFile(join(directory, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2023", module: "preserve", moduleResolution: "bundler", jsx: "preserve", strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true, baseUrl: ".", paths: { "@/*": ["./*"] } },
    include: ["components", "lib", "hooks", "verification.ts", "assets.d.ts", "business.ts"],
  }, null, 2));
  await writeFile(join(directory, "verification.ts"), "export {};\n");
  await writeFile(join(directory, "business.ts"), BUSINESS_SOURCE);
  await writeFile(join(directory, "app", "layout.tsx"), [
    'import "./globals.css";',
    '',
    'export default function RootLayout({ children }: { children: React.ReactNode }) {',
    '  return <html lang="en"><body>{children}</body></html>;',
    '}',
    '',
  ].join("\n"));
  await writeFile(join(directory, "postcss.config.mjs"), 'export default { plugins: { "@tailwindcss/postcss": {} } };\n');
  await writeFile(join(directory, "next.config.mjs"), 'export default { experimental: { cpus: 1 } };\n');
  // TypeScript's standalone checker does not load Next's generated asset
  // declarations. Keep this consumer fixture able to validate Registry
  // Blocks that import static SVG assets, just as a Next project does.
  await writeFile(join(directory, "assets.d.ts"), 'declare module "*.svg" {\n  const source: string;\n  export default source;\n}\n');
  // Start without compatibility tokens: the Registry must supply its own base-layer contract.
  await writeFile(join(directory, "app", "globals.css"), starter ? [
    '@import "tailwindcss";',
    ':root { --background: #ffffff; --foreground: #171717; }',
    '@theme inline { --color-background: var(--background); --color-foreground: var(--foreground); }',
    '@media (prefers-color-scheme: dark) { :root { --background: #0a0a0a; --foreground: #ededed; } }',
    'body { background: var(--background); color: var(--foreground); font-family: Arial, Helvetica, sans-serif; }',
    '',
  ].join("\n") : '@import "tailwindcss";\n');
  await command(packageManager, ["install", "--ignore-scripts"], { cwd: directory });
}

async function writeViteConsumer(directory, manager = "npm") {
  await mkdir(join(directory, "src"), { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "zeron-vite-consumer-fixture",
    private: true,
    packageManager: manager === "pnpm" ? "pnpm@10.12.4" : undefined,
    type: "module",
    scripts: { build: "vite build" },
    dependencies: { react: "19.2.0", "react-dom": "19.2.0" },
    devDependencies: {
      "@tailwindcss/vite": "4.3.3",
      "@types/node": "20.19.9",
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      tailwindcss: "4.3.3",
      typescript: "5.9.3",
      vite: "8.2.1",
    },
  }, null, 2));
  await writeFile(join(directory, "components.json"), JSON.stringify({
    style: "new-york", rsc: false, tsx: true,
    tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true, prefix: "" },
    aliases: { components: "@/src/components", ui: "@/src/components/ui", lib: "@/src/lib", hooks: "@/src/hooks", utils: "@/src/lib/utils" },
  }, null, 2));
  await writeFile(join(directory, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2023", module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true, baseUrl: ".", paths: { "@/*": ["./*"] } },
    include: ["src", "components", "lib", "hooks", "vite.config.ts"],
  }, null, 2));
  await writeFile(join(directory, "index.html"), '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
  await writeFile(join(directory, "vite.config.ts"), [
    'import { defineConfig } from "vite";',
    'import tailwindcss from "@tailwindcss/vite";',
    'import { resolve } from "node:path";',
    '',
    'export default defineConfig({',
    '  plugins: [tailwindcss()],',
    '  resolve: { alias: { "@": resolve(import.meta.dirname, ".") } },',
    '});',
    '',
  ].join("\n"));
  await writeFile(join(directory, "src", "index.css"), '@import "tailwindcss";\n');
  await command(manager, ["install", "--ignore-scripts"], { cwd: directory });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function installWithCli({ consumer, component, manager, tarball }) {
  const args = ["add", component, ...(styles ? ["input", "card", "dialog"] : []), "--yes", "--cwd", consumer, "--registry", baseUrl];
  const env = { ...process.env, XDG_CACHE_HOME: join(work, "cache") };
  if (manager === "npm") {
    if (component === "button") {
      await rm(join(consumer, "components.json"));
      await command("npm", ["exec", "--yes", "--package", tarball, "--", "zeron-ui", "init", "--yes", "--cwd", consumer, "--registry", baseUrl], { env });
      await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
      if (styles) await verifyInitializedConsumer(consumer, "next");
    }
    await command("npm", ["exec", "--yes", "--package", tarball, "--", "zeron-ui", ...args], { env });
    await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
    if (component === "button") {
      await command("npm", ["exec", "--yes", "--package", tarball, "--", "zeron-ui", ...args], { env });
      await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
    }
    await assertBusinessSourceUntouched(consumer, component);
    await command("npx", ["tsc", "--noEmit"], { cwd: consumer });
    await verifyNextBuild({ consumer, component });
    return;
  }
  // pnpm's dlx does not accept a local tarball as a package option in every
  // supported version. Install the exact packed CLI into this isolated
  // fixture instead; no workspace package is linked.
  await command("pnpm", ["add", "--save-dev", "--ignore-scripts", tarball], { cwd: consumer, env });
  if (component === "button") {
    await rm(join(consumer, "components.json"));
    await command("pnpm", ["exec", "zeron-ui", "init", "--yes", "--cwd", consumer, "--registry", baseUrl], { cwd: consumer, env });
    await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
  }
  if (styles) await verifyInitializedConsumer(consumer, "next");
  await command("pnpm", ["exec", "zeron-ui", ...args], { cwd: consumer, env });
  await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
  if (component === "button") {
    await command("pnpm", ["exec", "zeron-ui", ...args], { cwd: consumer, env });
    await assertThemeInstallation({ consumer, cssPath: "app/globals.css", component });
  }
  await assertBusinessSourceUntouched(consumer, component);
  await command("pnpm", ["exec", "tsc", "--noEmit"], { cwd: consumer });
  await verifyNextBuild({ consumer, component });
  if (await exists(join(consumer, "package-lock.json"))) {
    throw new Error(`${component}: pnpm consumer unexpectedly created package-lock.json`);
  }
  if (!(await exists(join(consumer, "pnpm-lock.yaml")))) {
    throw new Error(`${component}: pnpm consumer did not create pnpm-lock.yaml`);
  }
}

async function assertThemeInstallation({ consumer, cssPath, component }) {
  const expectations = await consumerRegistryExpectations(registrySnapshot, component);
  const css = await readFile(join(consumer, cssPath), "utf8");
  if (component === "button" && cssPath === "app/globals.css" && /body\s*\{[^}]*background:\s*var\(--background\)/.test(css)) {
    throw new Error("Next starter body colors still override the installed Zeron theme");
  }
  const animationImports = css.match(/@import\s+["']tw-animate-css["'];/g) ?? [];
  if (expectations.animation && animationImports.length !== 1) {
    throw new Error(`${component}: expected one tw-animate-css import in ${cssPath}, found ${animationImports.length}`);
  }
  for (const token of expectations.tokens.map((name) => `--${name}`)) {
    if (!css.includes(token)) throw new Error(`${component}: ${cssPath} is missing ${token}`);
  }
  const manifest = JSON.parse(await readFile(join(consumer, "package.json"), "utf8"));
  if (expectations.animation && !(manifest.dependencies?.["tw-animate-css"] ?? manifest.devDependencies?.["tw-animate-css"])) {
    throw new Error(`${component}: tw-animate-css was not recorded in package.json`);
  }
  if (expectations.mergeTokens && !(await exists(join(consumer, "lib", "tailwind-merge-tokens.ts"))) &&
      !(await exists(join(consumer, "src", "lib", "tailwind-merge-tokens.ts")))) {
    throw new Error(`${component}: generated Tailwind merge token names were not installed`);
  }
}

async function readCssTree(directory) {
  const chunks = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) chunks.push(await readCssTree(path));
    else if (entry.name.endsWith(".css")) chunks.push(await readFile(path, "utf8"));
  }
  return chunks.join("\n");
}

async function assertCompiledUtilities(directory, component) {
  if (component !== "button") return;
  const css = await readCssTree(directory);
  for (const className of ["rounded-lg", "bg-primary-action", "border-hairline", "duration-fast", "animate-in", "fade-in"]) {
    if (!css.includes(`.${className}`)) {
      throw new Error(`${component}: built CSS is missing .${className}`);
    }
  }
}

async function assertBusinessSourceUntouched(consumer, component) {
  const content = await readFile(join(consumer, "business.ts"), "utf8");
  if (content !== BUSINESS_SOURCE) {
    throw new Error(`${component}: Registry installation rewrote the unrelated business.ts fixture`);
  }
}

async function verifyNextBuild({ consumer, component }) {
  const examples = {
    "funnel-chart": [
      'import { FunnelChart, type FunnelStage } from "@/components/ui/funnel-chart";',
      'const data: FunnelStage[] = [{ label: "Visits", value: 100 }, { label: "Orders", value: 20 }];',
      'export default function Page() { return <FunnelChart data={data} grid />; }',
    ].join("\n"),
    "integration-monitors-01": [
      'import { IntegrationMonitors, createIntegrationMonitorsDemoData } from "@/components/blocks/integration-monitors-01";',
      'const data = createIntegrationMonitorsDemoData();',
      'export default function Page() { return <IntegrationMonitors scopeId={data.scopeId} data={data} />; }',
    ].join("\n"),
    "chart": [
      '"use client";',
      'import { TimeSeriesChart, DonutSummary } from "@/components/ui/chart";',
      'export default function Page() { return <div><TimeSeriesChart data={[{ timestamp: 1791158400000, values: { requests: 12 } }]} series={[{ id: "requests", label: "Requests" }]} locale="en" timeZone="UTC" label="Requests" /><DonutSummary segments={[{ id: "used", label: "Used", value: 80 }]} total={100} aria-label="80 of 100" center="80 / 100" /></div>; }',
    ].join("\n"),
    "chart-primitives": [
      'import { ChartLegend, SegmentedBar } from "@/components/ui/chart-primitives";',
      'const segments = [{ id: "files", label: "Files", value: 80 }];',
      'export default function Page() { return <div><SegmentedBar mode="capacity" total={100} segments={segments} valueText="80 / 100" /><ChartLegend items={[{ id: "files", label: "Files", value: "80" }]} /></div>; }',
    ].join("\n"),
    "getting-started-01": [
      'import { GettingStarted, gettingStartedDemoTasks } from "@/components/blocks/getting-started-01";',
      'export default function Page() { return <GettingStarted tasks={gettingStartedDemoTasks} />; }',
    ].join("\n"),
    "cost-estimate-01": [
      '"use client";',
      'import { useState } from "react";',
      'import { CostEstimate, costEstimateDemoInputs, costEstimateDemoRegions, costEstimateDemoRateCards } from "@/components/blocks/cost-estimate-01";',
      'export default function Page() { const [value, setValue] = useState(costEstimateDemoInputs); return <CostEstimate value={value} onValueChange={setValue} rateCard={costEstimateDemoRateCards[value.regionId]} regions={costEstimateDemoRegions} />; }',
    ].join("\n"),
    "support-analytics-01": [
      '"use client";',
      'import { useState } from "react";',

      'import { SupportAnalytics, createSupportAnalyticsDemoData, type SupportAnalyticsQuery } from "@/components/blocks/support-analytics-01";',

      'function Demo() { const [query, setQuery] = useState<SupportAnalyticsQuery>({ range: "this-week", channel: "all" }); return <SupportAnalytics scopeId="support-demo" data={createSupportAnalyticsDemoData(query)} {...query} onRangeChange={(range) => setQuery({ ...query, range })} onChannelChange={(channel) => setQuery({ ...query, channel })} />; }',

      'export default function Page() { return <Demo />; }',
    ].join("\n"),
    "transaction-details-01": [
      '"use client";',
      'import { TransactionDetails, transactionDetailsDemoData } from "@/components/blocks/transaction-details-01";',
      'export default function Page() { return <TransactionDetails transactionId={transactionDetailsDemoData.id} data={transactionDetailsDemoData} />; }',
    ].join("\n"),
    "security-overview-01": [
      '"use client";',
      'import { SecurityOverview, securityOverviewDemoData } from "@/components/blocks/security-overview-01";',
      'export default function Page() { return <SecurityOverview scopeId="northwind" data={securityOverviewDemoData} range="30d" onRangeChange={() => {}} />; }',
      '',
    ].join("\n"),
    "deployment-detail-01": [
      'import { DeploymentDetail, deploymentDetailDemoData } from "@/components/blocks/deployment-detail-01";',
      'export default function Page() { return <DeploymentDetail data={deploymentDetailDemoData} />; }',
      '',
    ].join("\n"),
    "zaiops-operations-01": [
      '"use client";',
      'import { ZaiopsOperations } from "@/components/blocks/zaiops-operations-01";',
      'export default function Page() { return <ZaiopsOperations />; }',
    ].join("\n"),
    "cluster-environment-detail-01": [
      '"use client";',
      'import { ClusterEnvironmentDetail } from "@/components/blocks/cluster-environment-detail-01";',
      'export default function Page() { return <ClusterEnvironmentDetail />; }',
    ].join("\n"),
    "inspection-report-list-01": [
      '"use client";',
      'import { InspectionReportList } from "@/components/blocks/inspection-report-list-01";',
      'export default function Page() { return <InspectionReportList />; }',
    ].join("\n"),
    "service-management-01": [
      '"use client";',
      'import { ServiceManagement } from "@/components/blocks/service-management-01";',
      'export default function Page() { return <ServiceManagement />; }',
    ].join("\n"),
    "operations-workspace-shell-01": [
      '"use client";',
      'import { OperationsWorkspaceShell } from "@/components/blocks/operations-workspace-shell-01";',
      'export default function Page() { return <OperationsWorkspaceShell title="Verify" activeNavigation="home" />; }',
    ].join("\n"),
    "list-pagination": [
      '"use client";',
      'import { ListPagination } from "@/components/ui/list-pagination";',
      'export default function Page() { return <ListPagination total={11} page={0} pageSize={5} onPageChange={() => {}} onPageSizeChange={() => {}} />; }',
    ].join("\n"),
    "cluster-environment-list-01": [
      '"use client";',
      'import { ClusterEnvironmentList } from "@/components/blocks/cluster-environment-list-01";',
      'export default function Page() { return <ClusterEnvironmentList state="stale" refreshing onRefresh={async () => {}} onRetry={async () => {}} />; }',
      '',
    ].join("\n"),
    "monitoring-alert-list-01": [
      '"use client";',
      'import { MonitoringAlertList } from "@/components/blocks/monitoring-alert-list-01";',
      'export default function Page() { return <MonitoringAlertList state="error" retainDataOnError onRefresh={async () => {}} onRetry={async () => {}} />; }',
      '',
    ].join("\n"),
    "project-monitor-01": [
      'import { ProjectMonitor, projectMonitorDemoData } from "@/components/blocks/project-monitor-01";',
      'export default function Page() { return <ProjectMonitor data={projectMonitorDemoData} />; }',
      '',
    ].join("\n"),
    "model-router-01": [
      'import { ModelRouter, modelRouterDemoData } from "@/components/blocks/model-router-01";',
      'export default function Page() { return <ModelRouter data={modelRouterDemoData} />; }',
      '',
    ].join("\n"),
    "storage-usage-01": [
      'import { StorageUsage, storageUsageDemoData } from "@/components/blocks/storage-usage-01";',
      'export default function Page() { return <StorageUsage data={storageUsageDemoData} />; }',
      '',
    ].join("\n"),
    "user-account-01": [
      "'use client';",
      "import { UserAccount } from \"@/components/blocks/user-account-01\";",
      "export default function Page() { return <UserAccount user={{ name: \"Install verified\" }} theme=\"dark\" onThemeChange={() => undefined} onSignOut={async () => undefined} />; }",
    ].join("\n"),
    button: [
      'import { Button } from "@/components/ui/button";',
      '',
      'export default function Page() { return <Button className="border-hairline border-border animate-in fade-in duration-fast">Install verified</Button>; }',
      '',
    ].join("\n"),
    card: [
      'import { Card, CardContent, CardTitle } from "@/components/ui/card";',
      '',
      'export default function Page() { return <Card><CardContent><CardTitle>Install verified</CardTitle></CardContent></Card>; }',
      '',
    ].join("\n"),
    "ask-user-questions": [
      'import { AskUserQuestions } from "@/components/ui/ask-user-questions";',
      '',
      'export default function Page() { return <AskUserQuestions questions={[{ id: "verified", title: "Install verified?", options: [{ title: "Yes" }, { title: "No" }] }]} />; }',
      '',
    ].join("\n"),
    "code-block": [
      'import { CodeBlock } from "@/components/ui/code-block";',
      'import { CodeEditProvider } from "@/components/ui/code-block/edit";',
      'import { preloadCode } from "@/components/ui/code-block/server";',
      'import { CodeWorkerProvider } from "@/components/ui/code-block/worker";',
      '',
      'export default async function Page() {',
      '  const code = await preloadCode({ file: { name: "verified.ts", contents: "export const verified = true;", lang: "typescript" } });',
      '  return <CodeWorkerProvider poolSize={1}><CodeEditProvider><CodeBlock {...code} /></CodeEditProvider></CodeWorkerProvider>;',
      '}',
      '',
    ].join("\n"),
    tree: [
      'import { Tree } from "@/components/ui/tree";',
      '',
      'export default function Page() { return <Tree aria-label="Install verified" items={[{ key: "verified", label: "Install verified" }]} selectionMode="single" />; }',
      '',
    ].join("\n"),
    "resource-list-page-01": [
      'import { ResourceListPage } from "@/components/blocks/resource-list-page-01";',
      '',
      'export default function Page() { return <main style={{ height: "100svh" }}><ResourceListPage className="min-h-0" /></main>; }',
      '',
    ].join("\n"),
    "ai-gateway-overview-01": [
      'import { AiGatewayOverview, createAiGatewayOverviewDemoData } from "@/components/blocks/ai-gateway-overview-01";',
      '',
      'const data = createAiGatewayOverviewDemoData("30d");',
      '',
      'export default function Page() {',
      '  return <main style={{ height: "100svh" }}><AiGatewayOverview data={data} range="30d" sidebar={false} /></main>;',
      '}',
      '',
    ].join("\n"),
    "resource-list-table-01": [
      'import { ResourceListTable } from "@/components/blocks/resource-list-table-01";',
      '',
      'export default function Page() { return <ResourceListTable showCreateAction={false} surface="plain" />; }',
      '',
    ].join("\n"),
    "member-tree": [
      'import { MemberTree } from "@/components/ui/member-tree";',
      '',
      'export default function Page() { return <MemberTree aria-label="Install verified" items={[{ key: "member:verified", type: "member", memberId: "verified", label: "Install verified" }]} />; }',
      '',
    ].join("\n"),
    "file-tree": [
      'import { FileTree } from "@/components/ui/file-tree";',
      '',
      'export default function Page() { return <FileTree aria-label="Install verified" items={[{ key: "file:verified", type: "file", label: "Install verified.txt", extension: "txt" }]} />; }',
      '',
    ].join("\n"),
    "personal-settings-01": [
      'import { PersonalSettings, personalSettingsDemoData } from "@/components/blocks/personal-settings-01";',
      '',
      'export default function Page() { return <PersonalSettings data={personalSettingsDemoData} />; }',
      '',
    ].join("\n"),
    "infinite-log-table-01": [
      'import { InfiniteLogTable, createMockLogRecords } from "@/components/blocks/infinite-log-table-01";',
      '',
      'const records = createMockLogRecords({ days: 2 });',
      '',
      'export default function Page() { return <div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={records} /></div>; }',
      '',
    ].join("\n"),
  };
  examples["design-stack-01"] = [
    '"use client";',
    'import { DesignStack, designStackDemoItems, useDesignStackHistory } from "@/components/blocks/design-stack-01";',
    'export default function Page() { const { items, onItemsChange, history } = useDesignStackHistory(designStackDemoItems); return <DesignStack items={items} onItemsChange={onItemsChange} history={history} />; }',
  ].join("\n");
  examples["file-upload-01"] = [
    '"use client";',
    'import { FileUpload } from "@/components/blocks/file-upload-01";',
    'export default function Page() { return <FileUpload items={[{ id: "verified", name: "verified.txt", size: 1024, uploadedBytes: 512, status: "uploading" }]} />; }',
    '',
  ].join("\n");
  examples["badge"] = "\"use client\";\nimport { Badge } from \"@/components/ui/badge\";\nexport default function Page() { return <Badge variant=\"strong\" status=\"danger\">Install verified</Badge>; }\n";
  examples["availability-monitor-01"] = "\"use client\";\nimport { AvailabilityMonitor } from \"@/components/blocks/availability-monitor-01\";\nexport default function Page() { return <AvailabilityMonitor chartData={[{ timestamp: 1788836400000, routed: 0, direct: null }]} />; }\n";
  examples["model-detail-02"] = "\"use client\";\nimport { ModelDetail02 } from \"@/components/blocks/model-detail-02\";\nexport default function Page() { return <ModelDetail02 />; }\n";
  examples["file-manager-01"] = "\"use client\";\nimport { FileManager } from \"@/components/blocks/file-manager-01\";\nexport default function Page() { return <FileManager items={[]} error=\"Install verified\" />; }\n";
  const unifiedSource = unificationConsumerExample(component, "next");
  let source = styles ? consumerStyleExample("next") : unifiedSource ?? examples[component];
  if (!source) return;
  if (verifyUnification && !unifiedSource && !styles) {
    source = source.replace("export default function Page", "function InstalledDemo")
      + `\nexport default function Page() { return <main data-consumer="${component}"><InstalledDemo /></main>; }\n`;
  }
  await writeFile(join(consumer, "app", "page.tsx"), source);
  await command("npx", ["next", "build"], { cwd: consumer });
  await assertCompiledUtilities(join(consumer, ".next", "static", "css"), component);
  if (styles) await verifyConsumerStyles({ consumer, framework: "next", phase: "components" });
}

async function verifyInitializedConsumer(consumer, framework) {
  const source = framework === "next"
    ? 'export default function Page() { return <h1>Initialization verified</h1>; }\n'
    : 'import { createRoot } from "react-dom/client";\nimport "./index.css";\ncreateRoot(document.getElementById("root")!).render(<h1>Initialization verified</h1>);\n';
  await writeFile(join(consumer, framework === "next" ? "app/page.tsx" : "src/main.tsx"), source);
  await command("npx", framework === "next" ? ["next", "build"] : ["vite", "build"], { cwd: consumer });
  await verifyConsumerStyles({ consumer, framework, phase: "init" });
}

async function runNpmCli({ consumer, component, tarball, overwrite = false }) {
  const args = ["add", component, ...(styles ? ["input", "card", "dialog"] : []), "--yes", "--cwd", consumer, "--registry", baseUrl, ...(overwrite ? ["--overwrite"] : [])];
  await command("npm", ["exec", "--yes", "--package", tarball, "--", "zeron-ui", ...args], {
    env: { ...process.env, XDG_CACHE_HOME: join(work, "cache") },
  });
}

async function assertViteRejectsNextBlock({ consumer, tarball }) {
  const packageBefore = await readFile(join(consumer, "package.json"), "utf8");
  try {
    await runNpmCli({ consumer, component: "login-01", tarball });
  } catch (error) {
    const output = `${error.stdout ?? ""}\n${error.stderr ?? ""}\n${error.message ?? ""}`;
    if (!output.includes("requires Next.js")) throw error;
    if (await readFile(join(consumer, "package.json"), "utf8") !== packageBefore) {
      throw new Error("Vite consumer package.json changed before the Next.js requirement was rejected");
    }
    if (await exists(join(consumer, "components")) || await exists(join(consumer, ".zeron"))) {
      throw new Error("Vite consumer received component files before the Next.js requirement was rejected");
    }
    return;
  }
  throw new Error("Vite consumer unexpectedly accepted the Next.js-only login-01 Block");
}

async function installViteComponent({ consumer, component, tarball, manager = "npm" }) {
  if (manager === "pnpm") await command("pnpm", ["add", "--save-dev", "--ignore-scripts", tarball], { cwd: consumer });
  const cli = async (args) => command(manager, manager === "npm"
    ? ["exec", "--yes", "--package", tarball, "--", "zeron-ui", ...args]
    : ["exec", "zeron-ui", ...args], { cwd: consumer, env: { ...process.env, XDG_CACHE_HOME: join(work, "cache") } });
  if (component === "button") {
    await rm(join(consumer, "components.json"));
    await cli(["init", "--yes", "--cwd", consumer, "--registry", baseUrl]);
    await assertThemeInstallation({ consumer, cssPath: "src/index.css", component });
    if (styles) await verifyInitializedConsumer(consumer, "vite");
  }
  const args = ["add", component, ...(styles ? ["input", "card", "dialog"] : []), "--yes", "--cwd", consumer, "--registry", baseUrl];
  await cli(args);
  await assertThemeInstallation({ consumer, cssPath: "src/index.css", component });
  if (component === "button") {
    await cli([...args, "--overwrite"]);
    await assertThemeInstallation({ consumer, cssPath: "src/index.css", component });
  }
  const examples = {
    ...Object.fromEntries([
      ["zaiops-operations-01", "ZaiopsOperations"],
      ["cluster-environment-list-01", "ClusterEnvironmentList"],
      ["cluster-environment-detail-01", "ClusterEnvironmentDetail"],
      ["inspection-report-list-01", "InspectionReportList"],
      ["monitoring-alert-list-01", "MonitoringAlertList"],
      ["service-management-01", "ServiceManagement"],
    ].map(([name, exported]) => [name, [
      'import { createRoot } from "react-dom/client";',
      `import { ${exported} } from "@/src/components/blocks/${name}";`,
      'import "./index.css";',
      `createRoot(document.getElementById("root")!).render(<${exported} />);`,
    ].join("\n")])),
    "integration-monitors-01": [
      'import { createRoot } from "react-dom/client";',
      'import { IntegrationMonitors, createIntegrationMonitorsDemoData } from "@/src/components/blocks/integration-monitors-01";',
      'import "./index.css";',
      'const data = createIntegrationMonitorsDemoData();',
      'createRoot(document.getElementById("root")!).render(<IntegrationMonitors scopeId={data.scopeId} data={data} />);',
    ].join("\n"),
    "chart": [
      'import { createRoot } from "react-dom/client";',
      'import { TimeSeriesChart, DonutSummary } from "@/src/components/ui/chart";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<div><TimeSeriesChart data={[{ timestamp: 1791158400000, values: { requests: 12 } }]} series={[{ id: "requests", label: "Requests" }]} locale="en" timeZone="UTC" label="Requests" /><DonutSummary segments={[{ id: "used", label: "Used", value: 80 }]} total={100} aria-label="80 of 100" center="80 / 100" /></div>);',
    ].join("\n"),
    "funnel-chart": [
      'import { createRoot } from "react-dom/client";',
      'import { FunnelChart, type FunnelStage } from "@/src/components/ui/funnel-chart";',
      'import "./index.css";',
      'const data: FunnelStage[] = [{ label: "Visits", value: 100 }, { label: "Orders", value: 20 }];',
      'createRoot(document.getElementById("root")!).render(<FunnelChart data={data} grid />);',
    ].join("\n"),
    "chart-primitives": [
      'import { createRoot } from "react-dom/client";',
      'import { ChartLegend, SegmentedBar } from "@/src/components/ui/chart-primitives";',
      'import "./index.css";',
      'const segments = [{ id: "files", label: "Files", value: 80 }];',
      'createRoot(document.getElementById("root")!).render(<div><SegmentedBar mode="capacity" total={100} segments={segments} valueText="80 / 100" /><ChartLegend items={[{ id: "files", label: "Files", value: "80" }]} /></div>);',
    ].join("\n"),
    "getting-started-01": [
      'import { createRoot } from "react-dom/client";',
      'import { GettingStarted, gettingStartedDemoTasks } from "@/src/components/blocks/getting-started-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<GettingStarted tasks={gettingStartedDemoTasks} />);',
    ].join("\n"),
    "ai-gateway-overview-01": [
      'import { createRoot } from "react-dom/client";',
      'import { AiGatewayOverview, createAiGatewayOverviewDemoData } from "@/src/components/blocks/ai-gateway-overview-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<AiGatewayOverview data={createAiGatewayOverviewDemoData("30d")} range="30d" />);',
    ].join("\n"),
    "deployment-detail-01": [
      'import { createRoot } from "react-dom/client";',
      'import { DeploymentDetail, deploymentDetailDemoData } from "@/src/components/blocks/deployment-detail-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<DeploymentDetail data={deploymentDetailDemoData} />);',
      '',
    ].join("\n"),
    "cost-estimate-01": [
      'import { createRoot } from "react-dom/client";',
      'import { useState } from "react";',
      'import { CostEstimate, costEstimateDemoInputs, costEstimateDemoRegions, costEstimateDemoRateCards } from "@/src/components/blocks/cost-estimate-01";',
      'import "./index.css";',
      'function Demo() { const [value, setValue] = useState(costEstimateDemoInputs); return <CostEstimate value={value} onValueChange={setValue} rateCard={costEstimateDemoRateCards[value.regionId]} regions={costEstimateDemoRegions} />; }',
      'createRoot(document.getElementById("root")!).render(<Demo />);',
    ].join("\n"),
    "support-analytics-01": [
      'import { createRoot } from "react-dom/client";',
      'import { useState } from "react";',

      'import { SupportAnalytics, createSupportAnalyticsDemoData, type SupportAnalyticsQuery } from "@/src/components/blocks/support-analytics-01";',

      'import "./index.css";',

      'function Demo() { const [query, setQuery] = useState<SupportAnalyticsQuery>({ range: "this-week", channel: "all" }); return <SupportAnalytics scopeId="support-demo" data={createSupportAnalyticsDemoData(query)} {...query} onRangeChange={(range) => setQuery({ ...query, range })} onChannelChange={(channel) => setQuery({ ...query, channel })} />; }',

      'createRoot(document.getElementById("root")!).render(<Demo />);',
    ].join("\n"),
    "transaction-details-01": [
      'import { createRoot } from "react-dom/client";',
      'import { TransactionDetails, transactionDetailsDemoData } from "@/src/components/blocks/transaction-details-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<TransactionDetails transactionId={transactionDetailsDemoData.id} data={transactionDetailsDemoData} />);',
    ].join("\n"),
    "security-overview-01": [
      'import { createRoot } from "react-dom/client";',
      'import { SecurityOverview, securityOverviewDemoData } from "@/src/components/blocks/security-overview-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<SecurityOverview scopeId="northwind" data={securityOverviewDemoData} range="30d" onRangeChange={() => {}} />);',
      '',
    ].join("\n"),
    "project-monitor-01": [
      'import { createRoot } from "react-dom/client";',
      'import { ProjectMonitor, projectMonitorDemoData } from "@/src/components/blocks/project-monitor-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<ProjectMonitor data={projectMonitorDemoData} />);',
      '',
    ].join("\n"),
    "model-router-01": [
      'import { createRoot } from "react-dom/client";',
      'import { ModelRouter, modelRouterDemoData } from "@/src/components/blocks/model-router-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<ModelRouter data={modelRouterDemoData} />);',
      '',
    ].join("\n"),
    "storage-usage-01": [
      'import { createRoot } from "react-dom/client";',
      'import { StorageUsage, storageUsageDemoData } from "@/src/components/blocks/storage-usage-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<StorageUsage data={storageUsageDemoData} />);',
      '',
    ].join("\n"),
    "user-account-01": [
      "import { createRoot } from \"react-dom/client\";",
      "import { UserAccount } from \"@/src/components/blocks/user-account-01\";",
      "import \"./index.css\";",
      "createRoot(document.getElementById(\"root\")!).render(<UserAccount user={{ name: \"Install verified\" }} theme=\"dark\" onThemeChange={() => undefined} onSignOut={async () => undefined} />);",
    ].join("\n"),
    button: [
      'import { createRoot } from "react-dom/client";',
      'import { Button } from "@/src/components/ui/button";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Button className="border-hairline border-border animate-in fade-in duration-fast">Install verified</Button>);',
      '',
    ].join("\n"),
    card: [
      'import { createRoot } from "react-dom/client";',
      'import { Card, CardContent, CardTitle } from "@/src/components/ui/card";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Card><CardContent><CardTitle>Install verified</CardTitle></CardContent></Card>);',
      '',
    ].join("\n"),
    "ask-user-questions": [
      'import { createRoot } from "react-dom/client";',
      'import { AskUserQuestions } from "@/src/components/ui/ask-user-questions";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<AskUserQuestions questions={[{ id: "verified", title: "Install verified?", options: [{ title: "Yes" }, { title: "No" }] }]} />);',
      '',
    ].join("\n"),
    "code-block": [
      'import { createRoot } from "react-dom/client";',
      'import { CodeBlock } from "@/src/components/ui/code-block";',
      'import { CodeEditProvider } from "@/src/components/ui/code-block/edit";',
      'import { CodeWorkerProvider } from "@/src/components/ui/code-block/worker";',
      'import "./index.css";',
      '',
      'const file = { name: "verified.ts", contents: "export const verified = true;", lang: "typescript" as const };',
      'createRoot(document.getElementById("root")!).render(<CodeWorkerProvider poolSize={1}><CodeEditProvider><CodeBlock file={file} /></CodeEditProvider></CodeWorkerProvider>);',
      '',
    ].join("\n"),
    tree: [
      'import { createRoot } from "react-dom/client";',
      'import { Tree } from "@/src/components/ui/tree";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Tree aria-label="Install verified" items={[{ key: "verified", label: "Install verified" }]} selectionMode="single" />);',
      '',
    ].join("\n"),
    "resource-list-page-01": [
      'import { createRoot } from "react-dom/client";',
      'import { ResourceListPage } from "@/src/components/blocks/resource-list-page-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<main style={{ height: "100svh" }}><ResourceListPage className="min-h-0" /></main>);',
      '',
    ].join("\n"),
    "resource-list-table-01": [
      'import { createRoot } from "react-dom/client";',
      'import { ResourceListTable } from "@/src/components/blocks/resource-list-table-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<ResourceListTable showCreateAction={false} surface="plain" />);',
      '',
    ].join("\n"),
    "member-tree": [
      'import { createRoot } from "react-dom/client";',
      'import { MemberTree } from "@/src/components/ui/member-tree";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<MemberTree aria-label="Install verified" items={[{ key: "member:verified", type: "member", memberId: "verified", label: "Install verified" }]} />);',
      '',
    ].join("\n"),
    "file-tree": [
      'import { createRoot } from "react-dom/client";',
      'import { FileTree } from "@/src/components/ui/file-tree";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<FileTree aria-label="Install verified" items={[{ key: "file:verified", type: "file", label: "Install verified.txt", extension: "txt" }]} />);',
      '',
    ].join("\n"),
    "operations-workspace-shell-01": [
      'import { createRoot } from "react-dom/client";',
      'import { OperationsWorkspaceShell } from "@/src/components/blocks/operations-workspace-shell-01";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<OperationsWorkspaceShell title="Verify" activeNavigation="home" />);',
    ].join("\n"),
    "list-pagination": [
      'import { createRoot } from "react-dom/client";',
      'import { ListPagination } from "@/src/components/ui/list-pagination";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<ListPagination total={11} page={0} pageSize={5} onPageChange={() => {}} onPageSizeChange={() => {}} />);',
    ].join("\n"),
  };
  examples["design-stack-01"] = [
    'import { createRoot } from "react-dom/client";',
    'import { DesignStack, designStackDemoItems, useDesignStackHistory } from "@/src/components/blocks/design-stack-01";',
    'function App() { const { items, onItemsChange, history } = useDesignStackHistory(designStackDemoItems); return <DesignStack items={items} onItemsChange={onItemsChange} history={history} />; }',
    'createRoot(document.getElementById("root")!).render(<App />);',
  ].join("\n");
  examples["file-upload-01"] = [
    'import { createRoot } from "react-dom/client";',
    'import { FileUpload } from "@/src/components/blocks/file-upload-01";',
    'import "./index.css";',
    'createRoot(document.getElementById("root")!).render(<FileUpload items={[{ id: "verified", name: "verified.txt", size: 1024, uploadedBytes: 512, status: "uploading" }]} />);',
    '',
  ].join("\n");
  examples["badge"] = "import { Badge } from \"@/src/components/ui/badge\";\nexport default function App() { return <Badge variant=\"strong\" status=\"danger\">Install verified</Badge>; }\n";
  examples["availability-monitor-01"] = "import { AvailabilityMonitor } from \"@/src/components/blocks/availability-monitor-01\";\nexport default function App() { return <AvailabilityMonitor chartData={[{ timestamp: 1788836400000, routed: 0, direct: null }]} />; }\n";
  examples["model-detail-02"] = "import { ModelDetail02 } from \"@/src/components/blocks/model-detail-02\";\nexport default function App() { return <ModelDetail02 />; }\n";
  examples["file-manager-01"] = "import { FileManager } from \"@/src/components/blocks/file-manager-01\";\nexport default function App() { return <FileManager items={[]} error=\"Install verified\" />; }\n";
  const unifiedSource = unificationConsumerExample(component, "vite");
  let source = styles ? consumerStyleExample("vite") : unifiedSource ?? examples[component];
  if (!source) throw new Error(`No Vite entry example is defined for ${component}`);
  if (verifyUnification && !unifiedSource && !styles) {
    source = source.replace(/\.render\(([\s\S]+)\);?\s*$/, `.render(<main data-consumer="${component}">$1</main>);\n`);
  }
  await writeFile(join(consumer, "src", "main.tsx"), source);
  await command("npx", ["tsc", "--noEmit"], { cwd: consumer });
  await command(manager, ["run", "build"], { cwd: consumer });
  if (manager === "pnpm" && await exists(join(consumer, "package-lock.json"))) throw new Error(`${component}: Vite pnpm consumer created package-lock.json`);
  await assertCompiledUtilities(join(consumer, "dist", "assets"), component);
  if (styles) await verifyConsumerStyles({ consumer, framework: "vite", phase: "components" });
}

const work = await mkdtemp(join(tmpdir(), "zeron-consumer-"));
const server = await registryServer();
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

try {
  const pack = JSON.parse(await command("npm", ["pack", "--json", "--pack-destination", work], { cwd: join(ROOT, "packages/cli") }));
  const tarballName = pack[0]?.filename;
  if (typeof tarballName !== "string") throw new Error("npm pack did not report a CLI tarball filename");
  const tarball = join(work, tarballName);
  for (const manager of packageManagers) {
    for (const component of components) {
      const consumer = join(work, `${manager}-${component}`);
      await mkdir(consumer, { recursive: true });
      await writeConsumer(consumer, manager, { starter: component === "button" });
      await installWithCli({ consumer, component, manager, tarball });
      if (verifyFeedback && ["badge", "alert", "inline-notice"].includes(component)) {
        await verifyFeedbackConsumer({ consumer, framework: "next", component, packageManager: manager, registrySnapshot });
      }
      if (verifyUnification) await verifyUnificationConsumer({ consumer, framework: "next", component, packageManager: manager, registrySnapshot });
      console.log(`Consumer passed: ${manager}/${component}`);
      if (!keepConsumers) await rm(consumer, { recursive: true, force: true });
    }
  }
  for (const manager of vitePackageManagers) for (const component of viteComponents) {
    const consumer = join(work, `vite-${manager}-${component}`);
    await mkdir(consumer, { recursive: true });
    await writeViteConsumer(consumer, manager);
    await installViteComponent({ consumer, component, tarball, manager });
    if (verifyFeedback && ["badge", "alert", "inline-notice"].includes(component)) {
      await verifyFeedbackConsumer({ consumer, framework: "vite", component, packageManager: manager, registrySnapshot });
    }
    if (verifyUnification) await verifyUnificationConsumer({ consumer, framework: "vite", component, packageManager: manager, registrySnapshot });
    console.log(`Consumer passed: ${manager === "npm" ? "vite" : "vite-pnpm"}/${component}`);
    if (!keepConsumers) await rm(consumer, { recursive: true, force: true });
  }
  if (!styles) {
    const rejectionConsumer = join(work, "vite-next-rejection");
    await mkdir(rejectionConsumer, { recursive: true });
    await writeViteConsumer(rejectionConsumer);
    await assertViteRejectsNextBlock({ consumer: rejectionConsumer, tarball });
  }
  console.log(`Consumer ${styles ? "browser styles" : all ? "full" : "smoke"} matrix passed (${components.join(", ")} via ${packageManagers.join(", ")}; Vite: ${viteComponents.join(", ")})`);
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
  if (keepConsumers) console.log(`Consumer artifacts retained: ${work}`);
  else await rm(work, { recursive: true, force: true });
}
