"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  AvatarWithDetails,
  type AvatarShape,
  type AvatarSize,
} from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Switch } from "@zeron/ui/switch";
import { AgentGuide } from "@docs/components/content/AgentGuide";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import {
  PLAY_SWITCH,
  PlayDivider,
  PlayField,
  PlaySection,
  PlaySelect,
  PlaygroundLayout,
  PlaygroundPanel,
} from "@docs/components/playground/playground";
import { useTranslations } from "next-intl";

const PROFILE_IMAGE = "/figma/zstack-account-menu/avatar.jpeg";
const AGENT_IMAGE = "/figma/nav-menu-agent-avatar.png";

type PlaygroundContent = "details" | "image" | "fallback" | "group";

const basicCode = `import { Avatar, AvatarFallback, AvatarImage } from "./components";

<Avatar>
  <AvatarImage src="/profile.jpg" alt="Chen Ning" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`;

const shapesCode = `<div className="flex items-center gap-4">
  <Avatar shape="circle" size="lg">
    <AvatarImage src="/profile.jpg" alt="Chen Ning" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
  <Avatar shape="rounded" size="lg">
    <AvatarImage src="/agent.png" alt="Zeron Agent" />
    <AvatarFallback>ZA</AvatarFallback>
  </Avatar>
</div>`;

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
  Badge,
} from "./components"

<AvatarWithDetails
  avatar={
    <Avatar shape="rounded">
      <AvatarImage src="/profile.jpg" alt="" />
      <AvatarFallback>AJ</AvatarFallback>
    </Avatar>
  }
  name="Alex Johnson"
  description="Founder & CEO"
  badge={<Badge variant="strong" size="sm">Pro</Badge>}
/>`;

const groupCode = `<AvatarGroup role="group" aria-label="Project members">
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

const sizesCode = `<div className="flex items-center gap-3">
  <Avatar size="sm"><AvatarFallback>CN</AvatarFallback></Avatar>
  <Avatar><AvatarFallback>CN</AvatarFallback></Avatar>
  <Avatar size="lg"><AvatarFallback>CN</AvatarFallback></Avatar>
</div>`;

const fallbackCode = `<Avatar>
  <AvatarImage src="/missing-profile.jpg" alt="Evil Rabbit" />
  <AvatarFallback delay={200}>ER</AvatarFallback>
</Avatar>`;

function createPlaygroundCode(
  content: PlaygroundContent,
  shape: AvatarShape,
  size: AvatarSize,
  showStatus: boolean
) {
  const props = `shape="${shape}" size="${size}"`;
  const status = showStatus
    ? `\n      <AvatarBadge className="bg-success-border">\n        <span className="sr-only">Online</span>\n      </AvatarBadge>`
    : "";

  if (content === "details") {
    return `import { Avatar, AvatarBadge, AvatarFallback, AvatarImage, AvatarWithDetails, Badge } from "./components";

<AvatarWithDetails
  avatar={
    <Avatar ${props}>
      <AvatarImage src="/profile.jpg" alt="" />
      <AvatarFallback>AJ</AvatarFallback>${status}
    </Avatar>
  }
  name="Alex Johnson"
  description="Founder & CEO"
  badge={<Badge variant="strong" size="sm">Pro</Badge>}
/>`;
  }

  if (content === "group") {
    return `import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./components";

<AvatarGroup role="group" aria-label="Project members">
  <Avatar ${props}>
    <AvatarImage src="/profile.jpg" alt="Chen Ning" />
    <AvatarFallback>CN</AvatarFallback>${status.replaceAll("      ", "    ")}
  </Avatar>
  <Avatar ${props}>
    <AvatarImage src="/agent.png" alt="Zeron Agent" />
    <AvatarFallback>ZA</AvatarFallback>
  </Avatar>
  <Avatar ${props}><AvatarFallback>ER</AvatarFallback></Avatar>
  <AvatarGroupCount aria-label="3 more members">+3</AvatarGroupCount>
</AvatarGroup>`;
  }

  if (content === "fallback") {
    return `import { Avatar, AvatarBadge, AvatarFallback } from "./components";

<Avatar ${props}>
  <AvatarFallback>ER</AvatarFallback>${status.replaceAll("      ", "  ")}
</Avatar>`;
  }

  return `import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "./components";

<Avatar ${props}>
  <AvatarImage src="/profile.jpg" alt="Chen Ning" />
  <AvatarFallback>CN</AvatarFallback>${status.replaceAll("      ", "  ")}
</Avatar>`;
}

