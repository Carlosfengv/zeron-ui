import type { UsageBudgetForecastData, UsageBudgetMetric } from "./usage-budget-forecast-types";

const day = (date: number) => Date.UTC(2026, 8, date);
const history = (values: number[]) => values.map((value, index) => ({ timestamp: day(index + 1), value }));
const forecast = (values: number[], lower: number, upper: number) => values.map((value, index) => ({
  timestamp: day(index + 22), value,
  lower: value - (values.at(-1)! - lower) * index / (values.length - 1),
  upper: value + (upper - values.at(-1)!) * index / (values.length - 1),
}));

const metrics: UsageBudgetMetric[] = [
  { id: "api", label: "API calls", unit: "M", fractionDigits: 1, budget: 38, domain: [0, 50], ticks: [0, 10, 20, 30, 40, 50],
    history: history([0, 1.7, 3.4, 5.2, 6.7, 7.4, 8.2, 10, 11.6, 13.3, 15, 16.5, 17.2, 19, 20.8, 22.6, 24.4, 26.2, 27.3, 28.6, 30.4, 32.3]),
    forecast: forecast([32.3, 33.7, 35.2, 36.6, 38, 39.2, 41.1, 43.1, 45.2], 43.3, 47.9),
    overage: { amount: 1449, currency: "USD", rate: 0.2, per: 1000 } },
  { id: "storage", label: "Storage", unit: "TB", fractionDigits: 2, budget: 4, domain: [2, 4.5], ticks: [2, 2.5, 3, 3.5, 4, 4.5],
    history: history([3.12, 3.16, 3.2, 3.24, 3.25, 3.26, 3.3, 3.34, 3.38, 3.26, 3.29, 3.3, 3.31, 3.35, 3.39, 3.42, 3.47, 3.49, 3.5, 3.51, 3.54, 3.57]),
    forecast: forecast([3.57, 3.61, 3.65, 3.68, 3.69, 3.7, 3.73, 3.77, 3.81], 3.65, 4.04),
    overage: { amount: 0, currency: "USD", rate: 120, per: 1 } },
  { id: "seats", label: "Seats", unit: "seats", fractionDigits: 0, budget: 200, domain: [140, 240], ticks: [140, 160, 180, 200, 220, 240],
    history: history([186, 186, 187, 189, 190, 190, 191, 193, 194, 195, 195, 195, 196, 197, 198, 199, 200, 202, 202, 202, 203, 205]),
    forecast: forecast([205, 206, 207, 208, 208, 208, 209, 211, 212], 208, 218),
    overage: { amount: 292, currency: "USD", rate: 24, per: 1 } },
];

/** Fixed September scenario. Quotes retain screenshot values rather than deriving from rounded estimates. */
export const usageBudgetForecastDemoData: UsageBudgetForecastData = {
  organization: "Northwind Labs", plan: "Scale plan", periodStart: day(1), periodEnd: day(30), renewsAt: Date.UTC(2026, 9, 1), now: day(22), metrics,
};
