/**
 * Runs the published-shaped CLI against a clean consumer.  It intentionally
 * does not link this workspace: the CLI is packed, Registry files are served
 * over HTTP, and the consumer has its own node_modules and lockfile.
 *
 * `--all` expands the component list; each item gets its own consumer so a
 * preinstalled dependency can never hide a broken Registry closure.
 */

import { createServer } from "node:http";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = new URL("..", import.meta.url).pathname;
const REGISTRY_DIR = join(ROOT, "public/r");
const all = process.argv.includes("--all");
const registryItems = JSON.parse(await readFile(join(REGISTRY_DIR, "registry.json"), "utf8")).items;
const allRegistryItems = registryItems.map((item) => item.name).filter((name) => typeof name === "string");
const components = process.env.ZERON_CONSUMER_COMPONENTS?.split(",").filter(Boolean) ?? (all
  ? allRegistryItems
  : ["button", "card", "ask-user-questions", "infinite-log-table-01"]);
const packageManagers = process.env.ZERON_CONSUMER_PACKAGE_MANAGERS?.split(",").filter(Boolean) ?? ["npm", "pnpm"];
const viteComponents = process.env.ZERON_VITE_CONSUMER_COMPONENTS?.split(",").filter(Boolean) ?? ["button", "card", "ask-user-questions"];
const BUSINESS_SOURCE = "export const identity = <T>(value: T): T => value;\n";

if (packageManagers.some((manager) => !["npm", "pnpm"].includes(manager))) {
  throw new Error("ZERON_CONSUMER_PACKAGE_MANAGERS must contain only npm and/or pnpm");
}

