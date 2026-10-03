// @vitest-environment jsdom
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, expect, it, vi } from "vitest";
import { ComponentPreview } from "../docs/components/content/ComponentPreview";
import type { PreviewCode, PreviewSourceReference } from "../docs/lib/preview-source";
import english from "../docs/content/en/common-slim.json";
import chinese from "../docs/content/zh-CN/common-slim.json";

vi.mock("@zeron/ui/code-block", () => new Promise(() => {}));
let sourceId = 100;
const reference = (): PreviewSourceReference => ({ url: `/docs-source/${(++sourceId).toString(16).padStart(64, "0")}.txt` });
const response = (text: string) => new Response(text, { headers: { "content-type": "text/plain" } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function preview(code: PreviewCode, locale = "en") {
  return <NextIntlClientProvider locale={locale} messages={{ preview: locale === "en" ? english.preview : chinese.preview }}>
    <ComponentPreview code={code} inspectable={false}><div>Live demo</div></ComponentPreview>
  </NextIntlClientProvider>;
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("makes no request at rest, preloads on Code intent and keeps raw source copyable before highlighting", async () => {
  const pending = deferred<Response>();
  const fetch = vi.fn().mockReturnValue(pending.promise);
  const copy = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("fetch", fetch);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  const code = reference();
  render(preview(code));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.pointerEnter(screen.getByRole("tab", { name: "Code" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  expect(screen.queryByText(english.preview.sourceLoading)).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByRole("status").textContent).toBe(english.preview.sourceLoading);
  await act(async () => pending.resolve(response("\nexport const source = 'raw';\n")));
  expect(screen.getByText("export const source = 'raw';")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(english.preview.highlighting);
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await screen.findByRole("button", { name: "Copied" });
  expect(copy).toHaveBeenCalledWith("export const source = 'raw';");
  fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("localizes loading and failure, with an explicit retry that recovers without reloading the page", async () => {
  const pending = deferred<Response>();
  const fetch = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(response("const recovered = true;"));
  vi.stubGlobal("fetch", fetch);
  const code = reference();
  render(preview(code, "zh-CN"));
  fireEvent.click(screen.getByRole("tab", { name: chinese.preview.code }));
  expect(screen.getByRole("status").textContent).toBe(chinese.preview.sourceLoading);
  await act(async () => pending.resolve(new Response("missing", { status: 404 })));
  expect(screen.getByRole("status").textContent).toBe(chinese.preview.sourceFailed);
  expect(screen.queryByRole("button", { name: chinese.preview.copy })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: chinese.preview.sourceRetry }));
  expect(await screen.findByText("const recovered = true;")).toBeTruthy();
  expect(fetch).toHaveBeenNthCalledWith(2, code.url, expect.anything());
});

it("preloads on keyboard focus and aborts abandoned intent and unmounted previews", async () => {
  const pending = deferred<Response>();
  const fetch = vi.fn().mockReturnValue(pending.promise);
  vi.stubGlobal("fetch", fetch);
  const view = render(preview(reference()));
  const codeTab = screen.getByRole("tab", { name: "Code" });
  fireEvent.focus(codeTab);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  const firstSignal = fetch.mock.calls[0][1].signal;
  fireEvent.blur(codeTab);
  expect(firstSignal.aborted).toBe(true);
  fireEvent.focus(codeTab);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  view.unmount();
  expect(fetch.mock.calls[1][1].signal.aborted).toBe(true);
  await act(async () => pending.resolve(response("abandoned")));
});

it("aborts old sources and never shows a late response after navigation changes the source", async () => {
  const oldResponse = deferred<Response>();
  const newResponse = deferred<Response>();
  const fetch = vi.fn().mockReturnValueOnce(oldResponse.promise).mockReturnValueOnce(newResponse.promise);
  vi.stubGlobal("fetch", fetch);
  const view = render(preview(reference()));
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  view.rerender(preview(reference()));
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => newResponse.resolve(response("const newest = true;")));
  await act(async () => oldResponse.resolve(response("const obsolete = true;")));
  expect(screen.getByText("const newest = true;")).toBeTruthy();
  expect(screen.queryByText("const obsolete = true;")).toBeNull();
});

it("offers raw copy recovery if clipboard permission fails", async () => {
  const copy = vi.fn().mockRejectedValueOnce(new Error("clipboard denied")).mockResolvedValueOnce(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  render(preview("const inline = 42;"));
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  fireEvent.click(await screen.findByRole("button", { name: "Copy failed" }));
  expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
  expect(copy).toHaveBeenCalledTimes(2);
});

it("clears successful copy feedback when a different source is shown", async () => {
  const copy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
  const view = render(preview("const first = 1;"));
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  await screen.findByRole("button", { name: "Copied" });
  view.rerender(preview("const second = 2;"));
  expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
  view.rerender(preview("const first = 1;"));
  expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy();
  expect(copy).toHaveBeenCalledTimes(1);
});

it("keeps opted-in demo state mounted and inaccessible while the Code tab is selected", async () => {
  function StatefulDemo() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount((value) => value + 1)}>Count {count}</button>;
  }
  render(<NextIntlClientProvider locale="en" messages={{ preview: english.preview }}>
    <ComponentPreview code="const stateful = true;" preservePreview inspectable={false}><StatefulDemo /></ComponentPreview>
  </NextIntlClientProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Count 0" }));
  fireEvent.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByRole("button", { name: "Count 1" })).toBeNull();
  expect(screen.getByText("Count 1").closest("[data-slot='component-preview-content']")?.getAttribute("style")).toContain("display: none");
  fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByRole("button", { name: "Count 1" })).toBeTruthy();
});
