// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInfiniteLogController } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-controller";
import { createInfiniteLogMetadata } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import { createMockLogRecords } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-mocks";
import {
  defaultInfiniteLogFilters,
  type InfiniteLogDataSource,
  type InfiniteLogLiveBatch,
  type InfiniteLogTableState,
} from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

afterEach(cleanup);

const baseState: InfiniteLogTableState = {
  filters: defaultInfiniteLogFilters,
  live: true,
  sort: { field: "timestamp", direction: "desc" },
};

function ControllerProbe({ dataSource, state }: { dataSource: InfiniteLogDataSource; state: InfiniteLogTableState }) {
  const controller = useInfiniteLogController({
    dataSource,
    enableLive: true,
    maxLiveRows: 1,
    pageSize: 20,
    state,
  });

  return (
    <>
      <output data-testid="rows">{controller.rows.map((record) => record.id).join(",")}</output>
      <output data-testid="pending">{controller.pendingLiveCount}</output>
      <output data-testid="live-boundary">{controller.liveBoundary?.recordId}</output>
      <output data-testid="fetching-more">{String(controller.fetchingMore)}</output>
      <button onClick={() => controller.setAtTop(false)} type="button">move away</button>
      <button onClick={() => controller.setAtTop(true)} type="button">move to top</button>
      <button onClick={() => controller.applyPendingLiveRows()} type="button">apply pending</button>
      <button onClick={() => controller.loadMore()} type="button">load more</button>
    </>
  );
}

