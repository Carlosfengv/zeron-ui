// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { IconProvider } from "@zeron/icons/context";
import { readFileSync } from "node:fs";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DocPage } from "../docs/components/content/DocPage";
import { SiteCommandPalette } from "../docs/components/shell/site/site-command-palette";
import { BlocksGallery } from "../docs/components/blocks/BlocksGallery";
import { blocksForComponent, componentsForBlock } from "../docs/lib/ai-design-assets";
import IconCatalogPage from "../docs/pages/icons/catalog/page";
import commonEn from "../docs/content/en/common-slim.json";
import commonZh from "../docs/content/zh-CN/common-slim.json";
import iconsEn from "../docs/content/en/icons/catalog.json";
import iconsZh from "../docs/content/zh-CN/icons/catalog.json";

const messages = {
  en: { ...commonEn, ...iconsEn, docMeta: { descriptions: {} } },
  "zh-CN": { ...commonZh, ...iconsZh, docMeta: { descriptions: {} } },
};

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/docs",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
vi.mock("@docs/components/navigation/DocPager", () => ({ DocPager: () => null }));
vi.mock("@docs/components/content/InstallCommand", () => ({ InstallCommand: ({ value }: { value: string }) => <code>{value}</code> }));
vi.mock("@docs/components/blocks/BlockPreview", () => ({ BlockPreview: () => null }));
vi.mock("@docs/components/shell/site/intent-prefetch-link", () => ({ IntentPrefetchLink: "a" }));

beforeAll(() => {
  Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: class {
    observe() {} unobserve() {} disconnect() {}
  } });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => undefined });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
});

describe("documentation IA", () => {
  it.each([
    ["area-chart", "area-chart chart-brush chart-primitives button", "component:area-chart"],
    ["bar-chart", "bar-chart area-chart chart-brush chart-primitives button empty", "component:bar-chart"],
    ["funnel-chart", "funnel-chart chart-primitives", "component:funnel-chart"],
    ["heatmap-chart", "heatmap-chart chart-primitives button", "component:heatmap-chart"],
    ["line-chart", "line-chart chart-primitives button chart-brush", "component:line-chart"],
    ["live-line-chart", "live-line-chart chart-primitives button", "component:live-line-chart"],
    ["pie-chart", "pie-chart chart-primitives button", "component:pie-chart"],
    ["radar-chart", "radar-chart chart-primitives button", "component:radar-chart"],
    ["ring-chart", "ring-chart chart-primitives button", "component:ring-chart"],
    ["motion", "springs", "support:springs"],
    ["surfaces", "elevated", "support:elevated"],
  ])("opens and copies the published contract for %s while preserving the install command", async (slug, installSlug, id) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<NextIntlClientProvider locale="en" messages={messages.en} timeZone="UTC">
      <DocPage slug={slug} installSlug={installSlug} title={slug} description="Example">{null}</DocPage>
    </NextIntlClientProvider>);
    const link = screen.getByRole("link", { name: "Design Contract (.md)" }) as HTMLAnchorElement;
    const path = decodeURIComponent(new URL(link.href).pathname);
    expect(path).toBe(`/ai/items/${id}.md`);
    expect(readFileSync(`public${path}`, "utf8")).toContain(id);
    fireEvent.click(screen.getByRole("button", { name: "Use with AI in my page" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(writeText.mock.calls[0][0]).toContain(link.href);
    expect(writeText.mock.calls[0][0]).toContain(`npx zeron-ui add ${installSlug}\n`);
  });

  it("allows manual copying when clipboard access is denied and clears the fallback on retry", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("Clipboard denied")).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<NextIntlClientProvider locale="en" messages={messages.en} timeZone="UTC">
      <DocPage slug="button" title="Button" description="Submit">{null}</DocPage>
    </NextIntlClientProvider>);
    const action = screen.getByRole("button", { name: "Use with AI in my page" });
    fireEvent.click(action);
    const prompt = await screen.findByRole<HTMLTextAreaElement>("textbox", { name: "Copy the AI prompt manually" });
    expect(prompt.readOnly).toBe(true);
    expect(prompt.value).toBe(writeText.mock.calls[0][0]);
    fireEvent.click(action);
    await screen.findByRole("button", { name: "Copied AI Design Prompt" });
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it.each([
    ["zh-CN", "搜索图标名称", "1 个图标", "已复制"],
    ["en", "Search icon names", "1 icon", "Copied"],
  ] as const)("localizes icon search and clipboard feedback in %s", async (locale, search, count, copied) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="UTC">
      <IconProvider><IconCatalogPage /></IconProvider>
    </NextIntlClientProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: search }), { target: { value: "chevron-down" } });
    expect(screen.getByText(count)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "chevron-down" }));
    expect(await screen.findByText(copied)).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith('const Icon = useIcon("chevron-down");');
  });

  it("uses the registry dependencies in both directions", () => {
    const components = componentsForBlock("cost-estimate-01").map(item => item.slug);
    expect(components).toEqual(expect.arrayContaining(["container", "slider"]));
    for (const slug of ["card", "switch", "select", "bar-chart"]) expect(components).not.toContain(slug);
    for (const block of blocksForComponent("slider")) {
      expect(componentsForBlock(block.registryName).some(item => item.slug === "slider")).toBe(true);
    }
    expect(blocksForComponent("slider").length).toBeGreaterThan(0);
    expect(componentsForBlock("agent-queue-01").map(item => item.slug)).toEqual(expect.arrayContaining(["scrollbars", "motion"]));
  });

  it("finds the Button component in Chinese and opens a keyboard-selected result", async () => {
    render(<SiteCommandPalette localePrefix="" />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = await screen.findByRole("combobox");
    fireEvent.change(input, { target: { value: "按钮" } });
    const button = await screen.findByRole("option", { name: /^Button 通用按钮/ });
    expect(button.getAttribute("data-value")).toBe("components-button");
    const selected = () => screen.getAllByRole("option").find(item => item.getAttribute("aria-selected") === "true");
    const previous = selected();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await waitFor(() => expect(selected()).not.toBe(previous));
    fireEvent.change(input, { target: { value: "通用按钮" } });
    await waitFor(() => expect(selected()?.getAttribute("data-value")).toBe("components-button"));
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/docs/components/button");
  });

  it("restores a shared model scenario and reports the active filter", () => {
    window.history.replaceState(null, "", "/en/docs/pages?scenario=ai-gateway");
    render(<BlocksGallery localePrefix="/en" collection="pages" />);
    const filter = screen.getByRole("button", { name: "AI Gateway & Models" });
    expect(filter.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByText("AI Gateway & Models")).toHaveLength(2);
    expect(document.querySelector('a[href="/en/docs/pages/provider-create-form-01"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "All Scenarios" }));
    expect(window.location.search).toBe("");
  });
});
