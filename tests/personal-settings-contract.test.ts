import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const settings = readFileSync(join(ROOT, "packages/blocks/src/application/personal-settings-01/personal-settings.tsx"), "utf8");
const types = readFileSync(join(ROOT, "packages/blocks/src/application/personal-settings-01/personal-settings-types.ts"), "utf8");
const demoData = readFileSync(join(ROOT, "packages/blocks/src/application/personal-settings-01/personal-settings-demo-data.ts"), "utf8");
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));

describe("PersonalSettings integration contract", () => {
  it("publishes controlled navigation, resource data, actions, and operation state", () => {
    expect(settings).toContain("view?: SettingsView");
    expect(settings).toContain("onViewChange?: (view: SettingsView) => void");
    expect(settings).toContain("data?: PersonalSettingsData");
    expect(settings).toContain("actions?: PersonalSettingsActions");
    expect(settings).toContain("operationState?: PersonalSettingsOperationState");
    expect(settings).toContain("loading?: PersonalSettingsLoadingState");
    expect(settings).toContain("brand?: ReactNode");
    expect(settings).toContain("account?: ReactNode");
    expect(settings).toContain("labels?: PersonalSettingsLabels");
    expect(types).toContain("export interface PersonalSettingsActions");
    expect(types).toContain("export interface PersonalSettingsData");
    expect(types).toContain("profile?: PersonalSettingsProfile");
    expect(types).toContain("usage?: PersonalSettingsUsageData");
    expect(types).toContain("modelUsage?: PersonalSettingsModelUsageData");
    expect(types).toContain("callLogs?: PersonalSettingsCallLogsData");
    expect(types).toContain("preferences?: PersonalSettingsPreferences");
    expect(types).toContain("onPreferencesChange?: (preferences: PersonalSettingsPreferences)");
    expect(types).toContain("views?: Partial<Record<PersonalSettingsView");
    expect(types).toContain("navigation?: Partial<Record<PersonalSettingsView, string>>");
    expect(settings).toContain("personalSettingsDemoData");
    expect(demoData).toContain("export const personalSettingsDemoData");
    expect(settings).not.toContain("const modelServices:");
    expect(settings).not.toContain("const _credentials:");
  });

  it("does not expose resource actions without integration handlers", () => {
    expect(settings).toContain("if (!onAction) return null");
    expect(settings).toContain("actions?.onCreateApiKey &&");
    expect(settings).toContain("actions?.onCreateCredential &&");
    expect(settings).toContain("actions?.onCopyApiKey &&");
    expect(settings).toContain("if (!profileAction) return;");
    expect(settings).not.toContain("setPasswordAdded");
    expect(settings).not.toContain("setVerificationEnabled");
    expect(settings).not.toContain("setPasskeyAdded");
    expect(settings).not.toContain("setAccountDeleted");
    expect(settings).not.toContain("onClick={() => undefined}");
    expect(settings).toContain("const disabled = !actions?.onPreferencesChange");
    expect(settings).toContain("<UsageSettings data={data?.usage ?? defaultUsageData}");
    expect(settings).toContain("<ModelUsageSettings apiKeys={resourceData.apiKeys} data={data?.modelUsage ?? defaultModelUsageData}");
    expect(settings).toContain("<CallLogsSettings data={data?.callLogs ?? defaultCallLogsData}");
  });

  it("ships the public contract beside the component source", () => {
    const item = registry.items.find((candidate: { name: string }) => candidate.name === "personal-settings-01");
    expect(item.files.map((file: { path: string }) => file.path)).toContain(
      "packages/blocks/src/application/personal-settings-01/personal-settings-types.ts",
    );
    expect(item.files.map((file: { path: string }) => file.path)).toContain(
      "packages/blocks/src/application/personal-settings-01/personal-settings-demo-data.ts",
    );
  });
});