describe("useInfiniteLogController", () => {
  it("keeps historical pages while bounding only Live rows and queues updates away from the top", async () => {
    const historical = createMockLogRecords({ days: 1 }).slice(0, 2);
    const [firstLive, secondLive] = createMockLogRecords({ seed: 42, days: 1 }).slice(0, 2).map((record, index) => ({
      ...record,
      id: `live-${index}`,
      timestamp: `2026-08-23T00:00:0${index}.000Z`,
    }));
    let emit: ((batch: InfiniteLogLiveBatch) => void) | undefined;
    const unsubscribe = vi.fn();
    const subscribeNewer = vi.fn((options: Parameters<NonNullable<InfiniteLogDataSource["subscribeNewer"]>>[0]) => {
      emit = options.onBatch;
      return unsubscribe;
    });
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn(async () => ({
        metadata: createInfiniteLogMetadata(historical, defaultInfiniteLogFilters),
        newerCheckpoint: "checkpoint-1",
        rows: historical,
        snapshotRevision: "revision-1",
      })),
      loadMetadata: vi.fn(async () => createInfiniteLogMetadata(historical, defaultInfiniteLogFilters)),
      subscribeNewer,
    };

    const { rerender, unmount } = render(<ControllerProbe dataSource={dataSource} state={baseState} />);
    await waitFor(() => expect(subscribeNewer).toHaveBeenCalledTimes(1));
    expect(subscribeNewer.mock.calls[0]?.[0]).toMatchObject({
      after: "checkpoint-1",
      filters: defaultInfiniteLogFilters,
      sort: { field: "timestamp", direction: "desc" },
    });

    act(() => emit?.({ metadata: createInfiniteLogMetadata([...historical, firstLive!], defaultInfiniteLogFilters), rows: [firstLive!] }));
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toContain("live-0"));
    expect(screen.getByTestId("live-boundary").textContent).toBe(historical[0]!.id);

    act(() => screen.getByRole("button", { name: "move away" }).click());
    act(() => emit?.({ rows: [secondLive!] }));
    await waitFor(() => expect(screen.getByTestId("pending").textContent).toBe("1"));
    expect(screen.getByTestId("rows").textContent).not.toContain("live-1");

    act(() => screen.getByRole("button", { name: "apply pending" }).click());
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toContain("live-1"));
    expect(screen.getByTestId("live-boundary").textContent).toBe(historical[0]!.id);
    const ids = screen.getByTestId("rows").textContent ?? "";
    expect(ids).toContain(historical[0]!.id);
    expect(ids).toContain(historical[1]!.id);
    expect(ids).not.toContain("live-0");
    expect(unsubscribe).not.toHaveBeenCalled();

    rerender(<ControllerProbe dataSource={dataSource} state={{ ...baseState, live: false }} />);
    await waitFor(() => expect(screen.getByTestId("live-boundary").textContent).toBe(""));
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("ignores an out-of-order initial response after filters change", async () => {
    const oldRecord = { ...createMockLogRecords({ days: 1 })[0]!, id: "old-result" };
    const newRecord = { ...createMockLogRecords({ seed: 88, days: 1 })[0]!, id: "new-result" };
    let resolveOld: ((page: Awaited<ReturnType<InfiniteLogDataSource["loadPage"]>>) => void) | undefined;
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn((request) => {
        if (request.filters.query === "new") {
          return Promise.resolve({ rows: [newRecord], snapshotRevision: "new" });
        }
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      }),
    };
    const { rerender } = render(<ControllerProbe dataSource={dataSource} state={{ ...baseState, live: false }} />);

    rerender(
      <ControllerProbe
        dataSource={dataSource}
        state={{ ...baseState, filters: { ...defaultInfiniteLogFilters, query: "new" }, live: false }}
      />,
    );
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("new-result"));

    act(() => resolveOld?.({ rows: [oldRecord], snapshotRevision: "old" }));
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("new-result"));
  });

  it("keeps the previous result set visible while a new filter is loading", async () => {
    const oldRecord = { ...createMockLogRecords({ days: 1 })[0]!, id: "old-result" };
    const newRecord = { ...createMockLogRecords({ seed: 99, days: 1 })[0]!, id: "new-result" };
    let resolveNew: ((page: Awaited<ReturnType<InfiniteLogDataSource["loadPage"]>>) => void) | undefined;
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn((request) => {
        if (request.filters.query !== "new") {
          return Promise.resolve({ rows: [oldRecord], snapshotRevision: "old" });
        }
        return new Promise((resolve) => {
          resolveNew = resolve;
        });
      }),
    };
    const { rerender } = render(<ControllerProbe dataSource={dataSource} state={{ ...baseState, live: false }} />);

    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("old-result"));
    rerender(
      <ControllerProbe
        dataSource={dataSource}
        state={{ ...baseState, filters: { ...defaultInfiniteLogFilters, query: "new" }, live: false }}
      />,
    );

    await waitFor(() => expect(dataSource.loadPage).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("rows").textContent).toBe("old-result");

    act(() => resolveNew?.({ rows: [newRecord], snapshotRevision: "new" }));
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe("new-result"));
  });

  it("does not subscribe to Live updates while a fixed time range is selected", async () => {
    const records = createMockLogRecords({ days: 1 }).slice(0, 2);
    const subscribeNewer = vi.fn(() => () => {});
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn(async () => ({
        metadata: createInfiniteLogMetadata(records, defaultInfiniteLogFilters),
        newerCheckpoint: "checkpoint-1",
        rows: records,
        snapshotRevision: "revision-1",
      })),
      loadMetadata: vi.fn(async () => createInfiniteLogMetadata(records, defaultInfiniteLogFilters)),
      subscribeNewer,
    };

    render(
      <ControllerProbe
        dataSource={dataSource}
        state={{
          ...baseState,
          filters: {
            ...defaultInfiniteLogFilters,
            timeRange: { from: "2026-08-21T00:00:00.000Z", to: "2026-08-22T00:00:00.000Z" },
          },
        }}
      />,
    );

    await waitFor(() => expect(dataSource.loadPage).toHaveBeenCalledTimes(1));
    expect(subscribeNewer).not.toHaveBeenCalled();
  });

  it("clears an in-flight pagination state when the query changes", async () => {
    const [first, second] = createMockLogRecords({ days: 1 }).slice(0, 2);
    let resolveMore: ((page: { rows: typeof first[]; snapshotRevision: string }) => void) | undefined;
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn((request) => {
        if (request.cursor) return new Promise((resolve) => { resolveMore = resolve; });
        return Promise.resolve({ rows: [request.filters.query ? second! : first!], snapshotRevision: request.filters.query ? "new" : "old", nextCursor: "next" });
      }),
    };
    const { rerender } = render(<ControllerProbe dataSource={dataSource} state={{ ...baseState, live: false }} />);
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe(first!.id));

    act(() => screen.getByRole("button", { name: "load more" }).click());
    await waitFor(() => expect(screen.getByTestId("fetching-more").textContent).toBe("true"));
    rerender(<ControllerProbe dataSource={dataSource} state={{ ...baseState, filters: { ...defaultInfiniteLogFilters, query: "new" }, live: false }} />);

    await waitFor(() => expect(screen.getByTestId("rows").textContent).toBe(second!.id));
    expect(screen.getByTestId("fetching-more").textContent).toBe("false");
    act(() => resolveMore?.({ rows: [], snapshotRevision: "old" }));
    await waitFor(() => expect(screen.getByTestId("fetching-more").textContent).toBe("false"));
  });
});
