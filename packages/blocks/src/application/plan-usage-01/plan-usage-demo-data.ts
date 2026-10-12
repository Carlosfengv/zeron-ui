import type { PlanUsageData } from "./plan-usage-types";

export const planUsageDemoData: PlanUsageData = {
  currency: "USD",
  currentPlanId: "pro",
  renewalDate: "2026-10-28",
  plans: [
    { id: "free", name: "Free", monthlyPrice: 0, description: "Try agents on small projects.",
      features: ["500 credits a month", "Standard models", "1 agent at a time"] },
    { id: "pro", name: "Pro", monthlyPrice: 20, description: "For daily work with agents.",
      features: ["4,000 credits a month", "Premium models, including Nova 3", "Up to 8 agents in parallel", "Cloud agents"] },
    { id: "max", name: "Max", monthlyPrice: 40, description: "For long runs and big codebases.",
      features: ["12,000 credits a month", "Premium models, including Nova 3", "Up to 16 agents in parallel", "Cloud agents", "Runs up to 4 hours long", "Early access to new models"] },
  ],
  cycle: {
    startDate: "2026-09-28", endDate: "2026-10-28", includedCredits: 4000, daysUntilReset: 20,
    models: [
      { id: "nova-3", name: "Nova 3", credits: 980, colorIndex: 1 },
      { id: "atlas-2", name: "Atlas 2", credits: 420, colorIndex: 4 },
      { id: "nova-3-mini", name: "Nova 3 Mini", credits: 230, colorIndex: 3 },
      { id: "embeddings", name: "Embeddings", credits: 75, colorIndex: 5 },
    ],
    dailyUsage: Array.from({ length: 30 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 8, 28 + index)).toISOString().slice(0, 10),
      credits: [205, 250, 185, 120, 95, 230, 150, 130, 140, 140, 60][index] ?? 133,
      kind: index < 10 ? "actual" : index === 10 ? "today" : "projected",
    })),
    projection: { credits: 4459, depletionDate: "2026-10-24", daysBeforeReset: 4 },
    dailyAllowance: 133,
  },
  limits: { alertPercent: 80, extraUsageEnabled: false, extraUsagePricePer100Credits: 1 },
  payment: { brand: "Visa", last4: "4242", expires: "11/2028", holder: "Mia Chen" },
  invoices: Array.from({ length: 8 }, (_, index) => {
    const month = 9 - index;
    const date = new Date(Date.UTC(2026, month - 1, 28));
    const nextDate = new Date(Date.UTC(2026, month, 28));
    const format = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return {
      id: `HX-2026-${String(9 - index).padStart(4, "0")}`,
      date: date.toISOString().slice(0, 10),
      description: `Pro, ${format.format(date)} – ${format.format(nextDate)}${index === 1 ? ", and extra usage" : ""}`,
      amount: index === 1 ? 26.4 : 20,
      status: index === 3 ? "refunded" : "paid",
    };
  }),
};
