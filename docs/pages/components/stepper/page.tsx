"use client";

import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { Switch } from "@zeron/ui/switch";
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
import {
  PLAY_SWITCH,
  PlayField,
  PlaygroundLayout,
  PlaygroundPanel,
  PlaySelect,
} from "@docs/components/playground/playground";
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
} from "@zeron/ui/stepper";
import { Button } from "@zeron/ui/button";

<Stepper defaultValue="account" className="w-[400px] max-w-full">
  <StepperList>
    <StepperItem value="account">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Account</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="profile">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Profile</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="review">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Review</StepperTitle>
      </StepperTrigger>
    </StepperItem>
  </StepperList>

  <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
    <StepperContent value="account">Create your account and choose sign-in credentials.</StepperContent>
    <StepperContent value="profile">Add the profile information teammates will see.</StepperContent>
    <StepperContent value="review">Review the details before creating your workspace.</StepperContent>
  </div>

  <div className="flex items-center justify-between">
    <StepperPrev render={<Button variant="tertiary" size="sm" />}>Previous</StepperPrev>
    <StepperNext render={<Button size="sm" />}>Next</StepperNext>
  </div>
</Stepper>`;

const verticalCode = `import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";

<Stepper defaultValue="details" orientation="vertical" className="w-[400px] max-w-full gap-6">
  <StepperList>
    <StepperItem value="details">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Details</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="members">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Members</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="finish">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Finish</StepperTitle>
      </StepperTrigger>
    </StepperItem>
  </StepperList>

  <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
    <StepperContent value="details">Set the workspace name and visibility.</StepperContent>
    <StepperContent value="members">Invite the people who should have access.</StepperContent>
    <StepperContent value="finish">Confirm the workspace configuration.</StepperContent>
  </div>
</Stepper>`;

const validationCode = `import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperNext,
  StepperPrev,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";

function ProjectStepper() {
  const [value, setValue] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [validationError, setValidationError] = useState(false);

  return (
    <Stepper
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        setValidationError(false);
      }}
      onValidate={async (_nextValue, direction) => {
        if (direction === "prev" || value !== "project") return true;
        const valid = projectName.trim().length > 0;
        setValidationError(!valid);
        return valid;
      }}
      className="w-[400px] max-w-full"
    >
      <StepperList>
        <StepperItem value="project">
          <StepperTrigger className="gap-2">
            <StepperIndicator />
            <StepperTitle>Project</StepperTitle>
          </StepperTrigger>
        </StepperItem>
        <StepperItem value="confirm">
          <StepperTrigger className="gap-2">
            <StepperIndicator />
            <StepperTitle>Confirm</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </StepperList>

      <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
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
  );
}`;

const statesCode = `import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";

<Stepper defaultValue="shipping" nonInteractive className="w-[400px] max-w-full">
  <StepperList>
    <StepperItem value="account" completed>
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Account</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="shipping">
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Shipping</StepperTitle>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="payment" disabled>
      <StepperTrigger className="gap-2">
        <StepperIndicator />
        <StepperTitle>Payment</StepperTitle>
      </StepperTrigger>
    </StepperItem>
  </StepperList>
</Stepper>`;

const STEPS = [
  { value: "account", title: "Account" },
  { value: "profile", title: "Profile" },
  { value: "review", title: "Review" },
] as const;

const VERTICAL_STEPS = [
  { value: "details", title: "Details" },
  { value: "members", title: "Members" },
  { value: "finish", title: "Finish" },
] as const;

const DESCRIPTION_STEPS = [
  { value: "account", title: "Account", description: "Sign-in details" },
  { value: "profile", title: "Profile", description: "Personal information" },
  { value: "review", title: "Review", description: "Confirm and submit" },
] as const;

const descriptionCode = `import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperList,
  StepperTitle,
  StepperTrigger,
} from "@zeron/ui/stepper";

