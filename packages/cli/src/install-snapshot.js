import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const digest = (value) => createHash("sha256").update(value).digest("hex");

/** Only the verified closure is given to shadcn; it never refetches Registry URLs. */
export async function createInstallSnapshot(plan, { overwrite = false } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), "zeron-registry-"));
  try {
    const paths = new Map(plan.registryItems.map(({ url, item }, index) => [url, path.join(directory, `${index}`, `${item.name}.json`)]));
    const written = [];
    const retained = new Set(plan.files.filter((file) => file.existedBefore && !overwrite).map((file) => file.registryTarget));
    for (const { url, item, dependencies } of plan.registryItems) {
      const content = `${JSON.stringify({
        ...item,
        registryDependencies: dependencies.map((dependency) => paths.get(dependency)),
        files: (item.files ?? []).filter((file) => !retained.has(file.target)),
      })}\n`;
      if (dependencies.some((dependency) => !paths.has(dependency))) throw new Error("Incomplete Registry snapshot closure");
      const filename = paths.get(url);
      await mkdir(path.dirname(filename));
      await writeFile(filename, content, { mode: 0o400, flag: "wx" });
      written.push({ filename, hash: digest(content) });
    }
    return {
      paths: plan.registryRoots.map((url) => paths.get(url)),
      async verify() {
        for (const { filename, hash } of written) {
          if (digest(await readFile(filename)) !== hash) throw new Error("Registry snapshot changed after preflight");
        }
      },
      async cleanup() { await rm(directory, { recursive: true, force: true }); },
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
