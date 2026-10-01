import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { themeBootstrapScript } from "../app/theme-bootstrap";

function bootstrap(savedTheme: string | null, storageUnavailable = false) {
  const classes = new Set<string>();
  runInNewContext(themeBootstrapScript, {
    window: { localStorage: { getItem: () => {
      if (storageUnavailable) throw new Error("Storage unavailable");
      return savedTheme;
    } } },
    document: { documentElement: { classList: {
      add: (name: string) => classes.add(name),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
    } } },
  });
  return [...classes];
}

describe("theme before hydration", () => {
  it.each(["light", "dark"])("restores the saved %s choice", (theme) => {
    expect(bootstrap(theme)).toEqual([theme]);
  });

  it.each(["system", "invalid", null])("leaves %s to the system preference", (theme) => {
    expect(bootstrap(theme)).toEqual([]);
  });

  it("allows rendering when browser storage is unavailable", () => {
    expect(bootstrap(null, true)).toEqual([]);
  });
});
