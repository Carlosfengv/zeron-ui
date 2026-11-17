import aliases from "./block-registry-slugs.json";

const registryNamesBySlug = new Map(Object.entries(aliases).map(([name, slug]) => [slug, name]));

export function registryNameForBlockSlug(slug: string): string {
  return registryNamesBySlug.get(slug) ?? slug;
}
