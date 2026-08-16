"use client";

import {
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FormEvent,
} from "react";
import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@zeron/ui/alert";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  Container,
  ContainerBody,
  ContainerFooter,
  ContainerHeader,
} from "@zeron/ui/container";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Fieldset,
  FieldsetLegend,
} from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
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
import { Switch } from "@zeron/ui/switch";
import { Textarea } from "@zeron/ui/textarea";
import { toast } from "@zeron/ui/toast";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

export type ProviderKind = "openai" | "anthropic" | "deepseek";

export interface ProviderModelOption {
  id: string;
  name: string;
  description?: string;
  tags?: readonly string[];
}

export interface ProviderModel extends ProviderModelOption {
  enabled: boolean;
}

export interface ProviderFormValues {
  name: string;
  description: string;
  kind: ProviderKind;
  apiKey: string;
  models: ProviderModel[];
}

export interface ProviderOption {
  value: ProviderKind;
  label: string;
  icon?: string;
}

function ProviderBrandIcon({ className, provider, size = 20 }: { className?: string; provider: ProviderKind; size?: number }) {
  const Icon = provider === "openai" ? OpenAIMono : provider === "anthropic" ? AnthropicMono : DeepSeekColor;
  return <Icon aria-hidden className={className} size={size} />;
}

function ProviderModelIcon({ model, size = 20 }: { model: string; size?: number }) {
  const normalizedModel = model.toLowerCase();
  const Icon = normalizedModel.includes("claude")
    ? AnthropicMono
    : normalizedModel.includes("deepseek")
      ? DeepSeekColor
      : OpenAIMono;
  return <Icon aria-hidden size={size} />;
}

export interface ProviderConnectionResult {
  status: "success" | "error";
  title: string;
  description?: string;
  models?: readonly ProviderModelOption[];
}

type FormStep = "basic" | "connection" | "review";
type FormErrorKey = "name" | "kind" | "apiKey" | "verification" | "models";
type FormErrors = Partial<Record<FormErrorKey, string>>;

export interface ProviderCreateFormLabels {
  title: string;
  description: string;
  steps: readonly { value: FormStep; title: string }[];
  stepCount: (current: number, total: number) => string;
  basicTitle: string;
  basicDescription: string;
  connectionTitle: string;
  connectionDescription: string;
  reviewTitle: string;
  reviewDescription: string;
  name: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHelp: string;
  descriptionCount: (count: number, max: number) => string;
  provider: string;
  providerPlaceholder: string;
  apiKey: string;
  apiKeyPlaceholder: string;
  apiKeyDescription: string;
  showSecret: string;
  hideSecret: string;
  verifyAndFetch: string;
  verifyingAndFetching: string;
  verificationSuccessTitle: string;
  verificationSuccessDescription: (count: number) => string;
  verificationErrorTitle: string;
  verificationErrorDescription: string;
  modelsTitle: string;
  modelsDescription: string;
  modelToggle: (name: string) => string;
  reviewName: string;
  reviewModelCount: string;
  reviewModelCountValue: (count: number) => string;
  reviewModels: string;
  cancel: string;
  previous: string;
  continue: string;
  create: string;
  creating: string;
  created: string;
  errors: {
    name: string;
    kind: string;
    apiKey: string;
    verification: string;
    models: string;
    submit: string;
  };
}

export interface ProviderCreateFormProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children" | "onSubmit"> {
  defaultValues?: Partial<ProviderFormValues>;
  providerOptions?: readonly ProviderOption[];
  labels?: Partial<Omit<ProviderCreateFormLabels, "errors">> & {
    errors?: Partial<ProviderCreateFormLabels["errors"]>;
  };
  onCancel?: () => void;
  onVerifyAndFetchModels?: (
    values: ProviderFormValues
  ) => Promise<ProviderConnectionResult>;
  onSubmit?: (values: ProviderFormValues) => Promise<void> | void;
}

const descriptionMaxLength = 240;

export const defaultProviderOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
] as const satisfies readonly ProviderOption[];

export const defaultProviderFormValues: ProviderFormValues = {
  name: "DeepSeek Production",
  description: "用于生产环境的模型推理服务。",
  kind: "deepseek",
  apiKey: "sk-production-demo",
  models: [],
};

