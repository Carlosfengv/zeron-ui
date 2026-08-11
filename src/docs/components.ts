import { detailDocEntries, legacyDocEntries, pageDocEntries } from "@/docs/manifest";

export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

export type SystemEntry = Omit<ComponentEntry, "gridSize" | "dotColor">;

function toEntry(entry: (typeof pageDocEntries)[number]): ComponentEntry {
  return {
    slug: entry.id,
    name: entry.name,
    description: entry.description ?? "",
    isNew: entry.isNew,
    isUpdated: entry.isUpdated,
    dotColor: entry.dotColor,
    gridSize: entry.gridSize,
  };
}

export const systemList: SystemEntry[] = pageDocEntries
  .filter((entry) => entry.group === "system")
  .map(toEntry);
export const componentList: ComponentEntry[] = pageDocEntries
  .filter((entry) => entry.group === "components")
  .map(toEntry);
export const aiAgentList: ComponentEntry[] = pageDocEntries
  .filter((entry) => entry.group === "ai-agent")
  .map(toEntry);

export const legacyDocSlugs = legacyDocEntries.map((entry) => entry.id) as [string, ...string[]];
export const allComponentList: ComponentEntry[] = [...componentList, ...aiAgentList];
export const docOrder: Array<{ slug: string; name: string }> = detailDocEntries.map((entry) => ({
  slug: entry.id,
  name: entry.name,
}));
