import { blockCatalog } from "@zeron/blocks/catalog";
import identities from "@docs/agent-data/item-identities.json";
import { artifactCatalog, type ArtifactEntry } from "@docs/catalog/artifacts";
import { navigationDocEntries } from "@docs/manifest";

const registryIds = new Map(identities.items
  .filter(item => item.type === "registry" && item.status === "active")
  .map(item => [item.key, item.id]));
// These foundation pages document installable items under an editorial slug.
const foundationRegistryNames = new Map([
  ["motion", "springs"], ["scrollbars", "scroll-area"], ["surfaces", "elevated"],
]);
const componentDocs = navigationDocEntries.filter(entry => entry.collection === "components");
const artifactDocs = new Map(navigationDocEntries
  .filter(entry => entry.collection === "blocks" || entry.collection === "pages")
  .map(entry => [entry.slug, entry]));
const dependencies = new Map<string, ReadonlySet<string>>(blockCatalog.map(block => [block.name, new Set<string>(block.dependencies)]));

export function designContractPath(registryName: string) {
  const id = registryIds.get(registryName);
  return id ? `/ai/items/${encodeURIComponent(id)}.md` : null;
}

export function componentsForBlock(registryName: string) {
  const used = dependencies.get(registryName);
  return componentDocs.filter(entry => used?.has(entry.registryItem?.name ?? foundationRegistryNames.get(entry.slug) ?? entry.slug));
}

export function blocksForComponent(registryName: string) {
  return artifactCatalog.filter(artifact => dependencies.get(artifact.registryName)?.has(registryName)).slice(0, 4);
}

export function artifactCopy(artifact: ArtifactEntry, english: boolean) {
  const doc = english ? artifactDocs.get(artifact.slug) : undefined;
  return { title: doc?.name ?? artifact.title, description: doc?.description ?? artifact.description };
}