<Stepper defaultValue="account" className="w-[400px] max-w-full">
  <StepperList>
    <StepperItem value="account" className="min-w-0 flex-1">
      <StepperTrigger className="w-full min-w-0 gap-2">
        <StepperIndicator />
        <span className="flex min-w-0 flex-1 flex-col">
          <StepperTitle className="truncate">Account</StepperTitle>
          <StepperDescription className="truncate">Sign-in details</StepperDescription>
        </span>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="profile" className="min-w-0 flex-1">
      <StepperTrigger className="w-full min-w-0 gap-2">
        <StepperIndicator />
        <span className="flex min-w-0 flex-1 flex-col">
          <StepperTitle className="truncate">Profile</StepperTitle>
          <StepperDescription className="truncate">Personal information</StepperDescription>
        </span>
      </StepperTrigger>
    </StepperItem>
    <StepperItem value="review" className="min-w-0 flex-1">
      <StepperTrigger className="w-full min-w-0 gap-2">
        <StepperIndicator />
        <span className="flex min-w-0 flex-1 flex-col">
          <StepperTitle className="truncate">Review</StepperTitle>
          <StepperDescription className="truncate">Confirm and submit</StepperDescription>
        </span>
      </StepperTrigger>
    </StepperItem>
  </StepperList>
