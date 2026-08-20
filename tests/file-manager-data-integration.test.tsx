// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FileManager, useFileManager } from "../packages/blocks/src/application/file-manager-01/file-manager";
import type { FileManagerItem } from "../packages/blocks/src/application/file-manager-01/file-manager-types";

class ResizeObserverStub {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback([{ contentRect: { height: 600, width: 800 }, target } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperties(HTMLElement.prototype, {
  clientHeight: { configurable: true, get: () => 600 },
  clientWidth: { configurable: true, get: () => 800 },
});

HTMLElement.prototype.getBoundingClientRect = () => ({
  bottom: 600,
  height: 600,
  left: 0,
  right: 800,
  top: 0,
  width: 800,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});

afterEach(cleanup);

const remoteFolder: FileManagerItem = {
  id: "remote-folder",
  kind: "folder",
  name: "Remote folder",
  parentId: null,
};

const remoteChild: FileManagerItem = {
  id: "remote-child",
  kind: "file",
  name: "Visible API result.txt",
  parentId: "remote-folder",
  extension: "txt",
};

describe("FileManager server data integration", () => {
  it("keeps a controlled directory that is represented only by breadcrumb data", () => {
    const onCurrentFolderChange = vi.fn();

    function StateProbe() {
      const manager = useFileManager({
        breadcrumbItems: [remoteFolder],
        currentFolderId: "remote-folder",
        items: [remoteChild],
        onCurrentFolderChange,
      });
      return <output>{`${manager.currentFolderId}:${manager.breadcrumbs.at(-1)?.name}`}</output>;
    }

    render(<StateProbe />);

    expect(screen.getByText("remote-folder:Remote folder")).toBeTruthy();
    expect(onCurrentFolderChange).not.toHaveBeenCalledWith(null, null);
  });

  it("uses supplied List View column widths instead of a fixed four-column grid", () => {
    render(
      <FileManager
        defaultView="list"
        columns={[
          { id: "name", label: "Name", value: (item) => item.name },
          { id: "owner", label: "Owner", width: "10rem", value: () => "Design" },
        ]}
        items={[remoteChild]}
        showToolbar={false}
      />
    );

    expect(screen.getByRole("treegrid").querySelector("div")?.getAttribute("style")).toContain("10rem");
  });

  it("requests the active server directory with query and sort context", async () => {
    const onRequestData = vi.fn().mockResolvedValue(undefined);

    render(
      <FileManager
        breadcrumbItems={[remoteFolder]}
        currentFolderId="remote-folder"
        dataMode="server"
        defaultQuery="report"
        defaultSort={{ field: "modifiedAt", direction: "desc" }}
        items={[remoteChild]}
        onRequestData={onRequestData}
        showToolbar={false}
      />
    );

    await waitFor(() => expect(onRequestData).toHaveBeenCalledTimes(1));
    expect(onRequestData).toHaveBeenCalledWith(expect.objectContaining({
      folderId: "remote-folder",
      folder: remoteFolder,
      query: "report",
      sort: { field: "modifiedAt", direction: "desc" },
      signal: expect.any(AbortSignal),
    }));
  });

  it("reports rejected storage mutations instead of leaving an unhandled promise", async () => {
    const onError = vi.fn();

    render(
      <FileManager
        actions={{ remove: async () => { throw new Error("Storage unavailable"); } }}
        defaultSelectedIds={[remoteChild.id]}
        items={[remoteChild]}
        onError={onError}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Storage unavailable" }),
      expect.objectContaining({
        folderId: null,
        items: [remoteChild],
        operation: "remove",
      })
    ));
  });
});
