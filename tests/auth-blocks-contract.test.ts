import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");
const login = read("packages/blocks/src/application/login-01/login-01.tsx");
const signup = read("packages/blocks/src/application/signup-01/signup-01.tsx");
const packageJson = JSON.parse(read("packages/blocks/package.json"));
const registry = JSON.parse(read("packages/blocks/registry.json"));

describe("authentication blocks", () => {
  it("publishes both blocks with the shared icon system and no local design assets", () => {
    expect(packageJson.exports["./login-01"]).toBe(
      "./src/application/login-01/index.ts"
    );
    expect(packageJson.exports["./signup-01"]).toBe(
      "./src/application/signup-01/index.ts"
    );
    expect(packageJson.exports["./login-03"]).toBeUndefined();
    expect(packageJson.exports["./signup-05"]).toBeUndefined();

    for (const [name, title] of [["login-01", "Login"], ["signup-01", "Signup"]] as const) {
      const item = registry.items.find((entry: { name: string }) => entry.name === name);
      expect(item).toMatchObject({
        title,
        type: "registry:block",
        registryDependencies: expect.arrayContaining([
          "auth-layout",
          "button",
          "field",
          "icon-context",
          "input",
          "separator",
        ]),
        dependencies: expect.arrayContaining(["@lobehub/icons"]),
      });
      expect(item.files).toHaveLength(2);
    }
    expect(
      registry.items.find(
        (entry: { name: string }) =>
          entry.name === "login-03" || entry.name === "signup-05"
      )
    ).toBeUndefined();
  });

  it("builds login from the shared layout, card, fields, and async auth callbacks", () => {
    expect(login).toContain("<AuthLayout");
    expect(login).toContain('<AuthLayoutContent size="sm">');
    expect(login).toContain("<Card");
    expect(login).toContain('autoComplete="current-password"');
    expect(login).toContain("onAppleLogin");
    expect(login).toContain("onGoogleLogin");
    expect(login).toContain('pendingAction === "credentials"');
  });

  it("keeps signup surface-neutral and responsive", () => {
    expect(signup).toContain("<AuthLayout");
    expect(signup).toContain('<AuthLayoutContent size="sm">');
    expect(signup).not.toContain("<Card");
    expect(signup).toContain("sm:grid-cols-2");
    expect(signup).toContain("onAppleSignup");
    expect(signup).toContain("onGoogleSignup");
    expect(signup).toContain('pendingAction === "email"');
  });

  it("delegates control styling to the existing components", () => {
    for (const source of [login, signup]) {
      expect(source).toContain('from "@zeron/ui/auth-layout"');
      expect(source).toContain('from "@zeron/ui/system/icon-context"');
      expect(source).toContain("text-fg-default");
      expect(source).not.toContain("bg-emphasis");
      expect(source).not.toContain("shadow-control");
      expect(source).not.toContain("AssetMask");
      expect(source).not.toContain('<span className="inline-flex items-center gap-2">');
      expect(source).toContain("leadingIcon={AppleBrandIcon}");
      expect(source).toContain("leadingIcon={GoogleBrandIcon}");
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
      expect(source).not.toContain("rgba(");
      expect(source).not.toContain("figma.com/api/mcp/asset");
    }
    expect(login.match(/size="lg"/g)).toHaveLength(5);
    expect(signup.match(/size="lg"/g)).toHaveLength(4);
    expect(login).toContain('<AuthLayoutBody className="border-[0.5px] border-border">');
    expect(signup).toContain("<AuthLayoutBody>");
    expect(signup).not.toContain("border-[0.5px]");
    expect(login).toContain('variant="neutral"');
    expect(signup).not.toContain('variant="neutral"');
  });
});
