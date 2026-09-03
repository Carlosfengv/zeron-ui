"use client";

import {
  AuthLayout,
  AuthLayoutBody,
  AuthLayoutContent,
  AuthLayoutFooter,
  AuthLayoutHeader,
  type AuthLayoutSize,
} from "@zeron/ui/auth-layout";
import { Button } from "@zeron/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zeron/ui/card";
import { Field, FieldLabel } from "@zeron/ui/field";
import { Input } from "@zeron/ui/input";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { VariantPlayground } from "@docs/components/playground/variant-playground";

const compositionCode = `import {
  AuthLayout,
  AuthLayoutBody,
  AuthLayoutContent,
  AuthLayoutFooter,
  AuthLayoutHeader,
} from "@zeron/ui/auth-layout";

<AuthLayout>
  <AuthLayoutContent size="sm">
    <AuthLayoutHeader>{/* Product identity */}</AuthLayoutHeader>
    <AuthLayoutBody>{/* Card or authentication flow */}</AuthLayoutBody>
    <AuthLayoutFooter>{/* Legal and help links */}</AuthLayoutFooter>
  </AuthLayoutContent>
</AuthLayout>`;

const props: PropDef[] = [
  {
    name: "AuthLayout",
    type: "main props & { landmark?: boolean }",
    default: "landmark: true",
    description:
      "Full-height authentication frame. Set landmark to false only in an embedded preview or another main landmark.",
  },
  {
    name: "AuthLayoutContent",
    type: 'div props & { size?: "sm" | "md" | "lg" }',
    default: 'size: "sm"',
    description:
      "Centered vertical stack. Width presets are 24rem, 28rem, and 36rem.",
  },
  {
    name: "AuthLayoutHeader",
    type: "header props",
    description: "Optional centered product identity or tenant context.",
  },
  {
    name: "AuthLayoutBody",
    type: "div props",
    description:
      "Surface-neutral flow region. Add Card or another surface in the consuming authentication block.",
  },
  {
    name: "AuthLayoutFooter",
    type: "footer props",
    description: "Optional legal, help, locale, or secondary-navigation region.",
  },
];

function AuthPreview({ size = "sm" }: { size?: AuthLayoutSize }) {
  return (
    <AuthLayout
      landmark={false}
      className="min-h-[30rem] w-full group-data-[fullscreen=true]/preview-content:h-full group-data-[fullscreen=true]/preview-content:min-h-0"
    >
      <AuthLayoutContent size={size}>
        <AuthLayoutHeader>
          <a
            href="#"
            className="flex items-center gap-2 rounded-lg text-body font-medium text-fg-default outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
          >
            <span className="grid size-6 place-items-center rounded-lg bg-inverse-background text-label font-semibold text-fg-on-inverse">
              Z
            </span>
            Zeron
          </a>
        </AuthLayoutHeader>

        <AuthLayoutBody>
          <Card className="shadow-raised">
            <CardHeader className="items-center px-6 pt-6 text-center">
              <CardTitle className="text-title">Welcome back</CardTitle>
              <CardDescription>Sign in to continue to your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 pt-6">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input size="lg" type="email" placeholder="name@example.com" />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input size="lg" type="password" />
              </Field>
            </CardContent>
            <CardFooter className="px-6 pt-6">
              <Button type="button" size="lg" variant="neutral" className="w-full">
                Sign in
              </Button>
            </CardFooter>
          </Card>
        </AuthLayoutBody>

        <AuthLayoutFooter>
          By continuing, you agree to the terms and privacy policy.
        </AuthLayoutFooter>
      </AuthLayoutContent>
    </AuthLayout>
  );
}

export default function AuthLayoutDoc() {
  return (
    <DocPage
      title="AuthLayout"
      slug="auth-layout"
      description="A theme-aware, full-height composition for login, registration, recovery, and verification flows."
    >
      <DocSection title="Playground">
        <VariantPlayground
          padding="none"
          minHeightClass="min-h-[480px]"
          variants={[
            {
              value: "sm",
              label: "Small",
              code: '<AuthLayoutContent size="sm">...</AuthLayoutContent>',
              preview: <AuthPreview size="sm" />,
            },
            {
              value: "md",
              label: "Medium",
              code: '<AuthLayoutContent size="md">...</AuthLayoutContent>',
              preview: <AuthPreview size="md" />,
            },
            {
              value: "lg",
              label: "Large",
              code: '<AuthLayoutContent size="lg">...</AuthLayoutContent>',
              preview: <AuthPreview size="lg" />,
            },
          ]}
        />
      </DocSection>

      <DocSection title="Composition">
        <p className="text-body text-fg-muted">
          AuthLayout owns viewport placement and responsive width only. Authentication
          blocks supply their own surfaces, copy, fields, actions, and integration logic.
        </p>
        <ComponentPreview
          code={compositionCode}
          padding="none"
          minHeightClass="min-h-[520px]"
          fullScreenable
          className="mt-4"
        >
          <AuthPreview />
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
