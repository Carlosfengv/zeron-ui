// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeploymentDetail } from "../packages/blocks/src/application/deployment-detail-01/deployment-detail";
import { deploymentDetailDemoData as data } from "../packages/blocks/src/application/deployment-detail-01/deployment-detail-demo-data";
import { deploymentDate, deploymentDuration, deploymentHref, deploymentIssues } from "../packages/blocks/src/application/deployment-detail-01/deployment-detail-data";
import { StatusOverview } from "../packages/ui/src/components/status-overview";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("deployment data semantics", () => {
  it("keeps deployment readiness independent of check failure and derives one issue count", () => {
    expect(data.status).toBe("ready");
    expect(deploymentIssues(data)).toMatchObject({ errors: 1, warnings: 3, complete: true, passed: false });
    render(<DeploymentDetail data={data} />);
    expect(screen.getByText("已就绪")).toBeTruthy();
    expect(screen.getByText("1 错误")).toBeTruthy();
    expect(screen.getByText("3 警告")).toBeTruthy();
    expect(screen.queryByText("所有检查已通过")).toBeNull();
  });
  it("distinguishes missing, running and successful checks", () => {
    for (const status of ["running", "pending", "unknown"] as const) {
      const running = { ...data, stages: [{ ...data.stages[2], status, issues: [] }] };
      expect(deploymentIssues(running).passed).toBe(false);
      expect(deploymentIssues(running).complete).toBe(false);
    }
    expect(deploymentIssues({ ...data, stages: [{ ...data.stages[2], status: "success", issues: undefined }] }).complete).toBe(false);
    expect(deploymentIssues({ ...data, stages: [{ ...data.stages[2], status: "success", issues: [] }] }).passed).toBe(true);
    expect(deploymentIssues({ ...data, stages: [] }).passed).toBe(false);
  });
  it("preserves zero durations and rejects invalid dates, numbers and navigation", () => {
    expect(deploymentDuration(0, "en-US")).toBe("0s");
    expect(deploymentDuration(537000, "en-US")).toBe("8m 57s");
    for (const value of [null, -1, NaN, Infinity]) expect(deploymentDuration(value, "en-US")).toBe("—");
    expect(deploymentDate(1e20, "zh-CN", "Asia/Shanghai")).toBe("—");
    expect(deploymentHref("javascript:alert(1)")).toBeUndefined();
    expect(deploymentHref("//untrusted.test")).toBeUndefined();
    expect(deploymentHref("/\\untrusted.test")).toBeUndefined();
    expect(deploymentHref("/preview?id=1")).toBe("/preview?id=1");
    render(<DeploymentDetail data={{ ...data, url: "javascript:alert(1)", shareUrl: undefined }} />);
    expect(screen.queryByRole("link", { name: "访问" })).toBeNull();
  });
});

describe("deployment interactions", () => {
  it("opens additional domains and reports a failed preview", async () => {
    render(<DeploymentDetail data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "更多域名 3" }));
    expect(await screen.findByText("www.axiom.xyz")).toBeTruthy();
    expect(screen.getByText("docs.axiom.xyz")).toBeTruthy();
    fireEvent.error(screen.getByRole("img", { name: data.preview!.alt }));
    expect(screen.getByText("暂无网站预览")).toBeTruthy();
  });
  it("copies the share URL and catches clipboard denial", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<DeploymentDetail data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    await screen.findByText("链接已复制");
    expect(writeText).toHaveBeenCalledWith(new URL(data.shareUrl!, window.location.href).href);
    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    await screen.findByText("复制失败，请重试");
  });
  it("awaits host actions, blocks repeat submits and retains details after rejection", async () => {
    let reject!: (error: Error) => void;
    const onOpenStage = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    render(<DeploymentDetail data={data} actions={{ onOpenStage }} />);
    const button = screen.getByRole("button", { name: "查看详情" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onOpenStage).toHaveBeenCalledTimes(1);
    expect(onOpenStage).toHaveBeenCalledWith(data.stages[3], data.id);
    expect(button.hasAttribute("disabled")).toBe(true);
    reject(new Error("host unavailable"));
    await screen.findByText("操作失败，请重试");
    expect(screen.getByText(data.name)).toBeTruthy();
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  });
  it("does not transfer an old deployment's pending result to a new deployment", async () => {
    let reject!: (error: Error) => void;
    const onShare = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    const view = render(<DeploymentDetail data={data} actions={{ onShare }} />);
    fireEvent.click(screen.getByRole("button", { name: "分享" }));
    view.rerender(<DeploymentDetail data={{ ...data, id: "new", name: "main-new" }} actions={{ onShare }} />);
    reject(new Error("old error"));
    await waitFor(() => expect(screen.getByRole("button", { name: "分享" }).hasAttribute("disabled")).toBe(false));
    expect(screen.queryByText("操作失败，请重试")).toBeNull();
  });
  it("keeps visit, build logs and investigation as presentation-only buttons", () => {
    const onOpenStage = vi.fn();
    render(<DeploymentDetail data={data} actions={{ onOpenStage }} />);
    for (const name of ["访问", "查看构建日志", "运行摘要", "排查问题"]) {
      const button = screen.getByRole("button", { name });
      expect(button.hasAttribute("href")).toBe(false);
      fireEvent.click(button);
    }
    expect(onOpenStage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("hides stale business values while loading/error and lets the host retry", async () => {
    const onRetry = vi.fn();
    const view = render(<DeploymentDetail data={data} state="loading" />);
    expect(screen.queryByText(data.name)).toBeNull();
    expect(screen.getByText("正在加载部署详情")).toBeTruthy();
    view.rerender(<DeploymentDetail data={data} state="error" actions={{ onRetry }} />);
    expect(screen.queryByText(data.name)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
    view.rerender(<DeploymentDetail data={data} state="stale" />);
    expect(screen.getByText(data.name)).toBeTruthy();
    expect(screen.getByText("当前显示上次快照，等待更新")).toBeTruthy();
  });
  it("retains keyboard inspection and stage outcomes in the activity trailing composition", () => {
    render(<StatusOverview ariaLabel="Build" label="Build" variant="activity" emptyContent="Unknown" content={{ type: "nodes", items: data.stages[0].segments }} summary={{ label: "Old", value: "Old summary" }} trailing={<button>Build details</button>} />);
    expect(screen.queryByText("Old summary")).toBeNull();
    const grid = screen.getByRole("grid", { name: "Build" });
    grid.focus();
    fireEvent.keyDown(grid, { key: "End" });
    expect(grid.getAttribute("aria-activedescendant")).toBe(within(grid).getAllByRole("gridcell").at(-1)!.id);
    expect(screen.getByRole("button", { name: "Build details" })).toBeTruthy();
  });
  it("does not expose trailing results or actions while a rail is loading/unavailable", () => {
    const props = { ariaLabel: "Build", label: "Build", variant: "activity" as const, emptyContent: "Unknown", content: { type: "nodes" as const, items: data.stages[0].segments }, trailing: <button>Old result</button> };
    const view = render(<StatusOverview {...props} state="loading" />);
    expect(screen.queryByRole("button", { name: "Old result" })).toBeNull();
    view.rerender(<StatusOverview {...props} state="error" statusMessage="Not available" />);
    expect(screen.queryByRole("button", { name: "Old result" })).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Not available");
    view.rerender(<StatusOverview {...props} />);
    expect(screen.getByRole("button", { name: "Old result" })).toBeTruthy();
  });
});
