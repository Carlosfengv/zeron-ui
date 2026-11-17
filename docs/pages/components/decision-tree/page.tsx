"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DecisionTree, type Decision, type DecisionTreeLabels } from "@zeron/ui/decision-tree";
import { Button } from "@zeron/ui/button";
import { useIcon } from "@zeron/icons/context";
import { useDocIcon } from "@docs/icons/doc-icons";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";

const example = `import { DecisionTree, type Decision } from "@/components/ui/decision-tree";

const decisions: Decision[] = [{
  id: "checkout-482",
  agent: "Incident agent",
  risk: "high",
  question: "How should we recover checkout after deploy #482?",
  options: [
    { label: "Roll back to #481", pick: true, next: {
      question: "Who should we notify?",
      options: [{ label: "Post a status update" }, { label: "Notify the team" }],
    } },
    { label: "Disable the new checkout", effects: [
      "Traffic moves to the previous checkout",
      { text: "30% of sessions are affected", note: "New checkout rollout is at 30%." },
    ] },
  ],
}];

export function Example() {
  return <DecisionTree decisions={decisions} onChoose={(_decision, choice) => {
    if ("other" in choice) return "I received your instruction.";
    console.log(choice.option.label, choice.then?.option.label);
  }} />;
}`;

export default function DecisionTreeDoc() {
  const t = useTranslations("decisionTree");
  const [version, setVersion] = useState(0);
  const [complete, setComplete] = useState(false);
  const labels: DecisionTreeLabels = {
    ...t.raw("labels"),
    waiting: (count) => t("waiting", { count }),
    position: (current, count) => t("position", { current, count }),
    optionCount: (count) => t("optionCount", { count }),
    picked: (option, question) => question ? t("pickedNext", { option, question }) : t("picked", { option }),
  };
  const Incident = useIcon("brain");
  const Sales = useIcon("users");
  const Restore = useIcon("rotate-ccw");
  const Fix = useIcon("pencil");
  const Flag = useDocIcon("doc-switch");
  const Status = useIcon("globe");
  const Team = useIcon("message-circle");
  const decisions: readonly Decision[] = (t.raw("decisions") as Decision[]).map((decision, index) => {
    const Agent = index === 0 ? Incident : Sales;
    return {
      ...decision,
      icon: <Agent />,
      options: decision.options.map((option, optionIndex) => {
        const Icon = index === 0 ? [Restore, Fix, Flag][optionIndex] : undefined;
        return { ...option, icon: Icon && <Icon />, next: option.next && { ...option.next, options: option.next.options.map((leaf, leafIndex) => {
          const Channel = index === 0 && optionIndex === 0 ? [Status, Team][leafIndex] : undefined;
          return { ...leaf, icon: Channel && <Channel /> };
        }) } };
      }),
    };
  });
  const propTypes = {
    decisions: "readonly Decision[]",
    onChoose: "(decision, choice) => string | void | Promise<string | void>",
    allowOther: "boolean",
    title: "string",
    labels: "Partial<DecisionTreeLabels>",
    ref: "Ref<DecisionTreeHandle>",
    className: "string",
  };

  return (
    <DocPage title="Decision Tree" slug="decision-tree" description={t("description")}>
      <DocSection title={t("preview")}>
        <ComponentPreview code={example} padding="compact" preservePreview coverSource>
          <div className="w-full min-w-0 px-2 py-4 sm:px-5 sm:py-6">
            <DecisionTree key={version} title={t("title")} labels={labels} decisions={decisions} onChoose={(_decision, choice) => {
              setComplete(true);
              if ("other" in choice) return t("reply");
            }} />
            {complete && <Button className="mt-4" variant="secondary" size="sm" onClick={() => { setComplete(false); setVersion((value) => value + 1); }}>{t("reset")}</Button>}
          </div>
        </ComponentPreview>
      </DocSection>
      <DocSection title={t("keyboard")}><p className="text-body text-fg-muted">{t("shortcuts")}</p></DocSection>
      <DocSection title={t("api")}>
        <PropsTable props={Object.entries(propTypes).map(([name, type]) => ({ name, type, description: t(`props.${name}`), default: name === "allowOther" ? "true" : name === "title" ? '"Decisions"' : undefined }))} />
      </DocSection>
    </DocPage>
  );
}