function registryServer() {
  const server = createServer(async (request, response) => {
    const name = basename(new URL(request.url ?? "/", "http://localhost").pathname);
    if (!/^[a-z0-9-]+\.json$/.test(name)) {
      response.writeHead(404).end();
      return;
    }
    try {
      response.writeHead(200, { "content-type": "application/json" });
      const origin = `http://${request.headers.host}`;
      const data = (await readFile(join(REGISTRY_DIR, name), "utf8"))
        .replaceAll("https://zeron-ui.vercel.app/r", origin);
      response.end(data);
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

async function writeConsumer(directory, packageManager) {
  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "zeron-consumer-fixture",
    private: true,
    packageManager: packageManager === "pnpm" ? "pnpm@10.12.4" : undefined,
    dependencies: { next: "15.5.9", react: "19.2.0", "react-dom": "19.2.0" },
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
  // TypeScript's standalone checker does not load Next's generated asset
  // declarations. Keep this consumer fixture able to validate Registry
  // Blocks that import static SVG assets, just as a Next project does.
  await writeFile(join(directory, "assets.d.ts"), 'declare module "*.svg" {\n  const source: string;\n  export default source;\n}\n');
  // The generated shadcn base layer uses `outline-ring/50`. Define the
  // minimal Tailwind 4 color tokens up front so a real Next production build
  // validates the CSS emitted by Registry installation.
  await writeFile(join(directory, "app", "globals.css"), '@import "tailwindcss";\n\n@theme {\n  --color-background: #ffffff;\n  --color-border: #e5e7eb;\n  --color-foreground: #111827;\n  --color-ring: #6088e8;\n}\n');
  await command(packageManager, ["install", "--ignore-scripts"], { cwd: directory });
}

async function writeViteConsumer(directory) {
  await mkdir(join(directory, "src"), { recursive: true });
  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "zeron-vite-consumer-fixture",
    private: true,
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
  // shadcn's generated base layer uses `outline-ring/50`. Define the token in
  // the consumer fixture so Tailwind 4 validates that generated CSS exactly
  // as it would in a project that supplies a theme.
  await writeFile(join(directory, "src", "index.css"), '@import "tailwindcss";\n\n@theme {\n  --color-background: #ffffff;\n  --color-border: #e5e7eb;\n  --color-foreground: #111827;\n  --color-ring: #6088e8;\n}\n');
  await command("npm", ["install", "--ignore-scripts"], { cwd: directory });
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
  const args = ["add", component, "--yes", "--cwd", consumer, "--registry", baseUrl];
  const env = { ...process.env, XDG_CACHE_HOME: join(work, "cache") };
  if (manager === "npm") {
    await command("npm", ["exec", "--yes", "--package", tarball, "--", "zeron-ui", ...args], { env });
    await assertBusinessSourceUntouched(consumer, component);
    await command("npx", ["tsc", "--noEmit"], { cwd: consumer });
    await verifyNextBuild({ consumer, component });
    return;
  }
  // pnpm's dlx does not accept a local tarball as a package option in every
  // supported version. Install the exact packed CLI into this isolated
  // fixture instead; no workspace package is linked.
  await command("pnpm", ["add", "--save-dev", "--ignore-scripts", tarball], { cwd: consumer, env });
  await command("pnpm", ["exec", "zeron-ui", ...args], { cwd: consumer, env });
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

async function assertBusinessSourceUntouched(consumer, component) {
  const content = await readFile(join(consumer, "business.ts"), "utf8");
  if (content !== BUSINESS_SOURCE) {
    throw new Error(`${component}: Registry installation rewrote the unrelated business.ts fixture`);
  }
}

async function verifyNextBuild({ consumer, component }) {
  const examples = {
    button: [
      'import { Button } from "@/components/ui/button";',
      '',
      'export default function Page() { return <Button>Install verified</Button>; }',
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
    tree: [
      'import { Tree } from "@/components/ui/tree";',
      '',
      'export default function Page() { return <Tree aria-label="Install verified" items={[{ key: "verified", label: "Install verified" }]} selectionMode="single" />; }',
      '',
    ].join("\n"),
    "resource-list-layout": [
      'import { ResourceListLayout } from "@/components/ui/resource-list-layout";',
      '',
      'export default function Page() {',
      '  return <div style={{ height: 640 }}><ResourceListLayout title="Resources" actions={<button type="button">Create</button>} toolbar={<input aria-label="Search resources" />} pagination={<button type="button">Next</button>}><p>Install verified</p></ResourceListLayout></div>;',
      '}',
      '',
    ].join("\n"),
    "resource-list-page-01": [
      'import { ResourceListPage } from "@/components/blocks/resource-list-page-01";',
      '',
      'export default function Page() { return <main style={{ height: "100svh" }}><ResourceListPage className="min-h-0" /></main>; }',
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
  const source = examples[component];
  if (!source) return;
  await writeFile(join(consumer, "app", "page.tsx"), source);
  await command("npx", ["next", "build"], { cwd: consumer });
}

async function runNpmCli({ consumer, component, tarball }) {
  const args = ["add", component, "--yes", "--cwd", consumer, "--registry", baseUrl];
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

async function installViteComponent({ consumer, component, tarball }) {
  await runNpmCli({ consumer, component, tarball });
  const examples = {
    button: [
      'import { createRoot } from "react-dom/client";',
      'import { Button } from "@/src/components/ui/button";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Button>Install verified</Button>);',
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
    tree: [
      'import { createRoot } from "react-dom/client";',
      'import { Tree } from "@/src/components/ui/tree";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Tree aria-label="Install verified" items={[{ key: "verified", label: "Install verified" }]} selectionMode="single" />);',
      '',
    ].join("\n"),
    "resource-list-layout": [
      'import { createRoot } from "react-dom/client";',
      'import { ResourceListLayout } from "@/src/components/ui/resource-list-layout";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<div style={{ height: 640 }}><ResourceListLayout title="Resources" actions={<button type="button">Create</button>} toolbar={<input aria-label="Search resources" />} pagination={<button type="button">Next</button>}><p>Install verified</p></ResourceListLayout></div>);',
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
  };
  const source = examples[component];
  if (!source) throw new Error(`No Vite entry example is defined for ${component}`);
  await writeFile(join(consumer, "src", "main.tsx"), source);
  await command("npx", ["tsc", "--noEmit"], { cwd: consumer });
  await command("npm", ["run", "build"], { cwd: consumer });
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
      await writeConsumer(consumer, manager);
      await installWithCli({ consumer, component, manager, tarball });
    }
  }
  for (const component of viteComponents) {
    const consumer = join(work, `vite-${component}`);
    await mkdir(consumer, { recursive: true });
    await writeViteConsumer(consumer);
    await installViteComponent({ consumer, component, tarball });
  }
  const rejectionConsumer = join(work, "vite-next-rejection");
  await mkdir(rejectionConsumer, { recursive: true });
  await writeViteConsumer(rejectionConsumer);
  await assertViteRejectsNextBlock({ consumer: rejectionConsumer, tarball });
  console.log(`Consumer ${all ? "full" : "smoke"} matrix passed (${components.join(", ")} via ${packageManagers.join(", ")}; Vite: ${viteComponents.join(", ")}; Next-only rejection)`);
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(work, { recursive: true, force: true });
}
