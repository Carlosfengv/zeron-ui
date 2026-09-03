"use client";

import Link from "next/link";
import AppleMono from "@lobehub/icons/es/Apple/components/Mono";
import GoogleMono from "@lobehub/icons/es/Google/components/Mono";
import {
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AuthLayout,
  AuthLayoutBody,
  AuthLayoutContent,
  AuthLayoutFooter,
  AuthLayoutHeader,
} from "@zeron/ui/auth-layout";
import { Button } from "@zeron/ui/button";
import { Field, FieldError, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { Separator } from "@zeron/ui/separator";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";

export interface Signup01Values {
  email: string;
}

export interface Signup01Errors {
  email?: string;
  form?: string;
}

export type Signup01Action = "email" | "apple" | "google";

export interface Signup01Labels {
  brandAriaLabel: string;
  title: string;
  signinPrompt: string;
  signin: string;
  email: string;
  emailPlaceholder: string;
  submit: string;
  divider: string;
  apple: string;
  google: string;
  legalPrefix: string;
  terms: string;
  legalJoin: string;
  privacy: string;
  legalSuffix: string;
}

export interface Signup01Props
  extends Omit<ComponentPropsWithoutRef<typeof AuthLayout>, "children" | "onSubmit"> {
  brandHref?: string;
  signinHref?: string;
  termsHref?: string;
  privacyHref?: string;
  logo?: ReactNode;
  defaultValues?: Partial<Signup01Values>;
  errors?: Signup01Errors;
  labels?: Partial<Signup01Labels>;
  disabled?: boolean;
  pendingAction?: Signup01Action | null;
  onSubmit?: (values: Signup01Values) => void | Promise<void>;
  onAppleSignup?: () => void | Promise<void>;
  onGoogleSignup?: () => void | Promise<void>;
}

const defaultLabels: Signup01Labels = {
  brandAriaLabel: "Go to home",
  title: "Welcome to Acme Inc.",
  signinPrompt: "Already have an account?",
  signin: "Sign in",
  email: "Email",
  emailPlaceholder: "m@example.com",
  submit: "Create Account",
  divider: "Or",
  apple: "Continue with Apple",
  google: "Continue with Google",
  legalPrefix: "By clicking continue, you agree to our",
  terms: "Terms of Service",
  legalJoin: "and",
  privacy: "Privacy Policy",
  legalSuffix: ".",
};

const AppleBrandIcon: IconComponent = (props) => (
  <AppleMono {...props} aria-hidden />
);

const GoogleBrandIcon: IconComponent = (props) => (
  <GoogleMono {...props} aria-hidden />
);

export function Signup01({
  brandHref = "/",
  signinHref = "/login",
  termsHref = "/terms",
  privacyHref = "/privacy",
  logo,
  defaultValues,
  errors,
  labels: labelsProp,
  disabled = false,
  pendingAction: controlledPendingAction,
  onSubmit,
  onAppleSignup,
  onGoogleSignup,
  className,
  ...layoutProps
}: Signup01Props) {
  const BrandIcon = useIcon("square-library");
  const labels = { ...defaultLabels, ...labelsProp };
  const [internalPendingAction, setInternalPendingAction] = useState<Signup01Action | null>(null);
  const pendingAction = controlledPendingAction === undefined
    ? internalPendingAction
    : controlledPendingAction;
  const interactionDisabled = disabled || pendingAction !== null;

  async function runProvider(
    action: Exclude<Signup01Action, "email">,
    callback?: () => void | Promise<void>
  ) {
    if (!callback || interactionDisabled) return;
    setInternalPendingAction(action);
    try {
      await callback();
    } finally {
      setInternalPendingAction(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit || interactionDisabled) return;

    const formData = new FormData(event.currentTarget);
    setInternalPendingAction("email");
    try {
      await onSubmit({ email: String(formData.get("email") ?? "") });
    } finally {
      setInternalPendingAction(null);
    }
  }

  return (
    <AuthLayout
      aria-busy={pendingAction !== null || undefined}
      className={className}
      {...layoutProps}
    >
      <AuthLayoutContent size="sm">
        <AuthLayoutHeader className="flex-col gap-2 text-center">
          <Link
            aria-label={labels.brandAriaLabel}
            className="flex size-8 items-center justify-center rounded-sm text-fg-default outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
            href={brandHref}
          >
            {logo ?? <BrandIcon aria-hidden size={24} />}
          </Link>
          <h1 className="text-title font-bold text-fg-default">{labels.title}</h1>
          <p className="text-body text-fg-subtle">
            {labels.signinPrompt}{" "}
            <Link
              className="rounded-sm text-fg-default underline underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
              href={signinHref}
            >
              {labels.signin}
            </Link>
          </p>
        </AuthLayoutHeader>

        <AuthLayoutBody>
          <form className="flex flex-col gap-7" onSubmit={handleSubmit}>
            <Field invalid={Boolean(errors?.email)} name="email">
              <FieldLabel>{labels.email}</FieldLabel>
              <Input
                aria-invalid={Boolean(errors?.email) || undefined}
                autoComplete="email"
                defaultValue={defaultValues?.email}
                disabled={interactionDisabled}
                name="email"
                placeholder={labels.emailPlaceholder}
                required
                size="lg"
                type="email"
              />
              {errors?.email && <FieldError match>{errors.email}</FieldError>}
            </Field>

            <div className="grid gap-3">
              {errors?.form && (
                <p aria-live="polite" className="text-center text-label font-medium text-fg-danger" role="alert">
                  {errors.form}
                </p>
              )}
              <Button
                className="w-full"
                disabled={interactionDisabled}
                loading={pendingAction === "email"}
                size="lg"
                type="submit"
              >
                {labels.submit}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-body text-fg-subtle">
              <Separator className="flex-1" />
              <span className="shrink-0">{labels.divider}</span>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button
                className="w-full"
                disabled={interactionDisabled}
                leadingIcon={AppleBrandIcon}
                loading={pendingAction === "apple"}
                onClick={() => void runProvider("apple", onAppleSignup)}
                size="lg"
                type="button"
                variant="tertiary"
              >
                {labels.apple}
              </Button>
              <Button
                className="w-full"
                disabled={interactionDisabled}
                leadingIcon={GoogleBrandIcon}
                loading={pendingAction === "google"}
                onClick={() => void runProvider("google", onGoogleSignup)}
                size="lg"
                type="button"
                variant="tertiary"
              >
                {labels.google}
              </Button>
            </div>
          </form>
        </AuthLayoutBody>

        <AuthLayoutFooter>
          {labels.legalPrefix}{" "}
          <Link className="rounded-sm text-fg-default underline underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring" href={termsHref}>
            {labels.terms}
          </Link>{" "}
          {labels.legalJoin}{" "}
          <Link className="rounded-sm text-fg-default underline underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring" href={privacyHref}>
            {labels.privacy}
          </Link>
          {labels.legalSuffix}
        </AuthLayoutFooter>
      </AuthLayoutContent>
    </AuthLayout>
  );
}
