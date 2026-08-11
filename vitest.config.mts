import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@/docs": fileURLToPath(new URL("./src/docs", import.meta.url)),
      "@/i18n": fileURLToPath(new URL("./src/i18n", import.meta.url)),
      "@/lib": fileURLToPath(new URL("./src/system", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{js,mjs,ts,tsx}"],
  },
});