</Stepper>`;

function StepTrack({
  steps,
  disabledValue,
}: {
  steps: readonly { value: string; title: string }[];
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
          <StepperTrigger className="gap-2">
            <StepperIndicator />
            <StepperTitle>{step.title}</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      ))}
    </StepperList>
  );
}

function DescriptionTrack() {
  return (
    <StepperList>
      {DESCRIPTION_STEPS.map((step) => (
        <StepperItem key={step.value} value={step.value} className="min-w-0 flex-1">
          <StepperTrigger className="w-full min-w-0 gap-2">
            <StepperIndicator />
            <span className="flex min-w-0 flex-1 flex-col">
              <StepperTitle className="truncate">{step.title}</StepperTitle>
              <StepperDescription className="truncate">{step.description}</StepperDescription>
            </span>
          </StepperTrigger>
        </StepperItem>
      ))}
    </StepperList>
  );
}

function StepperPlayground() {
  const t = useTranslations("playground");
  const [variant, setVariant] = useState<"horizontal" | "vertical" | "progress">("horizontal");
  const [showDescription, setShowDescription] = useState(false);
  const descriptionsEnabled = variant === "horizontal" && showDescription;

  const reset = () => {
    const variants = ["horizontal", "vertical", "progress"] as const;
    const nextVariant = variants[Math.floor(Math.random() * variants.length)]!;
    setVariant(nextVariant);
    setShowDescription(nextVariant === "horizontal" && Math.random() > 0.5);
  };

  const preview = descriptionsEnabled ? (
    <Stepper defaultValue="account" className="w-[400px] max-w-full"><DescriptionTrack /></Stepper>
  ) : variant === "horizontal" ? (
    <Stepper defaultValue="account" className="w-[400px] max-w-full"><StepTrack steps={STEPS} /><div className="rounded-xl border border-border-subtle bg-muted/30 p-4"><StepperContent value="account">Create your account and choose sign-in credentials.</StepperContent><StepperContent value="profile">Add the profile information teammates will see.</StepperContent><StepperContent value="review">Review the details before creating your workspace.</StepperContent></div><div className="flex items-center justify-between"><StepperPrev render={<Button variant="tertiary" size="sm" />}>Previous</StepperPrev><StepperNext render={<Button size="sm" />}>Next</StepperNext></div></Stepper>
  ) : variant === "vertical" ? (
    <Stepper defaultValue="details" orientation="vertical" className="w-[400px] max-w-full gap-6"><StepTrack steps={VERTICAL_STEPS} /><div className="rounded-xl border border-border-subtle bg-muted/30 p-4"><StepperContent value="details">Set the workspace name and visibility.</StepperContent><StepperContent value="members">Invite the people who should have access.</StepperContent><StepperContent value="finish">Confirm the workspace configuration.</StepperContent></div></Stepper>
  ) : (
    <Stepper defaultValue="shipping" nonInteractive className="w-[400px] max-w-full"><StepperList><StepperItem value="account" completed><StepperTrigger className="gap-2"><StepperIndicator /><StepperTitle>Account</StepperTitle></StepperTrigger></StepperItem><StepperItem value="shipping"><StepperTrigger className="gap-2"><StepperIndicator /><StepperTitle>Shipping</StepperTitle></StepperTrigger></StepperItem><StepperItem value="payment" disabled><StepperTrigger className="gap-2"><StepperIndicator /><StepperTitle>Payment</StepperTitle></StepperTrigger></StepperItem></StepperList></Stepper>
  );

  return (
    <PlaygroundLayout
      controls={
        <PlaygroundPanel onShuffle={reset}>
          <PlayField label={t("variant")}>
            <PlaySelect
              value={variant}
              onChange={(value) => {
                setVariant(value as typeof variant);
                if (value !== "horizontal") setShowDescription(false);
              }}
              options={[
                { value: "horizontal", label: "Horizontal" },
                { value: "vertical", label: "Vertical" },
                { value: "progress", label: "Progress" },
              ]}
            />
          </PlayField>
          <Switch
            label="StepperDescription"
            checked={showDescription}
            onCheckedChange={setShowDescription}
            disabled={variant !== "horizontal"}
            className={PLAY_SWITCH}
          />
        </PlaygroundPanel>
      }
      preview={
        <ComponentPreview
          code={descriptionsEnabled ? descriptionCode : variant === "horizontal" ? basicCode : variant === "vertical" ? verticalCode : statesCode}
          minHeightClass="min-h-[260px]"
        >
          {preview}
        </ComponentPreview>
      }
    />
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
  const [validationValue, setValidationValue] = useState("project");
  const [projectName, setProjectName] = useState("");
  const [validationError, setValidationError] = useState(false);

  return (
    <DocPage
      title="Stepper"
      slug="stepper"
      description="Accessible multi-step navigation with horizontal and vertical layouts, keyboard controls, completion states, and async validation."
    >
      <DocSection title="Playground">
        <StepperPlayground />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Stepper defaultValue="account" className="w-[400px] max-w-full">
            <StepTrack steps={STEPS} />

            <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
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
            defaultValue="details"
            orientation="vertical"
            className="w-[400px] max-w-full gap-6"
          >
            <StepTrack steps={VERTICAL_STEPS} />
            <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
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
            className="w-[400px] max-w-full"
          >
            <StepTrack
              steps={[
                { value: "project", title: "Project" },
                { value: "confirm", title: "Confirm" },
              ]}
            />
            <div className="rounded-xl border border-border-subtle bg-muted/30 p-4">
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
          <Stepper defaultValue="shipping" className="w-[400px] max-w-full" nonInteractive>
            <StepperList>
              <StepperItem value="account" completed>
                <StepperTrigger className="gap-2">
                  <StepperIndicator />
                  <StepperTitle>Account</StepperTitle>
                </StepperTrigger>
              </StepperItem>
              <StepperItem value="shipping">
                <StepperTrigger className="gap-2">
                  <StepperIndicator />
                  <StepperTitle>Shipping</StepperTitle>
                </StepperTrigger>
              </StepperItem>
              <StepperItem value="payment" disabled>
                <StepperTrigger className="gap-2">
                  <StepperIndicator />
                  <StepperTitle>Payment</StepperTitle>
                </StepperTrigger>
              </StepperItem>
            </StepperList>
          </Stepper>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("descriptions")}>
        <ComponentPreview code={descriptionCode}>
          <Stepper defaultValue="account" className="w-[400px] max-w-full">
            <DescriptionTrack />
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