const defaultModelsByProvider: Record<ProviderKind, readonly ProviderModelOption[]> = {
  openai: [
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      description: "通用高质量模型",
      tags: ["多模态", "工具调用", "1M 上下文"],
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 mini",
      description: "更低延迟与成本",
      tags: ["多模态", "工具调用", "1M 上下文"],
    },
    {
      id: "o4-mini",
      name: "o4-mini",
      description: "轻量推理模型",
      tags: ["推理", "工具调用", "200K 上下文"],
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet",
      name: "Claude Sonnet",
      description: "平衡能力与响应速度",
      tags: ["多模态", "工具调用", "200K 上下文"],
    },
    {
      id: "claude-haiku",
      name: "Claude Haiku",
      description: "快速轻量模型",
      tags: ["多模态", "工具调用", "200K 上下文"],
    },
  ],
  deepseek: [
    {
      id: "deepseek-chat",
      name: "DeepSeek Chat",
      description: "通用对话与生成",
      tags: ["工具调用", "64K 上下文"],
    },
    {
      id: "deepseek-reasoner",
      name: "DeepSeek Reasoner",
      description: "复杂推理任务",
      tags: ["推理", "64K 上下文"],
    },
  ],
};

const defaultLabels: ProviderCreateFormLabels = {
  title: "添加模型服务商",
  description: "配置服务商信息，验证访问凭证，并选择要提供给用户的模型。",
  steps: [
    { value: "basic", title: "基本信息" },
    { value: "connection", title: "厂商与模型" },
    { value: "review", title: "确认添加" },
  ],
  stepCount: (current, total) => `${current} / ${total}`,
  basicTitle: "填写基本信息",
  basicDescription: "名称和描述会显示在服务商列表与模型调用记录中。",
  connectionTitle: "连接模型厂商",
  connectionDescription: "选择厂商并验证 API Key，验证成功后会获取当前凭证可用的模型。",
  reviewTitle: "确认提供的模型",
  reviewDescription: "检查服务商名称与已开启模型，确认后即可添加。",
  name: "模型服务商名称",
  namePlaceholder: "例如 DeepSeek Production",
  descriptionLabel: "描述",
  descriptionPlaceholder: "说明使用环境、负责团队或用途",
  descriptionHelp: "帮助团队识别这个服务商的用途。",
  descriptionCount: (count, max) => `${count} / ${max}`,
  provider: "模型厂商",
  providerPlaceholder: "选择模型厂商",
  apiKey: "API Key",
  apiKeyPlaceholder: "输入厂商 API Key",
  apiKeyDescription: "密钥仅用于服务端验证，保存后不会再次完整显示。",
  showSecret: "显示",
  hideSecret: "隐藏",
  verifyAndFetch: "验证并获取模型",
  verifyingAndFetching: "正在验证并获取",
  verificationSuccessTitle: "验证成功",
  verificationSuccessDescription: (count) => `已获取 ${count} 个可用模型。`,
  verificationErrorTitle: "验证失败",
  verificationErrorDescription: "请检查模型厂商与 API Key 后重试。",
  modelsTitle: "可用模型",
  modelsDescription: "关闭不希望对用户提供的模型；至少需要开启一个模型。",
  modelToggle: (name) => `提供 ${name}`,
  reviewName: "模型服务商名称",
  reviewModelCount: "提供模型",
  reviewModelCountValue: (count) => `${count} 个`,
  reviewModels: "已开启模型",
  cancel: "取消",
  previous: "上一步",
  continue: "继续",
  create: "添加服务商",
  creating: "正在添加",
  created: "模型服务商已添加",
  errors: {
    name: "请输入模型服务商名称。",
    kind: "请选择模型厂商。",
    apiKey: "API Key 至少需要 8 个字符。",
    verification: "请先验证 API Key 并获取可用模型。",
    models: "请至少开启一个模型。",
    submit: "添加失败，请检查配置后重试。",
  },
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function defaultVerifyAndFetchModels(
  values: ProviderFormValues,
  labels: ProviderCreateFormLabels
): Promise<ProviderConnectionResult> {
  await delay(650);
  if (values.apiKey.toLowerCase().includes("fail")) {
    return {
      status: "error",
      title: labels.verificationErrorTitle,
      description: labels.verificationErrorDescription,
    };
  }

  const models = defaultModelsByProvider[values.kind];
  return {
    status: "success",
    title: labels.verificationSuccessTitle,
    description: labels.verificationSuccessDescription(models.length),
    models,
  };
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="max-w-2xl">
      <h2 className="text-title font-semibold text-fg-default">{title}</h2>
      <p className="mt-1 text-body text-fg-muted">{description}</p>
    </header>
  );
}

