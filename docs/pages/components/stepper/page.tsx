"use client";

import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";

const basicCode = `import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  StepperTitle,
  StepperTrigger,
} from "./components";

<Stepper defaultValue="account">
  <StepperList>
    <StepperItem value="account">
      <StepperTrigger>
        <StepperIndicator />
        <StepperTitle>Account</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="profile">
      <StepperTrigger>
        <StepperIndicator />
        <StepperTitle>Profile</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="review">
      <StepperTrigger>
        <StepperIndicator />
        <StepperTitle>Review</StepperTitle>
      </StepperTrigger>
    </StepperItem>
  </StepperList>

  <StepperContent value="account">Create your account.</StepperContent>
  <StepperContent value="profile">Complete your profile.</StepperContent>
  <StepperContent value="review">Review and submit.</StepperContent>

  <div className="flex justify-between">
    <StepperPrev>Previous</StepperPrev>
    <StepperNext>Next</StepperNext>
  </div>
</Stepper>`;

const verticalCode = `<Stepper defaultValue="details" orientation="vertical">
  <StepperList>
    {/* StepperItem compositions */}
  </StepperList>
  <StepperContent value="details">Project details</StepperContent>
</Stepper>`;

const validationCode = `const [name, setName] = useState("");

<Stepper
  defaultValue="project"
  onValidate={async (_nextValue, direction) => {
    if (direction === "prev") return true;
    return name.trim().length > 0;
  }}
>
  {/* Steps and content */}
  <StepperContent value="project">
    <Input value={name} onChange={(event) => setName(event.target.value)} />
  </StepperContent>
  <StepperNext>Continue</StepperNext>
</Stepper>`;

const statesCode = `<Stepper defaultValue="shipping" nonInteractive>
  <StepperList>
    <StepperItem value="account" completed>{/* ... */}</StepperItem>
    <StepperItem value="shipping">{/* ... */}</StepperItem>
    <StepperItem value="payment" disabled>{/* ... */}</StepperItem>
  </StepperList>
</Stepper>`;

const STEPS = [
  { value: "account", title: "Account", description: "Sign-in details" },
  { value: "profile", title: "Profile", description: "Personal information" },
  { value: "review", title: "Review", description: "Confirm and submit" },
] as const;

const VERTICAL_STEPS = [
  { value: "details", title: "Details", description: "Name and visibility" },
  { value: "members", title: "Members", description: "Invite collaborators" },
  { value: "finish", title: "Finish", description: "Review workspace" },
] as const;

function StepTrack({
  steps,
  disabledValue,
}: {
  steps: readonly { value: string; title: string; description: string }[];
  disabledValue?: string;
}) {
  return (
    <StepperList>
      {steps.map((step) => (
        <StepperItem
          key={step.value}
          value={step.value}
          disabled={step.value === disabledValue}
        >
          <StepperTrigger>
            <StepperIndicator />
            <span className="flex min-w-0 flex-col">
              <StepperTitle>{step.title}</StepperTitle>
              <StepperDescription>{step.description}</StepperDescription>
            </span>
          </StepperTrigger>
        </StepperItem>
      ))}
    </StepperList>
  );
}

const stepperProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled active step value." },
  { name: "defaultValue", type: "string", description: "Initial step for uncontrolled usage." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called when the active step changes." },
  { name: "onValidate", type: "(value, direction) => boolean | Promise<boolean>", description: "Validates navigation before changing the active step." },
  { name: "onValueComplete", type: "(value: string, completed: boolean) => void", description: "Called when an item's explicit completion state changes." },
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout and arrow-key navigation axis." },
  { name: "activationMode", type: '"automatic" | "manual"', default: '"automatic"', description: "Whether keyboard focus immediately activates a step." },
  { name: "dir", type: '"ltr" | "rtl"', description: "Text and horizontal navigation direction." },
  { name: "loop", type: "boolean", default: "false", description: "Loops keyboard focus from the last step to the first." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables every step trigger." },
  { name: "nonInteractive", type: "boolean", default: "false", description: "Displays progress without allowing direct step selection." },
];

const itemProps: PropDef[] = [
  { name: "value", type: "string", description: "Unique value identifying the step." },
  { name: "completed", type: "boolean", default: "false", description: "Explicitly marks the step as completed." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables this step." },
];

const contentProps: PropDef[] = [
  { name: "value", type: "string", description: "Step value whose active state displays this panel." },
  { name: "forceMount", type: "boolean", default: "false", description: "Keeps the panel mounted while inactive." },
];

const indicatorProps: PropDef[] = [
  { name: "children", type: "ReactNode | (state: DataState) => ReactNode", description: "Custom indicator content; defaults to the position or a completion check." },
];

export default function StepperDoc() {
  const t = useTranslations("stepper");
  const localize = (props: PropDef[], prefix: string) => props.map((prop, index) => ({ ...prop, description: t(`${prefix}${index}`) }));
  const [basicValue, setBasicValue] = useState("account");
  const [verticalValue, setVerticalValue] = useState("details");
  const [validationValue, setValidationValue] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [validationError, setValidationError] = useState(false);

  return (
    <DocPage
      title="Stepper"
      slug="stepper"
      description="Accessible multi-step navigation with horizontal and vertical layouts, keyboard controls, completion states, and async validation."
    >
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Stepper value={basicValue} onValueChange={setBasicValue} className="max-w-2xl">
            <StepTrack steps={STEPS} />

            <div className="min-h-24 border border-border-subtle bg-muted/30 p-4 rounded-xl">
              <StepperContent value="account">Create your account and choose sign-in credentials.</StepperContent>
              <StepperContent value="profile">Add the profile information teammates will see.</StepperContent>
              <StepperContent value="review">Review the details before creating your workspace.</StepperContent>
            </div>

            <div className="flex items-center justify-between">
              <StepperPrev render={<Button variant="tertiary" size="sm" />}>Previous</StepperPrev>
              <StepperNext render={<Button size="sm" />}>Next</StepperNext>
            </div>
          </Stepper>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("vertical")}>
        <ComponentPreview code={verticalCode}>
          <Stepper
            value={verticalValue}
            onValueChange={setVerticalValue}
            orientation="vertical"
            className="w-full max-w-2xl gap-6"
          >
            <StepTrack steps={VERTICAL_STEPS} />
            <div className="min-h-44 flex-1 border border-border-subtle bg-muted/30 p-4 rounded-xl">
              <StepperContent value="details">Set the workspace name and visibility.</StepperContent>
              <StepperContent value="members">Invite the people who should have access.</StepperContent>
              <StepperContent value="finish">Confirm the workspace configuration.</StepperContent>
            </div>
          </Stepper>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("validation")}>
        <ComponentPreview code={validationCode}>
          <Stepper
            value={validationValue}
            onValueChange={(value) => {
              setValidationValue(value);
              setValidationError(false);
            }}
            onValidate={async (_nextValue, direction) => {
              if (direction === "prev" || validationValue !== "project") return true;
              const valid = projectName.trim().length > 0;
              setValidationError(!valid);
              return valid;
            }}
            className="w-full max-w-xl"
          >
            <StepTrack
              steps={[
                { value: "project", title: "Project", description: "Required details" },
                { value: "confirm", title: "Confirm", description: "Review changes" },
              ]}
            />
            <div className="min-h-28 border border-border-subtle bg-muted/30 p-4 rounded-xl">
              <StepperContent value="project">
                <div className="flex flex-col gap-1.5">
                  <Input
                    value={projectName}
                    onChange={(event) => {
                      setProjectName(event.target.value);
                      setValidationError(false);
                    }}
                    placeholder="Project name"
                    aria-label="Project name"
                    aria-invalid={validationError || undefined}
                    aria-describedby={validationError ? "stepper-project-error" : undefined}
                  />
                  {validationError && (
                    <p id="stepper-project-error" className="px-1 text-label text-fg-danger">
                      Enter a project name before continuing.
                    </p>
                  )}
                </div>
              </StepperContent>
              <StepperContent value="confirm">Everything is ready to submit.</StepperContent>
            </div>
            <div className="flex items-center justify-between">
              <StepperPrev render={<Button variant="tertiary" size="sm" />}>Previous</StepperPrev>
              <StepperNext render={<Button size="sm" />}>Continue</StepperNext>
            </div>
          </Stepper>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <ComponentPreview code={statesCode}>
          <Stepper defaultValue="shipping" nonInteractive className="max-w-2xl">
            <StepperList>
              <StepperItem value="account" completed>
                <StepperTrigger>
                  <StepperIndicator />
                  <StepperTitle>Account</StepperTitle>
                </StepperTrigger>
              </StepperItem>
              <StepperItem value="shipping">
                <StepperTrigger>
                  <StepperIndicator />
                  <StepperTitle>Shipping</StepperTitle>
                </StepperTrigger>
              </StepperItem>
              <StepperItem value="payment" disabled>
                <StepperTrigger>
                  <StepperIndicator />
                  <StepperTitle>Payment</StepperTitle>
                </StepperTrigger>
              </StepperItem>
            </StepperList>
          </Stepper>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">Stepper</h3>
            <PropsTable props={localize(stepperProps, "s")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">StepperItem</h3>
            <PropsTable props={localize(itemProps, "i")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">StepperContent</h3>
            <PropsTable props={localize(contentProps, "c")} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">StepperIndicator</h3>
            <PropsTable props={localize(indicatorProps, "n")} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
