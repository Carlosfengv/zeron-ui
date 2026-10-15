import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { UsageForecastBlockDocClient } from "./UsageForecastBlockDocClient";

export default function UsageForecastBlockDoc() {
  return <UsageForecastBlockDocClient code={getBlockPreviewSource("usage-forecast-01")} />;
}
