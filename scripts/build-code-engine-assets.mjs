import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import autoprefixer from "autoprefixer"
import { build as buildJavaScript } from "esbuild"
import { transform as transformCSS } from "lightningcss"
import postcss from "postcss"
import postcssCalc from "postcss-calc"
import postcssNesting from "postcss-nesting"

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const engineRoot = path.join(repositoryRoot, "packages/ui/src/system/code-engine")
const codeBlockRoot = path.join(repositoryRoot, "packages/ui/src/components/code-block")
const registryPath = path.join(repositoryRoot, "packages/ui/registry.json")
const stylesRoot = path.join(engineRoot, "styles")
const checkOnly = process.argv.includes("--check")
const layerOrder = "@layer base,theme,rendered,unsafe;"

async function compileCSS(sourcePath) {
  const source = await fs.readFile(sourcePath, "utf8")
  const processed = await postcss([
    postcssNesting(),
    postcssCalc({
      preserve: false,
      precision: 5,
      warnWhenCannotResolve: false,
    }),
    autoprefixer,
  ]).process(source, { from: sourcePath, map: false })

  const minified = transformCSS({
    filename: sourcePath,
    code: Buffer.from(processed.css),
    minify: true,
  }).code.toString()

  return minified.startsWith(layerOrder) ? minified : `${layerOrder}${minified}`
}

function stringModule(value) {
  return `const css = ${JSON.stringify(value)}\n\nexport default css\n`
}

async function buildWorker() {
  const result = await buildJavaScript({
    absWorkingDir: repositoryRoot,
    bundle: true,
    entryPoints: [path.join(engineRoot, "worker/worker-portable.ts")],
    format: "esm",
    legalComments: "eof",
    logLevel: "silent",
    minify: true,
    platform: "browser",
    sourcemap: false,
    target: ["es2022"],
    treeShaking: true,
    write: false,
  })

  const output = result.outputFiles.find((file) => file.path.endsWith(".js")) ?? result.outputFiles[0]
  if (output == null) {
    throw new Error("Code engine Worker build did not produce JavaScript")
  }
  return output.text
}

async function assertOrWrite(targetPath, contents) {
  if (checkOnly) {
    let current
    try {
      current = await fs.readFile(targetPath, "utf8")
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw new Error(`Missing generated code engine asset: ${path.relative(repositoryRoot, targetPath)}`)
      }
      throw error
    }
    if (current !== contents) {
      throw new Error(`Generated code engine asset is stale: ${path.relative(repositoryRoot, targetPath)}`)
    }
    return
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, contents)
}

async function sourceFiles(root) {
  const files = []
  const visit = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    await Promise.all(entries.map(async (entry) => {
      const location = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(location)
      } else if (/\.(?:css|d\.ts|js|json|ts|tsx)$/.test(entry.name)) {
        files.push(location)
      }
    }))
  }
  await visit(root)
  return files.sort()
}

function registryFile(sourcePath, sourceRoot, targetRoot, type) {
  const relative = path.relative(sourceRoot, sourcePath).split(path.sep).join("/")
  return {
    path: path.relative(repositoryRoot, sourcePath).split(path.sep).join("/"),
    type,
    target: `${targetRoot}/${relative}`,
  }
}

async function codeEngineRegistryItems() {
  const [engineFiles, componentFiles] = await Promise.all([
    sourceFiles(engineRoot),
    sourceFiles(codeBlockRoot),
  ])

  return [
    {
      name: "code-engine",
      type: "registry:lib",
      title: "Code Engine",
      description: "Rendering, highlighting, diff, streaming, editing, SSR, theme, and Worker runtime used by Code Block.",
      dependencies: [
        "@shikijs/themes",
        "@shikijs/transformers",
        "@types/hast",
        "diff",
        "hast-util-to-html",
        "lru_map",
        "shiki",
      ],
      files: engineFiles.map((file) =>
        registryFile(file, engineRoot, "lib/code-engine", "registry:lib")
      ),
    },
    {
      name: "code-block",
      type: "registry:ui",
      title: "Code Block",
      description: "Code display, diff, patch, conflict, streaming, Worker, SSR, and editing components.",
      registryDependencies: [
        "button",
        "code-engine",
        "icon-context",
        "tooltip",
        "utils",
      ],
      files: componentFiles.map((file) =>
        registryFile(file, codeBlockRoot, "components/ui/code-block", "registry:ui")
      ),
    },
  ]
}

async function updateRegistry() {
  const registry = JSON.parse(await fs.readFile(registryPath, "utf8"))
  const generatedItems = await codeEngineRegistryItems()
  const generatedNames = new Set(generatedItems.map((item) => item.name))
  const currentGeneratedItems = registry.items.filter((item) => generatedNames.has(item.name))

  if (checkOnly) {
    if (JSON.stringify(currentGeneratedItems) !== JSON.stringify(generatedItems)) {
      throw new Error("Code engine Registry file list is stale; run pnpm code-engine:build")
    }
    return
  }

  registry.items = [
    ...registry.items.filter((item) => !generatedNames.has(item.name)),
    ...generatedItems,
  ]
  await fs.writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
}

const [baseCSS, editorCSS, workerJavaScript] = await Promise.all([
  compileCSS(path.join(stylesRoot, "base.css")),
  compileCSS(path.join(stylesRoot, "editor.css")),
  buildWorker(),
])

await Promise.all([
  assertOrWrite(path.join(stylesRoot, "base-css.generated.ts"), stringModule(baseCSS)),
  assertOrWrite(path.join(stylesRoot, "editor-css.generated.ts"), stringModule(editorCSS)),
  assertOrWrite(path.join(engineRoot, "worker/worker.js"), workerJavaScript),
])

await updateRegistry()

console.log(checkOnly ? "Code engine assets are current." : "Built code engine assets.")