function AvatarPlayground() {
  const t = useTranslations("avatar");
  const [content, setContent] = useState<PlaygroundContent>("details");
  const [shape, setShape] = useState<AvatarShape>("rounded");
  const [size, setSize] = useState<AvatarSize>("default");
  const [showStatus, setShowStatus] = useState(true);

  const randomize = () => {
    const pick = <T,>(values: readonly T[]) =>
      values[Math.floor(Math.random() * values.length)];
    setContent(pick(["details", "image", "fallback", "group"] as const));
    setShape(pick(["rounded", "circle"] as const));
    setSize(pick(["sm", "default", "lg"] as const));
    setShowStatus(Math.random() > 0.5);
  };

  const avatar = (image: string | null, fallback: string, alt: string) => (
    <Avatar shape={shape} size={size}>
      {image ? <AvatarImage src={image} alt={alt} /> : null}
      <AvatarFallback>{fallback}</AvatarFallback>
      {showStatus ? (
        <AvatarBadge className="bg-success-border">
          <span className="sr-only">{t("online")}</span>
        </AvatarBadge>
      ) : null}
    </Avatar>
  );

  let preview;
  if (content === "details") {
    preview = (
      <AvatarWithDetails
        avatar={avatar(PROFILE_IMAGE, "AJ", "")}
        name="Alex Johnson"
        description="Founder & CEO"
        badge={<Badge variant="strong" size="sm">Pro</Badge>}
      />
    );
  } else if (content === "group") {
    preview = (
      <AvatarGroup role="group" aria-label={t("projectMembers")}>
        {avatar(PROFILE_IMAGE, "CN", "Chen Ning")}
        <Avatar shape={shape} size={size}>
          <AvatarImage src={AGENT_IMAGE} alt="Zeron Agent" />
          <AvatarFallback>ZA</AvatarFallback>
        </Avatar>
        <Avatar shape={shape} size={size}><AvatarFallback>ER</AvatarFallback></Avatar>
        <AvatarGroupCount aria-label={t("moreMembers", { count: 3 })}>+3</AvatarGroupCount>
      </AvatarGroup>
    );
  } else {
    preview = avatar(
      content === "image" ? PROFILE_IMAGE : null,
      content === "image" ? "CN" : "ER",
      content === "image" ? "Chen Ning" : "Evil Rabbit"
    );
  }

  const controls = (
    <PlaygroundPanel title={t("playgroundApi")} onShuffle={randomize}>
      <PlaySection label={t("composition")} />
      <PlayField label={t("content")}>
        <PlaySelect
          value={content}
          onChange={(value) => setContent(value as PlaygroundContent)}
          options={[
            { value: "details", label: t("playgroundUserDetails") },
            { value: "image", label: t("playgroundImage") },
            { value: "fallback", label: t("playgroundFallback") },
            { value: "group", label: t("playgroundGroup") },
          ]}
        />
      </PlayField>
      <PlayDivider />
      <PlaySection label={t("appearance")} />
      <PlayField label={t("shape")}>
        <PlaySelect
          value={shape}
          onChange={(value) => setShape(value as AvatarShape)}
          options={[
            { value: "rounded", label: t("rounded") },
            { value: "circle", label: t("circle") },
          ]}
        />
      </PlayField>
      <PlayField label={t("size")}>
        <PlaySelect
          value={size}
          onChange={(value) => setSize(value as AvatarSize)}
          options={[
            { value: "sm", label: t("small") },
            { value: "default", label: t("defaultSize") },
            { value: "lg", label: t("large") },
          ]}
        />
      </PlayField>
      <PlayDivider />
      <PlaySection label={t("state")} />
      <Switch
        label={t("showStatus")}
        checked={showStatus}
        onToggle={() => setShowStatus((value) => !value)}
        className={PLAY_SWITCH}
      />
    </PlaygroundPanel>
  );

  return (
    <PlaygroundLayout
      controls={controls}
      preview={
        <ComponentPreview
          code={createPlaygroundCode(content, shape, size, showStatus)}
          minHeightClass="min-h-[280px]"
        >
          {preview}
        </ComponentPreview>
      }
    />
  );
}

