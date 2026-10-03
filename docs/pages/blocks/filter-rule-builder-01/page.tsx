import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { FilterRuleBuilderBlockDocClient } from "./FilterRuleBuilderBlockDocClient";

export default function FilterRuleBuilderBlockDoc() {
  return <FilterRuleBuilderBlockDocClient code={getBlockPreviewSource("filter-rule-builder-01")} />;
}
