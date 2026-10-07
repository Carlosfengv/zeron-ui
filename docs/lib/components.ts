import type { IconName } from "@zeron/icons/context";
import { navigationDocEntries, type DocEntry } from "@docs/manifest";

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

const functionalComponentSections = [
  "navigation",
  "input",
  "action",
  "data-display",
  "charts",
  "feedback",
  "overlay",
] as const;

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

export const systemList: SystemEntry[] = navigationDocEntries.filter((entry) => entry.section === "foundations").map(toEntry);
export const componentList: ComponentEntry[] = navigationDocEntries.filter((entry) => functionalComponentSections.includes(entry.section as (typeof functionalComponentSections)[number])).map(toEntry);
export const layoutList: LayoutEntry[] = navigationDocEntries.filter((entry) => entry.section === "layout").map(toEntry);
export const aiAgentList: ComponentEntry[] = navigationDocEntries.filter((entry) => entry.section === "ai-agent").map(toEntry);
export const legacyDocSlugs = ["tabs-subtle"] as const;
export const allComponentList: ComponentEntry[] = [...componentList, ...aiAgentList];
export const docOrder = navigationDocEntries.map((entry) => ({ slug: entry.slug, name: entry.name }));

export function componentPathname(slug: string) {
  return `/docs/components/${slug}`;
}