function createProviderIcon(provider: string): IconComponent {
  function ProviderOptionIcon({ className, size = 16 }: { className?: string; size?: number }) {
    return <ProviderBrandIcon className={className} provider={provider as ProviderKind} size={size} />;
  }

  ProviderOptionIcon.displayName = `ProviderBrandIcon(${provider})`;
  return ProviderOptionIcon;
}

function StepTrack({ labels }: { labels: ProviderCreateFormLabels }) {
  return (
    <StepperList className="w-fit max-w-full flex-wrap justify-start gap-1">
      {labels.steps.map((step) => (
        <StepperItem className="w-fit shrink-0 p-1.5" key={step.value} value={step.value}>
          <StepperTrigger className="w-auto justify-start gap-2">
            <StepperIndicator />
            <StepperTitle className="whitespace-nowrap text-label sm:text-body">
              {step.title}
            </StepperTitle>
          </StepperTrigger>
        </StepperItem>
      ))}
    </StepperList>
  );
}

function mergeLabels(labels?: ProviderCreateFormProps["labels"]): ProviderCreateFormLabels {
  return {
    ...defaultLabels,
    ...labels,
    errors: { ...defaultLabels.errors, ...labels?.errors },
  };
}

/** Complete provider setup workflow with credential verification and model discovery. */
export function ProviderCreateForm({
  className,
  defaultValues,
  providerOptions = defaultProviderOptions,
  labels: labelsProp,
  onCancel,
  onVerifyAndFetchModels,
  onSubmit,
  style,
  ...props
}: ProviderCreateFormProps) {
  const labels = useMemo(() => mergeLabels(labelsProp), [labelsProp]);
  const initialValues = useMemo<ProviderFormValues>(
    () => ({
      ...defaultProviderFormValues,
      ...defaultValues,
      models: (defaultValues?.models ?? defaultProviderFormValues.models).map((model) => ({
        ...model,
      })),
    }),
    [defaultValues]
  );
  const [values, setValues] = useState(initialValues);
  const [step, setStep] = useState<FormStep>("basic");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionResult, setConnectionResult] =
    useState<ProviderConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const ErrorIcon = useIcon("circle-x");
  const LinkIcon = useIcon("link");
  const LockIcon = useIcon("lock");
  const ArrowRightIcon = useIcon("arrow-right");
  const ArrowLeftIcon = useIcon("arrow-left");

  const currentStepIndex = labels.steps.findIndex((item) => item.value === step);
  const enabledModels = values.models.filter((model) => model.enabled);
  const providerIcons = useMemo(
    () =>
      new Map(
        providerOptions.map((option) => [
          option.value,
          createProviderIcon(option.icon ?? option.value),
        ])
      ),
    [providerOptions]
  );
  const SelectedProviderIcon = providerIcons.get(values.kind);

  const clearError = (key: FormErrorKey) => {
    if (!errors[key]) return;
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setValue = <Key extends "name" | "description">(
    key: Key,
    value: ProviderFormValues[Key]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name") clearError("name");
  };

  const resetVerification = (next: Partial<Pick<ProviderFormValues, "kind" | "apiKey">>) => {
    setValues((current) => ({ ...current, ...next, models: [] }));
    setConnectionResult(null);
    setErrors((current) => ({
      ...current,
      kind: next.kind ? undefined : current.kind,
      apiKey: next.apiKey ? undefined : current.apiKey,
      verification: undefined,
      models: undefined,
    }));
  };

  const toggleModel = (id: string, enabled: boolean) => {
    setValues((current) => ({
      ...current,
      models: current.models.map((model) =>
        model.id === id ? { ...model, enabled } : model
      ),
    }));
    clearError("models");
  };

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  };

  const errorsForStep = (targetStep: FormStep): FormErrors => {
    const nextErrors: FormErrors = {};
    if (targetStep === "basic" && !values.name.trim()) {
      nextErrors.name = labels.errors.name;
    }
    if (targetStep === "connection") {
      if (!values.kind) nextErrors.kind = labels.errors.kind;
      if (values.apiKey.trim().length < 8) nextErrors.apiKey = labels.errors.apiKey;
      if (connectionResult?.status !== "success" || values.models.length === 0) {
        nextErrors.verification = labels.errors.verification;
      } else if (enabledModels.length === 0) {
        nextErrors.models = labels.errors.models;
      }
    }
    return nextErrors;
  };

  const validateStep = (targetStep: FormStep) => {
    const nextErrors = errorsForStep(targetStep);
    const keys: FormErrorKey[] = targetStep === "basic"
      ? ["name"]
      : targetStep === "connection"
        ? ["kind", "apiKey", "verification", "models"]
        : [];
    setErrors((current) => {
      const retained = { ...current };
      keys.forEach((key) => delete retained[key]);
      return { ...retained, ...nextErrors };
    });
    return Object.keys(nextErrors).length === 0;
  };

  const handleVerifyAndFetch = async () => {
    const credentialErrors: FormErrors = {};
    if (!values.kind) credentialErrors.kind = labels.errors.kind;
    if (values.apiKey.trim().length < 8) credentialErrors.apiKey = labels.errors.apiKey;
    if (Object.keys(credentialErrors).length > 0) {
      setErrors((current) => ({ ...current, ...credentialErrors }));
      focusFirstInvalid();
      return;
    }

    setTesting(true);
    setConnectionResult(null);
    setErrors((current) => ({ ...current, verification: undefined, models: undefined }));
    try {
      const result = onVerifyAndFetchModels
        ? await onVerifyAndFetchModels(values)
        : await defaultVerifyAndFetchModels(values, labels);
      setConnectionResult(result);
      if (result.status === "success" && result.models?.length) {
        setValues((current) => {
          const previous = new Map(current.models.map((model) => [model.id, model.enabled]));
          return {
            ...current,
            models: result.models!.map((model) => ({
              ...model,
              enabled: previous.get(model.id) ?? true,
            })),
          };
        });
      } else {
        setValues((current) => ({ ...current, models: [] }));
      }
    } catch {
      setValues((current) => ({ ...current, models: [] }));
      setConnectionResult({
        status: "error",
        title: labels.verificationErrorTitle,
        description: labels.verificationErrorDescription,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allErrors = {
      ...errorsForStep("basic"),
      ...errorsForStep("connection"),
    };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(allErrors.name ? "basic" : "connection");
      requestAnimationFrame(focusFirstInvalid);
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) await onSubmit(values);
      else await delay(700);
      toast.success(labels.created, {
        description: `${values.name} · ${labels.reviewModelCountValue(enabledModels.length)}`,
      });
    } catch {
      toast.error(labels.errors.submit);
    } finally {
      setSubmitting(false);
    }
  };

  const blockStyle = {
    "--provider-form-max-width": "60rem",
    "--provider-form-content-max-width": "42rem",
    "--provider-form-body-height": "32rem",
    ...style,
  } as CSSProperties;

  return (
    <section
      ref={rootRef}
      className={cn(
        "mx-auto w-full max-w-[var(--provider-form-max-width)] p-4 sm:p-6",
        className
      )}
      style={blockStyle}
      {...props}
    >
      <header className="mb-6 px-1 sm:px-2">
        <h1 className="text-heading font-bold text-fg-default">{labels.title}</h1>
        <p className="mt-2 max-w-2xl text-body text-fg-muted">{labels.description}</p>
      </header>

      <Stepper
        className="gap-4 sm:gap-6"
        nonInteractive
        onValidate={async (_nextStep, direction) => {
          if (direction === "prev") return true;
          const valid = validateStep(step);
          if (!valid) focusFirstInvalid();
          return valid;
        }}
        onValueChange={(value) => setStep(value as FormStep)}
        value={step}
      >
        <StepTrack labels={labels} />

        <form noValidate onSubmit={handleSubmit}>
          <Container>
            <ContainerHeader className="px-4 py-3 sm:px-5">
              <span className="truncate text-label font-medium text-fg-muted">
                {labels.steps[currentStepIndex]?.title}
              </span>
              <span className="shrink-0 text-label tabular-nums text-fg-subtle">
                {labels.stepCount(currentStepIndex + 1, labels.steps.length)}
              </span>
            </ContainerHeader>

            <ContainerBody
              className="p-5 sm:p-7 lg:p-8"
              maxHeight="var(--provider-form-body-height)"
              style={{ height: "var(--provider-form-body-height)" }}
            >
              <div className="mx-auto w-full max-w-[var(--provider-form-content-max-width)]">
                <StepperContent value="basic">
                  <div className="flex flex-col gap-7">
                    <SectionHeading
                      description={labels.basicDescription}
                      title={labels.basicTitle}
                    />

                    <Field invalid={Boolean(errors.name)} name="name">
                      <FieldLabel>{labels.name}</FieldLabel>
                      <Input
                        aria-invalid={Boolean(errors.name) || undefined}
                        onChange={(event) => setValue("name", event.target.value)}
                        placeholder={labels.namePlaceholder}
                        required
                        value={values.name}
                      />
                      {errors.name && <FieldError match>{errors.name}</FieldError>}
                    </Field>

                    <Field name="description">
                      <FieldLabel>{labels.descriptionLabel}</FieldLabel>
                      <Textarea
                        maxLength={descriptionMaxLength}
                        onChange={(event) => setValue("description", event.target.value)}
                        placeholder={labels.descriptionPlaceholder}
                        value={values.description}
                      />
                      <FieldDescription className="flex items-center justify-between gap-3">
                        <span>{labels.descriptionHelp}</span>
                        <span className="shrink-0 tabular-nums">
                          {labels.descriptionCount(values.description.length, descriptionMaxLength)}
                        </span>
                      </FieldDescription>
                    </Field>
                  </div>
                </StepperContent>

                <StepperContent value="connection">
                  <div className="flex flex-col gap-7">
                    <SectionHeading
                      description={labels.connectionDescription}
                      title={labels.connectionTitle}
                    />

                    <FieldGroup className="sm:grid-cols-2">
                      <Field invalid={Boolean(errors.kind)} name="kind">
                        <FieldLabel>{labels.provider}</FieldLabel>
                        <Select
                          onValueChange={(value) =>
                            resetVerification({ kind: value as ProviderKind })
                          }
                          required
                          value={values.kind}
                        >
                          <SelectTrigger
                            aria-invalid={Boolean(errors.kind) || undefined}
                            icon={SelectedProviderIcon}
                            placeholder={labels.providerPlaceholder}
                          />
                          <SelectContent>
                            {providerOptions.map((option, index) => (
                              <SelectItem
                                icon={providerIcons.get(option.value)}
                                index={index}
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.kind && <FieldError match>{errors.kind}</FieldError>}
                      </Field>

                      <Field invalid={Boolean(errors.apiKey)} name="apiKey">
                        <FieldLabel>{labels.apiKey}</FieldLabel>
                        <InputGroup aria-invalid={Boolean(errors.apiKey) || undefined}>
                          <InputGroupAddon className="pr-2">
                            <LockIcon aria-hidden="true" size={16} strokeWidth={1.5} />
                          </InputGroupAddon>
                          <InputGroupInput
                            aria-invalid={Boolean(errors.apiKey) || undefined}
                            autoComplete="new-password"
                            onChange={(event) => resetVerification({ apiKey: event.target.value })}
                            placeholder={labels.apiKeyPlaceholder}
                            required
                            type={showApiKey ? "text" : "password"}
                            value={values.apiKey}
                          />
                          <InputGroupAddon align="inline-end" className="pl-1">
                            <InputGroupButton
                              aria-label={showApiKey ? labels.hideSecret : labels.showSecret}
                              onClick={() => setShowApiKey((current) => !current)}
                            >
                              {showApiKey ? labels.hideSecret : labels.showSecret}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription>{labels.apiKeyDescription}</FieldDescription>
                        {errors.apiKey && <FieldError match>{errors.apiKey}</FieldError>}
                      </Field>
                    </FieldGroup>

                    <div className="flex flex-col items-start gap-3 border-t border-border-subtle pt-5">
                      <Button
                        aria-invalid={Boolean(errors.verification) || undefined}
                        leadingIcon={LinkIcon}
                        loading={testing}
                        onClick={handleVerifyAndFetch}
                        type="button"
                        variant="tertiary"
                      >
                        {testing ? labels.verifyingAndFetching : labels.verifyAndFetch}
                      </Button>
                      {errors.verification && (
                        <p className="px-1.5 text-label font-medium text-fg-danger" role="alert">
                          {errors.verification}
                        </p>
                      )}
                      {connectionResult?.status === "error" && (
                        <Alert status="danger">
                          <AlertIcon>
                            <ErrorIcon />
                          </AlertIcon>
                          <AlertTitle>{connectionResult.title}</AlertTitle>
                          {connectionResult.description && (
                            <AlertDescription>{connectionResult.description}</AlertDescription>
                          )}
                        </Alert>
                      )}
                    </div>

                    {values.models.length > 0 && (
                      <Fieldset>
                        <FieldsetLegend>{labels.modelsTitle}</FieldsetLegend>
                        <p className="px-1.5 text-label text-fg-subtle">
                          {labels.modelsDescription}
                        </p>
                        <div
                          aria-invalid={Boolean(errors.models) || undefined}
                          className="mt-1 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border"
                          tabIndex={errors.models ? -1 : undefined}
                        >
                          {values.models.map((model) => (
                            <div
                              className="flex min-w-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                              key={model.id}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center">
                                  <ProviderModelIcon model={model.id} size={20} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-body font-medium text-fg-default">
                                    {model.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-label text-fg-subtle">
                                    {model.description ?? model.id}
                                  </p>
                                </div>
                              </div>
                              <div className="flex min-w-0 items-center justify-between gap-3 pl-9 sm:shrink-0 sm:justify-end sm:pl-0">
                                {model.tags && model.tags.length > 0 && (
                                  <div
                                    aria-label={`${model.name} 模型能力`}
                                    className="flex min-w-0 flex-wrap justify-end gap-1.5"
                                  >
                                    {model.tags.map((tag) => (
                                      <Badge color="gray" key={tag} size="sm">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <Switch
                                  checked={model.enabled}
                                  className="shrink-0"
                                  label={
                                    <span className="sr-only">
                                      {labels.modelToggle(model.name)}
                                    </span>
                                  }
                                  onCheckedChange={(checked) => toggleModel(model.id, checked)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {errors.models && (
                          <p className="px-1.5 text-label font-medium text-fg-danger" role="alert">
                            {errors.models}
                          </p>
                        )}
                      </Fieldset>
                    )}
                  </div>
                </StepperContent>

                <StepperContent value="review">
                  <div className="flex flex-col gap-7">
                    <SectionHeading
                      description={labels.reviewDescription}
                      title={labels.reviewTitle}
                    />

                    <DetailList>
                      <DetailListItem>
                        <DetailListLabel>{labels.reviewName}</DetailListLabel>
                        <DetailListValue>
                          <span className="flex items-center justify-end gap-2">
                            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
                              <ProviderBrandIcon provider={values.kind} size={18} />
                            </span>
                            <span className="truncate">{values.name}</span>
                          </span>
                        </DetailListValue>
                      </DetailListItem>
                      <DetailListSeparator />
                      <DetailListItem>
                        <DetailListLabel>{labels.reviewModelCount}</DetailListLabel>
                        <DetailListValue>
                          {labels.reviewModelCountValue(enabledModels.length)}
                        </DetailListValue>
                      </DetailListItem>
                    </DetailList>

                    <section aria-labelledby="provider-review-models-title">
                      <h3
                        className="px-1.5 text-body font-medium text-fg-muted"
                        id="provider-review-models-title"
                      >
                        {labels.reviewModels}
                      </h3>
                      <div className="mt-2 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border">
                        {enabledModels.map((model) => (
                          <div className="flex min-w-0 items-center gap-3 px-3 py-3" key={model.id}>
                            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center">
                              <ProviderModelIcon model={model.id} size={20} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-body font-medium text-fg-default">
                                {model.name}
                              </p>
                              <p className="truncate font-mono text-label text-fg-subtle">
                                {model.id}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </StepperContent>
              </div>
            </ContainerBody>

            <ContainerFooter className="bg-surface-raised px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <Button onClick={onCancel} type="button" variant="ghost">
                  {labels.cancel}
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  {step !== "basic" && (
                    <StepperPrev
                      render={
                        <Button leadingIcon={ArrowLeftIcon} size="md" variant="tertiary" />
                      }
                    >
                      {labels.previous}
                    </StepperPrev>
                  )}
                  {step !== "review" ? (
                    <StepperNext
                      render={
                        <Button size="md" trailingIcon={ArrowRightIcon} variant="primary" />
                      }
                    >
                      {labels.continue}
                    </StepperNext>
                  ) : (
                    <Button loading={submitting} type="submit" variant="primary">
                      {submitting ? labels.creating : labels.create}
                    </Button>
                  )}
                </div>
              </div>
            </ContainerFooter>
          </Container>
        </form>
      </Stepper>
    </section>
  );
}
