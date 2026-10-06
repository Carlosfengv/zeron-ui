"use client";
import { useState } from "react";
import { RuleFlowEditor, defaultRuleFlow, type RuleFlowValue } from "@zeron/blocks/rule-flow-editor-01";

/** Same controlled example in documentation and standalone previews. */
export function RuleFlowEditorDemo() {
  const [flow, setFlow] = useState<RuleFlowValue>(defaultRuleFlow);
  return <RuleFlowEditor value={flow} onValueChange={setFlow} />;
}
