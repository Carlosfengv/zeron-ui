import { defineConfig } from "vitest/config";
import base from "./vitest.config.mjs";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/*production*.test.ts"],
    exclude: [],
    maxWorkers: 1,
  },
});
