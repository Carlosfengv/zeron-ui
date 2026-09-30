// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import { ComponentPreview } from "../docs/components/content/ComponentPreview";
import common from "../docs/content/en/common.json";

const moduleLoad = vi.hoisted(() => {
  let reject!: (error: Error) => void;
  const promise = new Promise<never>((_, fail) => { reject = fail; });
  return { promise, reject, requested: vi.fn() };
});
vi.mock("@zeron/ui/code-block", async () => {
  moduleLoad.requested();
  return moduleLoad.promise;
});

afterEach(cleanup);

it("keeps source readable during lazy loading and offers an explicit retry after failure", async () => {
  const code = "export const answer = 42;";
  render(
    <NextIntlClientProvider locale="en" messages={{ preview: common.preview }}>
      <ComponentPreview code={code} inspectable={false} fullScreenable={false}>
        <div>Live demo</div>
      </ComponentPreview>
    </NextIntlClientProvider>,
  );
  expect(moduleLoad.requested).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByText(code)).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(common.preview.highlighting);

  await act(async () => moduleLoad.reject(new Error("Chunk unavailable")));
  expect(screen.getByText(code)).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(common.preview.highlightFailed);
  fireEvent.click(screen.getByRole("button", { name: common.preview.highlightRetry }));
  expect(screen.getByText(code)).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(common.preview.highlighting);
  // A module can stay unavailable after retry; preserve both source and recovery UI.
  expect(await screen.findByRole("button", { name: common.preview.highlightRetry })).toBeTruthy();
});
