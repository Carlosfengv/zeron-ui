// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileUpload, uploadPercentage } from "../packages/blocks/src/application/file-upload-01/file-upload";
import type { FileUploadItem } from "../packages/blocks/src/application/file-upload-01/file-upload-types";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const item: FileUploadItem = { id: "copy", name: "draft.docx", size: 4_000_000, uploadedBytes: 2_700_000, status: "uploading" };
function picker(container: HTMLElement) { return container.querySelector('input[type="file"]')!; }
function dropzone(container: HTMLElement) { return picker(container).parentElement!; }

describe("file upload integration", () => {
  it("reports bounded progress and gates Done on the host's completion state", () => {
    const done = vi.fn();
    const { rerender } = render(<FileUpload items={[item]} onDone={done} />);
    expect(screen.getByRole("progressbar", { name: item.name }).getAttribute("aria-valuenow")).toBe("68");
    expect(screen.getByRole("button", { name: "Uploading…" }).hasAttribute("disabled")).toBe(true);
    expect(uploadPercentage({ ...item, uploadedBytes: Infinity })).toBe(0);
    expect(uploadPercentage({ ...item, uploadedBytes: -1 })).toBe(0);
    expect(uploadPercentage({ ...item, uploadedBytes: 9_000_000 })).toBe(100);
    rerender(<FileUpload items={[{ ...item, status: "complete" }]} onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" })); expect(done).toHaveBeenCalledTimes(1);
    rerender(<FileUpload items={[]} onDone={done} />);
    expect(screen.getByRole("button", { name: "Done" }).hasAttribute("disabled")).toBe(true);
  });

  it("rejects oversized files individually while accepting the rest from the picker", async () => {
    const select = vi.fn(); const accepted = new File(["ok"], "valid.txt"); const oversized = new File(["12345"], "large.txt");
    const { container } = render(<FileUpload items={[]} maxFileSize={4} onFilesSelected={select} />);
    fireEvent.change(picker(container), { target: { files: [accepted, oversized] } });
    await waitFor(() => expect(select).toHaveBeenCalledWith([accepted]));
    expect(screen.getByRole("alert").textContent).toContain("large.txt exceeds");
  });

  it("shares size validation with drag-and-drop and blocks disabled drops", async () => {
    const select = vi.fn(); const file = new File(["abc"], "drop.txt");
    const { container, rerender } = render(<FileUpload items={[]} onFilesSelected={select} />);
    fireEvent.drop(dropzone(container), { dataTransfer: { files: [file] } });
    await waitFor(() => expect(select).toHaveBeenCalledWith([file]));
    rerender(<FileUpload items={[]} onFilesSelected={select} disabled />);
    fireEvent.drop(dropzone(container), { dataTransfer: { files: [file] } });
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("guards concurrent selection, surfaces callback failure and allows another attempt", async () => {
    let reject!: (error: Error) => void;
    const select = vi.fn().mockReturnValueOnce(new Promise<void>((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
    const { container } = render(<FileUpload items={[]} onFilesSelected={select} />);
    const file = new File(["abc"], "draft.txt");
    fireEvent.change(picker(container), { target: { files: [file] } });
    fireEvent.drop(dropzone(container), { dataTransfer: { files: [file] } });
    expect(select).toHaveBeenCalledTimes(1);
    await act(async () => reject(new Error("private service failure")));
    expect(screen.getByRole("alert").textContent).toBe("Files could not be added. Please try again.");
    fireEvent.change(picker(container), { target: { files: [file] } });
    await waitFor(() => expect(select).toHaveBeenCalledTimes(2));
  });

  it("delegates cancellation and retry using stable IDs and never mutates a controlled queue", () => {
    const remove = vi.fn(); const retry = vi.fn(); const clear = vi.fn();
    const { rerender } = render(<FileUpload items={[item]} onRemove={remove} onRemoveAll={clear} />);
    fireEvent.click(screen.getByRole("button", { name: `Cancel upload of ${item.name}` }));
    expect(remove).toHaveBeenCalledWith("copy"); expect(screen.getByText(item.name)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "REMOVE ALL" })); expect(clear).toHaveBeenCalledTimes(1);
    rerender(<FileUpload items={[{ ...item, status: "error", error: "Network unavailable" }]} onRetry={retry} />);
    expect(screen.getByText("Network unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Retry ${item.name}` })); expect(retry).toHaveBeenCalledWith("copy");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
