/** Opaque Registry string transport for assets that cannot be represented as UTF-8. */
export const REGISTRY_BINARY_PREFIX = "zeron:base64:";

export function registryBinaryBytes(file) {
  if (!file.content.startsWith(REGISTRY_BINARY_PREFIX)) return null;
  if (file.type !== "registry:file" || !/\.(?:png|jpe?g|gif|webp|ico|woff2?)$/i.test(file.target)) {
    throw new Error(`Unsupported encoded Registry asset: ${file.target}`);
  }
  const encoded = file.content.slice(REGISTRY_BINARY_PREFIX.length);
  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.toString("base64") !== encoded) {
    throw new Error(`Invalid base64 Registry asset: ${file.target}`);
  }
  return bytes;
}
