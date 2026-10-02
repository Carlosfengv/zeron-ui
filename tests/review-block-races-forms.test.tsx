// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProviderCreateForm,
  type ProviderConnectionResult,
  type ProviderCreateFormProps,
} from "../packages/blocks/src/application/provider-create-form-01/provider-create-form";
import { FileManager } from "../packages/blocks/src/application/file-manager-01/file-manager";
import type { FileManagerItem } from "../packages/blocks/src/application/file-manager-01/file-manager-types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const verified = (name: string): ProviderConnectionResult => ({ status: "success", title: "Valid", models: [{ id: name, name }] });
const verifyButton = () => screen.getByRole("button", { name: "验证并获取模型" });
const apiKeyInput = () => screen.getByPlaceholderText("输入厂商 API Key");
async function enterConnection() {
  fireEvent.click(screen.getByRole("button", { name: "继续" }));
  await waitFor(() => expect(apiKeyInput()).toBeTruthy());
}
type Verify = NonNullable<ProviderCreateFormProps["onVerifyAndFetchModels"]>;

describe("provider verification generations", () => {
  it("requires fresh verification for edited credentials before submitting", async () => {
    const old = deferred<ProviderConnectionResult>();
    const verify = vi.fn<Verify>().mockImplementationOnce(() => old.promise).mockResolvedValue(verified("new-model"));
    const submit = vi.fn(async () => {});
    render(<ProviderCreateForm onVerifyAndFetchModels={verify} onSubmit={submit} />);
    await enterConnection();
    fireEvent.click(verifyButton());
    fireEvent.change(apiKeyInput(), { target: { value: "new-unverified-secret" } });
    await act(async () => old.resolve(verified("old-model")));
    expect(screen.queryByText("old-model")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    await waitFor(() => expect(screen.getByText("请先验证 API Key 并获取可用模型。")).toBeTruthy());
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(verifyButton());
    await waitFor(() => expect(screen.getAllByText("new-model").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "添加服务商" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "添加服务商" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ apiKey: "new-unverified-secret", models: [expect.objectContaining({ id: "new-model" })] }));
  });

  it.each(["resolve", "reject"] as const)("ignores an obsolete %s and finally through credentials A → B → A", async (settlement) => {
    const old = deferred<ProviderConnectionResult>();
    const current = deferred<ProviderConnectionResult>();
    const verify = vi.fn<Verify>().mockImplementationOnce(() => old.promise).mockImplementationOnce(() => current.promise);
    render(<ProviderCreateForm onVerifyAndFetchModels={verify} />);
    await enterConnection();
    const input = apiKeyInput() as HTMLInputElement;
    const originalKey = input.value;
    const button = verifyButton();
    act(() => { button.click(); button.click(); });
    expect(verify).toHaveBeenCalledTimes(1);
    fireEvent.change(input, { target: { value: "another-provider-key" } });
    fireEvent.change(input, { target: { value: originalKey } });
    fireEvent.click(verifyButton());
    expect(verify).toHaveBeenCalledTimes(2);
    await act(async () => {
      if (settlement === "resolve") old.resolve(verified("obsolete-model"));
      else old.reject(new Error("obsolete failure"));
    });
    expect(screen.queryByText("obsolete-model")).toBeNull();
    expect(screen.queryByText("验证失败")).toBeNull();
    expect(screen.getByRole("button", { name: "正在验证并获取" })).toBeTruthy();
    await act(async () => current.resolve(verified("current-model")));
    expect(screen.getAllByText("current-model").length).toBeGreaterThan(0);
    expect(verifyButton()).toBeTruthy();
  });

  it("invalidates a pending response when the provider changes", async () => {
    const old = deferred<ProviderConnectionResult>();
    const verify = vi.fn<Verify>(() => old.promise);
    render(<ProviderCreateForm onVerifyAndFetchModels={verify} />);
    await enterConnection();
    fireEvent.click(verifyButton());
    fireEvent.click(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", { name: "Anthropic" });
    fireEvent.focus(option);
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);
    await waitFor(() => expect(screen.getByRole("combobox").textContent).toContain("Anthropic"));
    fireEvent.keyDown(option, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await act(async () => old.resolve(verified("wrong-provider-model")));
    expect(screen.queryByText("wrong-provider-model")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "继续" }));
    await waitFor(() => expect(screen.getByText("请先验证 API Key 并获取可用模型。")).toBeTruthy());
  });
});

