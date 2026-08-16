import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/provider-create-form-01/provider-create-form.tsx"
  ),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8")
);

describe("Provider Create Form 1 block contract", () => {
  it("is publicly exported and installable from the block registry", () => {
    expect(packageJson.exports["./provider-create-form-01"]).toBe(
      "./src/application/provider-create-form-01/index.ts"
    );
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "provider-create-form-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["tw-animate-css", "@lobehub/icons"],
      registryDependencies: expect.arrayContaining([
        "field",
        "input",
        "badge",
        "select",
        "stepper",
        "switch",
        "textarea",
      ]),
    });
    expect(item.files).toHaveLength(2);
  });

  it("composes the complete three-step workflow from existing primitives", () => {
    expect(source).toContain('<StepperContent value="basic">');
    expect(source).toContain('<StepperContent value="connection">');
    expect(source).toContain('<StepperContent value="review">');
    expect(source).toContain("<Field");
    expect(source).toContain("<Textarea");
    expect(source).toContain("onVerifyAndFetchModels");
    expect(source).toContain("defaultModelsByProvider");
    expect(source).toContain("toggleModel");
    expect(source).toContain("<Switch");
    expect(source).toContain("<Badge");
    expect(source).toContain("<DetailList");
    expect(source).toContain("<Alert");
    expect(source).toContain('import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono"');
    expect(source).toContain('import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color"');
    expect(source).toContain('import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono"');
    expect(source).toContain("function ProviderBrandIcon");
    expect(source).toContain("function ProviderModelIcon");
    expect(source).toContain('connectionResult?.status === "error"');
    expect(source).not.toContain('connectionResult.status === "success" ? "neutral" : "danger"');
  });

  it("supports replaceable data, model discovery, per-model availability, and persistence", () => {
    expect(source).toContain("defaultValues?: Partial<ProviderFormValues>");
    expect(source).toContain("providerOptions?: readonly ProviderOption[]");
    expect(source).toContain('Partial<Omit<ProviderCreateFormLabels, "errors">>');
    expect(source).toContain("onVerifyAndFetchModels?: (");
    expect(source).toContain("onSubmit?: (values: ProviderFormValues)");
    expect(source).toContain("models: ProviderModel[]");
    expect(source).toContain("tags?: readonly string[]");
    expect(source).toContain("enabled: previous.get(model.id) ?? true");
    expect(source).toContain("enabledModels = values.models.filter");
    expect(source).toContain("focusFirstInvalid");
    expect(source).toContain("toast.success");
  });

  it("uses semantic tokens and keeps layout variables scoped to the block", () => {
    expect(source).toContain('"--provider-form-max-width": "60rem"');
    expect(source).toContain('"--provider-form-content-max-width": "42rem"');
    expect(source).toContain('"--provider-form-body-height": "32rem"');
    expect(source).toContain('maxHeight="var(--provider-form-body-height)"');
    expect(source).toContain('style={{ height: "var(--provider-form-body-height)" }}');
    expect(source).toContain('StepperList className="w-fit max-w-full flex-wrap justify-start gap-1"');
    expect(source).not.toContain("grid-cols-3");
    expect(source).toContain("bg-surface-raised");
    expect(source).toContain("border-border-subtle");
    expect(source).toContain("text-fg-muted");
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps the API key field on the 32px system-default InputGroup size", () => {
    expect(source).toContain(
      '<InputGroup aria-invalid={Boolean(errors.apiKey) || undefined}>'
    );
    expect(source).not.toContain(
      '<InputGroup size="sm" aria-invalid={Boolean(errors.apiKey) || undefined}>'
    );
  });
});
