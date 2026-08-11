import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;

function jsonFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leafEntries(value: unknown, prefix = ""): Array<[string, string]> {
  if (typeof value === "string") return [[prefix, value]];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    leafEntries(child, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholders(message: string) {
  const names = new Set<string>();
  const visit = (elements: MessageFormatElement[]) => {
    for (const element of elements) {
      if (
        element.type === TYPE.argument ||
        element.type === TYPE.number ||
        element.type === TYPE.date ||
        element.type === TYPE.time
      ) {
        names.add(element.value);
      } else if (
        element.type === TYPE.select ||
        element.type === TYPE.plural ||
        element.type === TYPE.selectordinal
      ) {
        names.add(element.value);
        Object.values(element.options).forEach((option) => visit(option.value));
      } else if (element.type === TYPE.tag) {
        visit(element.children);
      }
    }
  };
  visit(parse(message, { ignoreTag: false }));
  return [...names].sort();
}

describe("i18n message parity", () => {
  it("keeps English and Simplified Chinese message files and keys aligned", () => {
    const englishRoot = join(ROOT, "messages/en");
    const chineseRoot = join(ROOT, "messages/zh-CN");
    const englishFiles = jsonFiles(englishRoot)
      .map((file) => relative(englishRoot, file))
      .sort();
    const chineseFiles = jsonFiles(chineseRoot)
      .map((file) => relative(chineseRoot, file))
      .sort();

    expect(chineseFiles).toEqual(englishFiles);
    for (const file of englishFiles) {
      const english = JSON.parse(readFileSync(join(englishRoot, file), "utf8"));
      const chinese = JSON.parse(readFileSync(join(chineseRoot, file), "utf8"));
      expect(leafPaths(chinese).sort(), file).toEqual(leafPaths(english).sort());
      const englishEntries = new Map(leafEntries(english));
      const chineseEntries = new Map(leafEntries(chinese));
      for (const [key, englishValue] of englishEntries) {
        const chineseValue = chineseEntries.get(key);
        expect(englishValue.trim(), `${file}:${key} must not be empty`).not.toBe("");
        expect(chineseValue?.trim(), `${file}:${key} must not be empty`).not.toBe("");
        expect(englishValue, `${file}:${key} must not contain placeholder copy`).not.toMatch(/\bTODO\b|\bTBD\b|待翻译/i);
        expect(chineseValue, `${file}:${key} must not contain placeholder copy`).not.toMatch(/\bTODO\b|\bTBD\b|待翻译/i);
        expect(placeholders(chineseValue!), `${file}:${key} ICU arguments`).toEqual(placeholders(englishValue));
      }
    }
  });

  it("uses language endonyms in both interfaces", () => {
    for (const locale of ["en", "zh-CN"]) {
      const messages = JSON.parse(readFileSync(join(ROOT, "messages", locale, "common.json"), "utf8"));
      expect(messages.settings.english).toBe("English");
      expect(messages.settings.chinese).toBe("简体中文");
    }
  });
});
