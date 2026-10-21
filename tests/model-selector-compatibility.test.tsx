// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ModelSelector, modelSelectorEnLabels, modelSelectorZhLabels, type ModelSelectorProps } from "@zeron/ui/model-selector";
import * as modelBlock from "@zeron/blocks/model-selector-01";

describe("ModelSelector compatibility", () => {
  it("preserves model component, label and fixture exports", () => {
    expect(modelBlock.ModelSelector).toBe(ModelSelector);
    expect(modelBlock.modelSelectorEnLabels).toBe(modelSelectorEnLabels);
    expect(modelBlock.modelSelectorZhLabels).toBe(modelSelectorZhLabels);
    const props: modelBlock.ModelSelectorProps = { models: modelBlock.createModelSelectorDemoModels(), value: modelBlock.modelSelectorDemoValue, onValueChange: () => {} };
    const uiProps: ModelSelectorProps = props;
    expect(uiProps.value.modelId).toBe("sonnet-5.5");
  });
});
