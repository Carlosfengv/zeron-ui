import { Suspense, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import english from "../docs/content/en/home.json";
import chinese from "../docs/content/zh-CN/home.json";
import type { NpmRelease } from "../docs/lib/npm-release.server";

const mocks = vi.hoisted(() => ({ readNpmRelease: vi.fn(), setRequestLocale: vi.fn() }));
vi.mock("@docs/lib/npm-release.server", () => ({ readNpmRelease: mocks.readNpmRelease }));
vi.mock("../docs/pages/home.module.css", () => ({ default: {} }));
vi.mock("next-intl/server", () => ({ setRequestLocale: mocks.setRequestLocale }));
vi.mock("@zeron/icons/context", () => ({ useIcon: () => () => null }));
vi.mock("@docs/components/content/HomePreview", () => ({ HomePreview: () => <div>Interactive preview</div> }));
vi.mock("@docs/components/content/CopyPrompt", () => ({ CopyPrompt: () => null }));
vi.mock("@docs/components/content/InstallCommand", () => ({ InstallCommand: ({ value }: { value: string }) => <code>{value}</code> }));

import HomePage from "../app/[locale]/page";
import HomeContent, { type HomeContentProps } from "../docs/pages/home";
import { HomeReleasePlaceholder, HomeReleaseSlot } from "../docs/pages/home-release.server";

const published: NpmRelease = { version: "0.2.0-beta.16", publishedAt: "2026-09-14T05:47:22.594Z", node: ">=20.18.1", prerelease: true };

beforeEach(() => vi.clearAllMocks());

describe("homepage release streaming", () => {
  it.each(["en", "zh-CN"])("returns the %s shell while npm remains unresolved", async (locale) => {
    const release = new Promise<NpmRelease | null>(() => {});
    mocks.readNpmRelease.mockReturnValue(release);
    const page = await HomePage({ params: Promise.resolve({ locale }) });
    expect(mocks.readNpmRelease).toHaveBeenCalledTimes(1);
    expect(mocks.setRequestLocale).toHaveBeenCalledWith(locale);
    expect(page.props.locale).toBe(locale);
    const home = page.props.children as ReactElement<HomeContentProps>;
    expect(home.type).toBe(HomeContent);
    for (const [key, part] of [["releaseBadge", "badge"], ["releaseDetails", "details"], ["initializeCommand", "init"], ["addCommand", "add button"]] as const) {
      const slot = home.props[key] as ReactElement<{ children: ReactElement<{ release: typeof release; part: string }>; fallback: ReactElement }>;
      expect(slot.type).toBe(Suspense);
      expect(slot.props.children.type).toBe(HomeReleaseSlot);
      expect(slot.props.children.props).toEqual({ release, part });
      expect(slot.props.fallback.type).toBe(HomeReleasePlaceholder);
    }
    // Rendering the shell with its pending fallbacks retains all primary content.
    const fallback = (key: keyof HomeContentProps) => (home.props[key] as ReactElement<{ fallback: ReactElement }>).props.fallback;
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale={locale} messages={page.props.messages}>
        <HomeContent releaseBadge={fallback("releaseBadge")} releaseDetails={fallback("releaseDetails")} initializeCommand={fallback("initializeCommand")} addCommand={fallback("addCommand")} />
      </NextIntlClientProvider>
    );
    const messages = locale === "en" ? english : chinese;
    expect(html).toContain(messages.home.title);
    expect(html).toContain('id="install"');
    expect(html).toContain('id="skills"');
    expect(html).not.toContain("npx zeron-ui@");
    expect(html).not.toContain(messages.home.release.unavailable);
    expect(html).not.toContain(messages.home.release.fallback);
  });

  it.each(["en", "zh-CN"])("preserves the published release and localized details in %s", async (locale) => {
    const release = Promise.resolve(published);
    const messages = locale === "en" ? english : chinese;
    const slots = await Promise.all((["badge", "details", "init", "add button"] as const).map((part) => HomeReleaseSlot({ release, part })));
    const html = renderToStaticMarkup(<NextIntlClientProvider locale={locale} messages={messages}>{slots.map((slot, index) => <div key={index}>{slot}</div>)}</NextIntlClientProvider>);
    expect(html).toContain("v0.2.0-beta.16");
    expect(html).toContain(messages.home.release.prerelease);
    expect(html).toContain(messages.home.release.source.replaceAll("'", "&#x27;"));
    expect(html).toContain(new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(published.publishedAt!)));
    expect(html).toContain('dateTime="2026-09-14T05:47:22.594Z"');
    expect(html).toContain(`href="${locale === "en" ? "/en" : ""}/updates"`);
    expect(html).toContain("npx zeron-ui@0.2.0-beta.16 init");
    expect(html).toContain("npx zeron-ui@0.2.0-beta.16 add button");
    expect(html).not.toContain("@latest");
  });

  it("shows the existing null fallback only after the request resolves", async () => {
    const release = Promise.resolve(null);
    const slots = await Promise.all((["badge", "details", "init", "add button"] as const).map((part) => HomeReleaseSlot({ release, part })));
    const html = renderToStaticMarkup(<NextIntlClientProvider locale="en" messages={english}>{slots.map((slot, index) => <div key={index}>{slot}</div>)}</NextIntlClientProvider>);
    expect(html).toContain(english.home.release.unavailable);
    expect(html).toContain(english.home.release.fallback);
    expect(html).toContain("npx zeron-ui@latest init");
    expect(html).toContain("npx zeron-ui@latest add button");
    expect(html).not.toContain("<time");
  });
});
