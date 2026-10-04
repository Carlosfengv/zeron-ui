export const skillTextSelectionPath = "zeron-page-builder/assets/text-references.json";
export const pairedSkillNames = ["zeron-page-builder", "swap-to-zeronui"];

/** Syntax is only a boundary; the version's selection file supplies authorization. */
export function isSkillTextReference(reference) {
  return typeof reference === "string" && reference.length <= 256
    && /^[a-zA-Z0-9][a-zA-Z0-9._/-]*\.(?:md|txt|json|yaml|yml|mjs|js|ts|tsx|css)$/.test(reference)
    && reference.split("/").every(part => part && part !== "." && part !== "..");
}

export function parseSkillTextSelection(value, availablePaths) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "references,schemaVersion"
    || value.schemaVersion !== 1 || !Array.isArray(value.references)
    || value.references.length < 3 || value.references.length > 256) throw new Error("Invalid Skill text selection");
  const available = new Set(availablePaths);
  const references = value.references;
  if (new Set(references).size !== references.length
    || JSON.stringify(references) !== JSON.stringify([...references].sort())
    || references.some(reference => {
      if (typeof reference !== "string") return true;
      const [name, ...parts] = reference.split("/");
      return !pairedSkillNames.includes(name) || !isSkillTextReference(parts.join("/")) || !available.has(reference);
    })
    || ![skillTextSelectionPath, ...pairedSkillNames.map(name => `${name}/SKILL.md`)].every(reference => references.includes(reference))) {
    throw new Error("Skill text selection must contain unique sorted manifest paths and both entrypoints");
  }
  return references;
}
