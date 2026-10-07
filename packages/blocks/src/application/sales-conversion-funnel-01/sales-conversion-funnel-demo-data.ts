import type { FunnelSeries } from "@zeron/ui/funnel-chart";
import type { SalesFunnelStage } from "./sales-conversion-funnel";

// Brand colors follow the active theme, with distinct tints for each team.
export const salesFunnelDemoTeams: FunnelSeries[] = [
  { key: "team-1", label: "Team 1", color: "var(--brand)" },
  { key: "team-2", label: "Team 2", color: "color-mix(in oklch, var(--brand) 65%, var(--surface-floating))" },
  { key: "team-3", label: "Team 3", color: "color-mix(in oklch, var(--brand) 35%, var(--surface-floating))" },
];

export const salesFunnelDemoStages: SalesFunnelStage[] = [
  { id: "leads", label: "Leads", values: { "team-1": 500, "team-2": 500, "team-3": 500 } },
  { id: "contact", label: "Contact", values: { "team-1": 300, "team-2": 250, "team-3": 250 } },
  { id: "quotes", label: "Quotes", values: { "team-1": 80, "team-2": 60, "team-3": 60 } },
  { id: "deals", label: "Deals", values: { "team-1": 50, "team-2": 50, "team-3": 50 } },
];
