import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@docs": fileURLToPath(new URL("./docs", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "#components": fileURLToPath(
        new URL("./packages/ui/src/components", import.meta.url)
      ),
      "#hooks": fileURLToPath(new URL("./packages/ui/src/hooks", import.meta.url)),
      "#system": fileURLToPath(new URL("./packages/ui/src/system", import.meta.url)),
      "#tokens": fileURLToPath(new URL("./packages/ui/src/tokens", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{js,mjs,ts,tsx}"],
  },
});
