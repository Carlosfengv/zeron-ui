import { artifactCatalog, type ArtifactEntry } from "./artifacts";

/** Local pages have a live route, but no Registry installation artifact. */
export type StandalonePageEntry = Omit<ArtifactEntry, "registryName" | "installation"> & {
  href: string;
  installation?: never;
};

export const standalonePages: readonly StandalonePageEntry[] = [{
  slug: "workflow", href: "/workflow", title: "Workflow Editor",
  description: "A standalone automation canvas with editable nodes, branching, local drafts and path simulation.",
  kind: "page", collection: "pages", product: "shared",
  domains: ["automation", "workflow"], patterns: ["canvas", "node editor", "branching"],
  searchTerms: ["workflow", "react flow", "automation", "工作流", "自动化", "流程编排", "节点", "画布"],
  readiness: "demo-only", dataMode: "controlled", devices: ["desktop", "responsive"], featured: true,
}];

export const galleryArtifacts: readonly (ArtifactEntry | StandalonePageEntry)[] = [...artifactCatalog, ...standalonePages];
