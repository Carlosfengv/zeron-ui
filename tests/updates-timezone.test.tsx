// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UpdatesList } from "@/app/[locale]/updates/updates-list";
import type { AppLocale } from "@/app/_i18n/routing";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";

const entries = (timestamps: string[]): CommitHistoryEntry[] => timestamps.map((committedAt, index) => ({
  id: `commit-${index}`, shortId: `short-${index}`, committedAt, author: "Carlos", message: `Update ${index}`,
}));
const commits = entries([
  "2026-10-05T17:19:55Z",
  "2026-10-06T01:19:55+08:00",
  "2026-10-05T15:59:59Z",
  "2026-10-05T06:59:59Z",
]);

async function hydrateInTimeZone(
  locale: AppLocale,
  timeZone: string,
  history: CommitHistoryEntry[],
  verify: (container: HTMLElement) => void,
) {
  const content = <UpdatesList commits={history} locale={locale} />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(content);
  expect(container.textContent).toContain(locale === "en" ? "Time zone: UTC" : "时区：UTC");
  document.body.append(container);
  const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  const browserZone = vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (this: Intl.DateTimeFormat) {
    return { ...resolvedOptions.call(this), timeZone };
  });
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const recoverableErrors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, content, { onRecoverableError: (error) => recoverableErrors.push(error) });
    });
    expect(recoverableErrors).toEqual([]);
    expect(errors.mock.calls).toEqual([]);
    expect(container.textContent).toContain(locale === "en" ? `Time zone: ${timeZone}` : `时区：${timeZone}`);
    verify(container);
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    errors.mockRestore();
    browserZone.mockRestore();
  }
}

describe("updates visitor time zone", () => {
  it("renders UTC dates and times on the server even when inputs carry another offset", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<UpdatesList commits={commits} locale="en" />);
    expect(Array.from(container.querySelectorAll("section"), (section) => section.getAttribute("aria-labelledby"))).toEqual(["updates-2026-10-05"]);
    expect(Array.from(container.querySelectorAll("time"), (time) => time.textContent)).toEqual(["17:19", "17:19", "15:59", "06:59"]);
    expect(container.textContent).toContain("Time zone: UTC");
  });

  it.each(["en", "zh-CN"] as const)("hydrates %s into Shanghai time and regroups midnight crossings", async (locale) => {
    await hydrateInTimeZone(locale, "Asia/Shanghai", commits, (container) => {
      expect(Array.from(container.querySelectorAll("section"), (section) => section.getAttribute("aria-labelledby"))).toEqual(["updates-2026-10-06", "updates-2026-10-05"]);
      expect(Array.from(container.querySelectorAll("time"), (time) => time.textContent)).toEqual(["01:19", "01:19", "23:59", "14:59"]);
      expect(container.querySelector("h2")?.textContent).toBe(locale === "en" ? "Oct 6, 2026" : "2026年10月6日");
      expect(container.querySelectorAll("section")[0].querySelectorAll("li")).toHaveLength(2);
      expect(container.querySelectorAll("time")[1].getAttribute("datetime")).toBe(commits[1].committedAt);
      expect(container.querySelector('a[href="https://github.com/Carlosfengv/zeron-ui/commit/commit-0"]')).not.toBeNull();
      expect(container.textContent?.match(new RegExp(locale === "en" ? "Latest" : "最新", "g"))).toHaveLength(1);
    });
  });

  it.each(["en", "zh-CN"] as const)("uses Los Angeles time independently of the %s language", async (locale) => {
    await hydrateInTimeZone(locale, "America/Los_Angeles", commits, (container) => {
      expect(Array.from(container.querySelectorAll("section"), (section) => section.getAttribute("aria-labelledby"))).toEqual(["updates-2026-10-05", "updates-2026-10-04"]);
      expect(Array.from(container.querySelectorAll("time"), (time) => time.textContent)).toEqual(["10:19", "10:19", "08:59", "23:59"]);
    });
  });

  it("handles daylight saving transitions using the offset at each commit's instant", async () => {
    await hydrateInTimeZone("en", "America/Los_Angeles", entries(["2026-03-08T10:00:00Z", "2026-03-08T09:59:00Z"]), (container) => {
      expect(Array.from(container.querySelectorAll("time"), (time) => time.textContent)).toEqual(["03:00", "01:59"]);
      expect(container.querySelectorAll("section")).toHaveLength(1);
    });
  });

  it("formats local midnight as 00:00", async () => {
    await hydrateInTimeZone("en", "Asia/Shanghai", entries(["2026-10-05T16:00:00Z"]), (container) => {
      expect(container.querySelector("section")?.getAttribute("aria-labelledby")).toBe("updates-2026-10-06");
      expect(container.querySelector("time")?.textContent).toBe("00:00");
    });
  });
});