const selectedFile: FileManagerItem = { id: "report", name: "Report.txt", kind: "file", parentId: null };
function openCreate(name = "Reports") {
  fireEvent.click(screen.getByRole("button", { name: "New folder" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: name } });
}

describe("file storage action locking", () => {
  it("blocks repeated create clicks and Enter even before React rerenders", async () => {
    const pending = deferred<void>();
    const createFolder = vi.fn(() => pending.promise);
    render(<FileManager actions={{ createFolder }} items={[]} />);
    openCreate();
    const button = screen.getByRole("button", { name: "Create" });
    const input = screen.getByLabelText("Folder name");
    act(() => { button.click(); button.click(); fireEvent.keyDown(input, { key: "Enter" }); });
    expect(createFolder).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(createFolder).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not close or overwrite a dialog opened after cancelling a pending create", async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const createFolder = vi.fn().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    render(<FileManager actions={{ createFolder }} items={[]} />);
    openCreate("First folder");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    openCreate("Second folder");
    fireEvent.keyDown(screen.getByLabelText("Folder name"), { key: "Enter" });
    expect(createFolder).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve());
    expect((screen.getByLabelText("Folder name") as HTMLInputElement).value).toBe("Second folder");
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(createFolder).toHaveBeenNthCalledWith(2, { parentId: null, name: "Second folder" });
    await act(async () => second.resolve());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("releases the lock after a rejected action so the same draft can be retried", async () => {
    const first = deferred<void>();
    const createFolder = vi.fn().mockImplementationOnce(() => first.promise).mockResolvedValue(undefined);
    const onError = vi.fn();
    render(<FileManager actions={{ createFolder }} items={[]} onError={onError} />);
    openCreate();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await act(async () => first.reject(new Error("Storage unavailable")));
    expect(onError).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText("Folder name") as HTMLInputElement).value).toBe("Reports");
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.keyDown(screen.getByLabelText("Folder name"), { key: "Enter" });
    await waitFor(() => expect(createFolder).toHaveBeenCalledTimes(2));
  });

  it("serializes rename and move, and preserves the replacement dialog after rename completes", async () => {
    const renamed = deferred<void>();
    const moved = deferred<void>();
    const rename = vi.fn(() => renamed.promise);
    const move = vi.fn(() => moved.promise);
    const remove = vi.fn();
    render(<FileManager actions={{ rename, move, remove }} items={[selectedFile]} defaultSelectedIds={[selectedFile.id]} />);
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Renamed.txt" } });
    const renameButton = within(screen.getByRole("dialog")).getByRole("button", { name: "Rename" });
    act(() => { renameButton.click(); renameButton.click(); });
    expect(rename).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Move" }));
    const moveButton = within(screen.getByRole("dialog")).getByRole("button", { name: "Move" });
    fireEvent.click(moveButton);
    expect(move).not.toHaveBeenCalled();
    await act(async () => renamed.resolve());
    expect(screen.getByRole("dialog")).toBeTruthy();
    act(() => { moveButton.click(); moveButton.click(); });
    expect(move).toHaveBeenCalledTimes(1);
    await act(async () => moved.resolve());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("guards toolbar action entry points before their disabled state renders", async () => {
    const pending = deferred<void>();
    const remove = vi.fn(() => pending.promise);
    const download = vi.fn();
    render(<FileManager actions={{ remove, download }} items={[selectedFile]} defaultSelectedIds={[selectedFile.id]} />);
    const removeButton = screen.getByRole("button", { name: "Delete" });
    const downloadButton = screen.getByRole("button", { name: "Download" });
    act(() => { removeButton.click(); removeButton.click(); downloadButton.click(); });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(download).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
    fireEvent.click(downloadButton);
    expect(download).toHaveBeenCalledTimes(1);
  });
});
