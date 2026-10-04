import { fileURLToPath } from "node:url";

export default {
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  experimental: { cpus: 1 },
};
