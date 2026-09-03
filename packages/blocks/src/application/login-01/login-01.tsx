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
import { Card, CardContent, CardDescription, CardHeader } from "@zeron/ui/card";
import { Field, FieldError, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { Separator } from "@zeron/ui/separator";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";

export interface Login01Values {
  email: string;
  password: string;
}

export interface Login01Errors {
  email?: string;
  password?: string;
  form?: string;
}

export type Login01Action = "credentials" | "apple" | "google";

export interface Login01Labels {
  brand: string;
  brandAriaLabel: string;
  title: string;
  description: string;
  apple: string;
  google: string;
  divider: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  forgotPassword: string;
  submit: string;
  signupPrompt: string;
  signup: string;
  legalPrefix: string;
  terms: string;
  legalJoin: string;
  privacy: string;
  legalSuffix: string;
}

export interface Login01Props
  extends Omit<ComponentPropsWithoutRef<typeof AuthLayout>, "children" | "onSubmit"> {
  brandHref?: string;
  signupHref?: string;
  forgotPasswordHref?: string;
  termsHref?: string;
  privacyHref?: string;
  logo?: ReactNode;
  defaultValues?: Partial<Login01Values>;
  errors?: Login01Errors;
  labels?: Partial<Login01Labels>;
  disabled?: boolean;
  pendingAction?: Login01Action | null;
  onSubmit?: (values: Login01Values) => void | Promise<void>;
  onAppleLogin?: () => void | Promise<void>;
  onGoogleLogin?: () => void | Promise<void>;
}

const defaultLabels: Login01Labels = {
  brand: "ZStack login",
  brandAriaLabel: "Go to home",
  title: "Welcome back",
  description: "Login with your Apple or Google account",
  apple: "Login with Apple",
  google: "Login with Google",
  divider: "Or continue with",
  email: "Email",
  emailPlaceholder: "m@example.com",
  password: "Password",
  forgotPassword: "Forgot your password?",
  submit: "Login",
  signupPrompt: "Don't have an account?",
  signup: "Sign up",
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

export function Login01({
  brandHref = "/",
  signupHref = "/signup",
  forgotPasswordHref = "/forgot-password",
  termsHref = "/terms",
  privacyHref = "/privacy",
  logo,
  defaultValues,
  errors,
  labels: labelsProp,
  disabled = false,
  pendingAction: controlledPendingAction,
  onSubmit,
  onAppleLogin,
  onGoogleLogin,
  className,
  ...layoutProps
}: Login01Props) {
  const BrandIcon = useIcon("square-library");
  const labels = { ...defaultLabels, ...labelsProp };
  const [internalPendingAction, setInternalPendingAction] = useState<Login01Action | null>(null);
  const pendingAction = controlledPendingAction === undefined
    ? internalPendingAction
    : controlledPendingAction;
  const interactionDisabled = disabled || pendingAction !== null;

  async function runProvider(
    action: Exclude<Login01Action, "credentials">,
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
    setInternalPendingAction("credentials");
    try {
      await onSubmit({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
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
        <AuthLayoutHeader>
          <Link
            aria-label={labels.brandAriaLabel}
            className="inline-flex items-center gap-2 rounded-sm text-body font-medium text-fg-default outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
            href={brandHref}
          >
            {logo ?? <BrandIcon aria-hidden className="shrink-0" size={16} />}
            <span>{labels.brand}</span>
          </Link>
        </AuthLayoutHeader>

        <AuthLayoutBody className="border-[0.5px] border-border">
          <form onSubmit={handleSubmit}>
            <Card className="w-full">
              <CardHeader className="items-center text-center">
                <h1 className="text-title font-semibold text-fg-default">{labels.title}</h1>
                <CardDescription>{labels.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Button
                    className="w-full"
                    disabled={interactionDisabled}
                    leadingIcon={AppleBrandIcon}
                    loading={pendingAction === "apple"}
                    onClick={() => void runProvider("apple", onAppleLogin)}
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
                    onClick={() => void runProvider("google", onGoogleLogin)}
                    size="lg"
                    type="button"
                    variant="tertiary"
                  >
                    {labels.google}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-body text-fg-subtle">
                  <Separator className="flex-1" />
                  <span className="shrink-0">{labels.divider}</span>
                  <Separator className="flex-1" />
                </div>

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

                <Field invalid={Boolean(errors?.password)} name="password">
                  <div className="flex items-center justify-between gap-4">
                    <FieldLabel>{labels.password}</FieldLabel>
                    <Link
                      className="rounded-sm text-body text-fg-default underline-offset-4 outline-none hover:underline focus-visible:ring-1 focus-visible:ring-focus-ring"
                      href={forgotPasswordHref}
                    >
                      {labels.forgotPassword}
                    </Link>
                  </div>
                  <Input
                    aria-invalid={Boolean(errors?.password) || undefined}
                    autoComplete="current-password"
                    defaultValue={defaultValues?.password}
                    disabled={interactionDisabled}
                    name="password"
                    required
                    size="lg"
                    type="password"
                  />
                  {errors?.password && <FieldError match>{errors.password}</FieldError>}
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
                    loading={pendingAction === "credentials"}
                    size="lg"
                    type="submit"
                    variant="neutral"
                  >
                    {labels.submit}
                  </Button>
                  <p className="text-center text-body text-fg-subtle">
                    {labels.signupPrompt}{" "}
                    <Link
                      className="rounded-sm text-fg-default underline underline-offset-4 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
                      href={signupHref}
                    >
                      {labels.signup}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
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
