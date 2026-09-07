"use client";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  AvatarWithDetails,
} from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const PROFILE_IMAGE = "/figma/zstack-account-menu/avatar.jpeg";
const AGENT_IMAGE = "/figma/nav-menu-agent-avatar.png";

const basicCode = `import { Avatar, AvatarFallback, AvatarImage } from "./components";

<Avatar>
  <AvatarImage src="/profile.jpg" alt="Chen Ning" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`;

const badgeCode = `<Avatar>
  <AvatarImage src="/profile.jpg" alt="Chen Ning" />
  <AvatarFallback>CN</AvatarFallback>
  <AvatarBadge className="bg-success-border">
    <span className="sr-only">Online</span>
  </AvatarBadge>
</Avatar>`;

const userDetailsCode = `import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarWithDetails,
} from "./components/avatar"
import { Badge } from "./components/badge"

<AvatarWithDetails
  size="lg"
  avatar={
    <Avatar size="lg">
      <AvatarImage src="/profile.jpg" alt="" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  }
  name="Alex Johnson"
  description="Founder & CEO"
  badge={
    <Badge
      variant="strong"
      size="sm"
      color={{
        base: "var(--inverse-background)",
        onStrong: "var(--fg-on-inverse)",
      }}
    >
      Pro
    </Badge>
  }
/>`;

const groupCode = `<AvatarGroup>
  <Avatar>
    <AvatarImage src="/profile.jpg" alt="Chen Ning" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarImage src="/agent.png" alt="Zeron Agent" />
    <AvatarFallback>ZA</AvatarFallback>
  </Avatar>
  <Avatar><AvatarFallback>ER</AvatarFallback></Avatar>
  <AvatarGroupCount aria-label="3 more members">+3</AvatarGroupCount>
</AvatarGroup>`;

const sizesCode = `<Avatar size="sm"><AvatarFallback>CN</AvatarFallback></Avatar>
<Avatar><AvatarFallback>CN</AvatarFallback></Avatar>
<Avatar size="lg"><AvatarFallback>CN</AvatarFallback></Avatar>`;

const fallbackCode = `<Avatar>
  <AvatarImage src="/missing-profile.jpg" alt="Evil Rabbit" />
  <AvatarFallback delay={200}>ER</AvatarFallback>
</Avatar>`;

export default function AvatarDoc() {
  const t = useTranslations("avatar");

  const avatarProps: PropDef[] = [
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: t("sizeProp") },
    { name: "className", type: "string", description: t("classNameProp") },
    { name: "render", type: "ReactElement | function", description: t("renderProp") },
  ];
  const imageProps: PropDef[] = [
    { name: "src", type: "string", description: t("srcProp") },
    { name: "alt", type: "string", description: t("altProp") },
    { name: "onLoadingStatusChange", type: "(status) => void", description: t("loadingStatusProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];
  const fallbackProps: PropDef[] = [
    { name: "delay", type: "number", default: "0", description: t("delayProp") },
    { name: "className", type: "string", description: t("classNameProp") },
  ];
  const compositionProps: PropDef[] = [
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];
  const withDetailsProps: PropDef[] = [
    { name: "avatar", type: "ReactNode", description: t("detailsAvatarProp") },
    { name: "name", type: "ReactNode", description: t("detailsNameProp") },
    { name: "description", type: "ReactNode", description: t("detailsDescriptionProp") },
    { name: "badge", type: "ReactNode", description: t("detailsBadgeProp") },
    { name: "size", type: '"default" | "lg"', default: '"default"', description: t("detailsSizeProp") },
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];

  return (
    <DocPage
      title="Avatar"
      slug="avatar"
      description={t("description")}
    >
      <DocSection title={t("userDetails")}>
        <ComponentPreview code={userDetailsCode} coverSource>
          <AvatarWithDetails
            size="lg"
            avatar={
              <Avatar size="lg">
                <AvatarImage src={PROFILE_IMAGE} alt="" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
            }
            name="Alex Johnson"
            description="Founder & CEO"
            badge={
              <Badge
                variant="strong"
                size="sm"
                color={{
                  base: "var(--inverse-background)",
                  onStrong: "var(--fg-on-inverse)",
                }}
              >
                Pro
              </Badge>
            }
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={PROFILE_IMAGE} alt="Chen Ning" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback>ER</AvatarFallback>
            </Avatar>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("badge")}>
        <ComponentPreview code={badgeCode}>
          <Avatar size="lg">
            <AvatarImage src={PROFILE_IMAGE} alt="Chen Ning" />
            <AvatarFallback>CN</AvatarFallback>
            <AvatarBadge className="bg-success-border">
              <span className="sr-only">{t("online")}</span>
            </AvatarBadge>
          </Avatar>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("group")}>
        <ComponentPreview code={groupCode}>
          <AvatarGroup>
            <Avatar>
              <AvatarImage src={PROFILE_IMAGE} alt="Chen Ning" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src={AGENT_IMAGE} alt="Zeron Agent" />
              <AvatarFallback>ZA</AvatarFallback>
            </Avatar>
            <Avatar><AvatarFallback>ER</AvatarFallback></Avatar>
            <AvatarGroupCount aria-label={t("moreMembers", { count: 3 })}>+3</AvatarGroupCount>
          </AvatarGroup>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("sizes")}>
        <ComponentPreview code={sizesCode}>
          <div className="flex items-center gap-3">
            <Avatar size="sm"><AvatarFallback>CN</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>CN</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>CN</AvatarFallback></Avatar>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("fallback")}>
        <ComponentPreview code={fallbackCode}>
          <Avatar>
            <AvatarImage src="/missing-profile.jpg" alt="Evil Rabbit" />
            <AvatarFallback delay={200}>ER</AvatarFallback>
          </Avatar>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("accessibility")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">
          {t("accessibilityBody")}
        </p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-semibold text-fg-default">Avatar</h3>
            <PropsTable props={avatarProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-semibold text-fg-default">AvatarImage</h3>
            <PropsTable props={imageProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-semibold text-fg-default">AvatarFallback</h3>
            <PropsTable props={fallbackProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-semibold text-fg-default">AvatarWithDetails</h3>
            <PropsTable props={withDetailsProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body font-semibold text-fg-default">AvatarBadge / AvatarGroup / AvatarGroupCount</h3>
            <PropsTable props={compositionProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
