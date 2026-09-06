import { readFileSync } from "node:fs";

/**
 * Block source, docs, and generated Registry entries share this manifest.
 * UI items deliberately fall back to the generic React/UI capability below.
 */
const BLOCK_CAPABILITIES = JSON.parse(readFileSync(new URL("../../blocks/block-capabilities.json", import.meta.url), "utf8"));

const OPTIONAL_PRO_DEPENDENCIES = [
  "@hugeicons-pro/core-stroke-standard",
  "@hugeicons-pro/core-bulk-rounded",
  "@hugeicons-pro/core-duotone-rounded",
];

export function registryMetadata(item) {
  const capability = item.type === "registry:block"
    ? BLOCK_CAPABILITIES[item.name]
    : { framework: "react", kind: "ui" };

  if (!capability) throw new Error(`Missing installation capability for Registry Block: ${item.name}`);

  return {
    framework: capability.framework,
    react: "^19.0.0",
    tailwind: "^4.0.0",
    kind: capability.kind,
    ...(item.name === "pro-icon-provider" ? { optionalDependencies: OPTIONAL_PRO_DEPENDENCIES } : {}),
  };
}

export function withRegistryMetadata(item) {
  return {
    ...item,
    meta: {
      ...item.meta,
      zeron: registryMetadata(item),
    },
  };
}
