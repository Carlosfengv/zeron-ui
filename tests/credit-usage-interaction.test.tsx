// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CreditUsage,
} from "../packages/blocks/src/application/credit-usage-01/credit-usage";
import { creditUsageDemoData } from "../packages/blocks/src/application/credit-usage-01/credit-usage-demo-data";
import type { CreditUsageData } from "../packages/blocks/src/application/credit-usage-01/credit-usage-types";

afterEach(cleanup);

describe("Credit Usage 01 interactions", () => {
  it("derives totals and switches between billing cycles", () => {
    const onCycleChange = vi.fn();
    const { container } = render(
      <CreditUsage
        actions={{ onCycleChange }}
        data={creditUsageDemoData}
      />,
    );

    expect(screen.getByText("71%")).toBeTruthy();
    expect(screen.getByText(/3,560 of 5,000/)).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("3560");
    expect(
      container.querySelectorAll('[data-slot="credit-usage-model-logo"]'),
    ).toHaveLength(5);

    fireEvent.click(screen.getByRole("tab", { name: "Last cycle" }));

    expect(onCycleChange).toHaveBeenCalledWith("previous");
    expect(screen.getByText("86%")).toBeTruthy();
    expect(screen.getByText(/4,284 of 5,000/)).toBeTruthy();
  });

  it("routes every visible setting action through caller callbacks", () => {
    const onAutoSwitchChange = vi.fn();
    const onSetLimit = vi.fn();
    const onUpgrade = vi.fn();
    render(
      <CreditUsage
        actions={{ onAutoSwitchChange, onSetLimit, onUpgrade }}
        data={creditUsageDemoData}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", { name: "Auto-switch to Claude Sonnet 5 at 90%" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Set a limit" }));
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Ultra/ }));

    expect(onAutoSwitchChange).toHaveBeenCalledWith(false);
    expect(onSetLimit).toHaveBeenCalledOnce();
    expect(onUpgrade).toHaveBeenCalledOnce();
  });

  it("hides absent actions and exposes operation errors", () => {
    render(
      <CreditUsage
        data={creditUsageDemoData}
        operationState={{ error: "Credit settings could not be updated." }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Set a limit" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Upgrade to Ultra/ })).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "Credit settings could not be updated.",
    );
  });

  it("normalizes invalid credit values consistently", () => {
    const data: CreditUsageData = {
      ...creditUsageDemoData,
      totalCredits: 100,
      currentCycle: {
        resetAt: "Sep 19",
        models: [
          { id: "negative", name: "Negative model", credits: -20, color: "blue" },
          { id: "valid", name: "Valid model", credits: 40, color: "green" },
        ],
      },
      previousCycle: undefined,
    };

    render(<CreditUsage data={data} />);

    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.queryByText("-20")).toBeNull();
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("40");
  });

  it("treats positive usage against a zero allowance as fully consumed", () => {
    const data: CreditUsageData = {
      ...creditUsageDemoData,
      totalCredits: 0,
      currentCycle: {
        resetAt: "Sep 19",
        models: [
          { id: "metered", name: "Metered model", credits: 25, color: "blue" },
        ],
      },
      previousCycle: undefined,
    };

    render(<CreditUsage data={data} />);

    expect(screen.getByText("100%")).toBeTruthy();
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("25");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("25");
  });

  it("keeps overage and empty states internally consistent", () => {
    const overageData: CreditUsageData = {
      ...creditUsageDemoData,
      totalCredits: 20,
      currentCycle: {
        resetAt: "Sep 19",
        models: [
          { id: "overage", name: "Overage model", credits: 25, color: "orange" },
        ],
      },
      previousCycle: undefined,
    };
    const { rerender } = render(<CreditUsage data={overageData} />);

    expect(screen.getByText("125%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("25");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("25");

    rerender(
      <CreditUsage
        data={{
          ...overageData,
          totalCredits: 100,
          currentCycle: { resetAt: "Sep 19", models: [] },
        }}
      />,
    );

    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.getByText("No model usage in this cycle.")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
  });

  it("supports complete localized sentence formatting", () => {
    const usageSummary = vi.fn(() => "本周期已使用 3,560 / 5,000，9 月 19 日重置");
    const progressValueText = vi.fn(() => "已使用 3,560，共 5,000 点额度");
    const autoSwitchTitle = vi.fn(() => "达到 90% 时切换至 Claude Sonnet 5");

    render(
      <CreditUsage
        data={creditUsageDemoData}
        formatters={{ autoSwitchTitle, progressValueText, usageSummary }}
      />,
    );

    expect(screen.getByText("本周期已使用 3,560 / 5,000，9 月 19 日重置")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
      "已使用 3,560，共 5,000 点额度",
    );
    expect(
      screen.getByRole("switch", { name: "达到 90% 时切换至 Claude Sonnet 5" }),
    ).toBeTruthy();
    expect(usageSummary).toHaveBeenCalledWith({
      usedCredits: "3,560",
      totalCredits: "5,000",
      resetAt: "Sep 19",
      resets: "resets",
    });
    expect(progressValueText).toHaveBeenCalledWith({
      usedCredits: "3,560",
      totalCredits: "5,000",
      credits: "credits",
    });
    expect(autoSwitchTitle).toHaveBeenCalledOnce();
  });

  it("keeps cycle selection caller-controlled", () => {
    const onCycleChange = vi.fn();
    render(
      <CreditUsage
        actions={{ onCycleChange }}
        cycle="current"
        data={creditUsageDemoData}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Last cycle" }));

    expect(onCycleChange).toHaveBeenCalledWith("previous");
    expect(screen.getByText("71%")).toBeTruthy();
    expect(screen.queryByText("86%")).toBeNull();
  });

  it("disables unavailable and pending operations", () => {
    const data: CreditUsageData = {
      ...creditUsageDemoData,
      previousCycle: undefined,
    };

    render(
      <CreditUsage
        actions={{
          onAutoSwitchChange: vi.fn(),
          onSetLimit: vi.fn(),
          onUpgrade: vi.fn(),
        }}
        data={data}
        operationState={{ pending: ["auto-switch", "set-limit", "upgrade"] }}
      />,
    );

    expect(
      screen.getByRole("tab", { name: "Last cycle" }).getAttribute("aria-disabled"),
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: /Auto-switch to Claude Sonnet 5/ })
        .hasAttribute("data-disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Set a limit" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: /Upgrade to Ultra/ }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
