// @vitest-environment jsdom
import { fireEvent, render, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import { UpdatesList } from "@/app/[locale]/updates/updates-list";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";

vi.mock("@docs/components/blocks/BlockPreview", () => ({
  BlockPreview: ({ name }: { name: string }) => <div data-preview={name} />,
}));
afterEach(cleanup);

const commits: CommitHistoryEntry[] = [
  { id: "new", shortId: "new", committedAt: "2026-10-05T17:19:55Z", author: "Carlos", message: "New interfaces", artifacts: [
    { slug: "cost-estimate-01", title: "Cost Estimate", collection: "blocks", href: "/docs/blocks/cost-estimate-01" },
    { slug: "agent-trace-01", title: "Agent Trace", collection: "pages", href: "/docs/pages/agent-trace-01" },
    { slug: "workflow", title: "Workflow Editor", collection: "pages", href: "/workflow" },
  ] },
  { id: "ordinary", shortId: "ordinary", committedAt: "2026-10-05T16:19:55Z", author: "Carlos", message: "Fix spacing" },
];

it.each(["en", "zh-CN"] as const)("shows linked block/page previews only under the matching %s commit", (locale) => {
  const { container, getByRole } = render(<NextIntlClientProvider locale={locale} messages={{}}><UpdatesList commits={commits} locale={locale} /></NextIntlClientProvider>);
  const prefix = locale === "en" ? "/en" : "";
  expect(getByRole("link", { name: "Cost Estimate" }).getAttribute("href")).toBe(`${prefix}/docs/blocks/cost-estimate-01`);
  expect(getByRole("link", { name: "Agent Trace" }).getAttribute("href")).toBe(`${prefix}/docs/pages/agent-trace-01`);
  expect(getByRole("link", { name: "Workflow Editor" }).getAttribute("href")).toBe("/workflow");
  const rows = container.querySelectorAll("li");
  expect(rows[0].querySelectorAll("[data-preview]")).toHaveLength(3);
  expect(rows[1].querySelectorAll("[data-preview]")).toHaveLength(0);
  expect(rows[0].textContent).toContain(locale === "en" ? "Block" : "区块");
  expect(rows[0].textContent).toContain(locale === "en" ? "Page" : "页面");
  for (const preview of container.querySelectorAll("[data-preview]")) {
    expect(preview.closest("[inert]")?.getAttribute("aria-hidden")).toBe("true");
  }
  fireEvent.focus(getByRole("link", { name: "Cost Estimate" }));
  expect(getByRole("link", { name: "Cost Estimate" }).className).toContain("focus-visible:ring-focus-ring");
});