export default function AvatarDoc() {
  const t = useTranslations("avatar");

  const avatarProps: PropDef[] = [
    { name: "shape", type: '"circle" | "rounded"', default: '"circle"', description: t("shapeProp") },
    { name: "size", type: '"sm" | "default" | "lg"', default: '"default"', description: t("sizeProp") },
    { name: "className", type: "string", description: t("classNameProp") },
    { name: "render", type: "ReactElement | function", description: t("renderProp") },
  ];
  const imageProps: PropDef[] = [
    { name: "src", type: "string", description: t("srcProp") },
    { name: "alt", type: "string", description: t("altProp") },
    { name: "onLoadingStatusChange", type: "(status) => void", description: t("loadingStatusProp") },
    { name: "className", type: "string", description: t("classNameProp") },
    { name: "render", type: "ReactElement | function", description: t("renderProp") },
  ];
  const fallbackProps: PropDef[] = [
    { name: "delay", type: "number", default: "0", description: t("delayProp") },
    { name: "className", type: "string", description: t("classNameProp") },
    { name: "render", type: "ReactElement | function", description: t("renderProp") },
  ];
  const badgeProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("badgeChildrenProp") },
    { name: "aria-label", type: "string", description: t("statusLabelProp") },
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];
  const groupProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("groupChildrenProp") },
    { name: "aria-label", type: "string", description: t("groupLabelProp") },
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];
  const countProps: PropDef[] = [
    { name: "children", type: "ReactNode", description: t("countChildrenProp") },
    { name: "aria-label", type: "string", description: t("countLabelProp") },
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];
  const withDetailsProps: PropDef[] = [
    { name: "avatar", type: "ReactNode", description: t("detailsAvatarProp") },
    { name: "name", type: "ReactNode", description: t("detailsNameProp") },
    { name: "description", type: "ReactNode", description: t("detailsDescriptionProp") },
    { name: "badge", type: "ReactNode", description: t("detailsBadgeProp") },
    { name: "className", type: "string", description: t("compositionClassNameProp") },
  ];

  return (
    <DocPage title="Avatar" slug="avatar" description={t("description")}>
      <DocSection title={t("playground")}>
        <AvatarPlayground />
      </DocSection>

      <DocSection title={t("shapes")}>
        <ComponentPreview code={shapesCode}>
          <div className="flex items-center gap-4">
            <Avatar shape="circle" size="lg">
              <AvatarImage src={PROFILE_IMAGE} alt="Chen Ning" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar shape="rounded" size="lg">
              <AvatarImage src={AGENT_IMAGE} alt="Zeron Agent" />
              <AvatarFallback>ZA</AvatarFallback>
            </Avatar>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("userDetails")}>
        <ComponentPreview code={userDetailsCode}>
          <AvatarWithDetails
            avatar={
              <Avatar shape="rounded">
                <AvatarImage src={PROFILE_IMAGE} alt="" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
            }
            name="Alex Johnson"
            description="Founder & CEO"
            badge={<Badge variant="strong" size="sm">Pro</Badge>}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <Avatar>
            <AvatarImage src={PROFILE_IMAGE} alt="Chen Ning" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("badge")}>
        <ComponentPreview code={badgeCode}>
          <Avatar>
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
          <AvatarGroup role="group" aria-label={t("projectMembers")}>
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
          {[
            ["Avatar", avatarProps],
            ["AvatarImage", imageProps],
            ["AvatarFallback", fallbackProps],
            ["AvatarBadge", badgeProps],
            ["AvatarGroup", groupProps],
            ["AvatarGroupCount", countProps],
            ["AvatarWithDetails", withDetailsProps],
          ].map(([name, props]) => (
            <div key={name as string} className="flex flex-col gap-3">
              <h3 className="text-body font-semibold text-fg-default">{name as string}</h3>
              <PropsTable props={props as PropDef[]} />
            </div>
          ))}
        </div>
      </DocSection>

      <AgentGuide collection="components" slug="avatar" />
    </DocPage>
  );
}
