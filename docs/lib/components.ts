import type { IconName } from "@zeron/icons/context";
import { docEntries, type DocEntry } from "@docs/manifest";

export interface ComponentEntry {
  slug: string;
  name: string;
  icon: IconName;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

export type SystemEntry = Omit<ComponentEntry, "gridSize" | "dotColor">;
export type LayoutEntry = Omit<ComponentEntry, "gridSize" | "dotColor">;

function toEntry(entry: DocEntry): ComponentEntry {
  return {
    slug: entry.slug,
    name: entry.name,
    icon: entry.icon,
    description: entry.description ?? "",
    isNew: entry.isNew,
    isUpdated: entry.isUpdated,
    dotColor: entry.dotColor,
    gridSize: entry.gridSize,
  };
}

export const systemList: SystemEntry[] = docEntries.filter((entry) => entry.section === "foundations").map(toEntry);
export const componentList: ComponentEntry[] = docEntries.filter((entry) => entry.section === "components").map(toEntry);
export const layoutList: LayoutEntry[] = docEntries.filter((entry) => entry.section === "layout").map(toEntry);
export const aiAgentList: ComponentEntry[] = docEntries.filter((entry) => entry.section === "ai-agent").map(toEntry);
export const legacyDocSlugs = ["tabs-subtle"] as const;
export const allComponentList: ComponentEntry[] = [...componentList, ...aiAgentList];
export const docOrder = docEntries.map((entry) => ({ slug: entry.slug, name: entry.name }));

export function componentPathname(slug: string) {
  return `/docs/components/${slug}`;
}
