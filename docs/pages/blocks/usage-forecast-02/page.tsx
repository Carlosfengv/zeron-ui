import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { UsageBudgetForecastBlockDocClient } from "./UsageBudgetForecastBlockDocClient";

export default function UsageBudgetForecastBlockDoc() {
  return <UsageBudgetForecastBlockDocClient code={getBlockPreviewSource("usage-forecast-02")} />;
}
