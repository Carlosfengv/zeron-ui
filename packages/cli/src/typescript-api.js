import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Use the compiler API already installed by the pinned shadcn dependency.
// Loading it on demand keeps help and Registry listing off the parser path.
export function getTypeScript() {
  return require("@ts-morph/common").ts;
}
