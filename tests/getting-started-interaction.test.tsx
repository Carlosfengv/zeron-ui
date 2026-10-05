// @vitest-environment jsdom

import { useState } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GettingStarted, gettingStartedDemoTasks } from "@zeron/blocks/getting-started-01";
import { GettingStartedDemo } from "../docs/components/blocks/GettingStartedDemo";

Object.defineProperty(Element.prototype, "getAnimations", { configurable: true, writable: true, value: () => [] });

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.spyOn(Element.prototype, "getAnimations").mockReturnValue([]);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const setupName = "Getting started, 2 of 5 tasks completed";

describe("GettingStarted", () => {
  it("renders completed checks and task numbers before hydration", () => {
    const markup = document.createElement("div");
    markup.innerHTML = renderToString(<GettingStarted tasks={gettingStartedDemoTasks} />);
    const markers = Array.from(markup.querySelectorAll('[role="img"]'));
    expect(markers.slice(0, 2).every((marker) => marker.querySelector("svg") !== null && marker.textContent === "")).toBe(true);
    expect(markers.slice(0, 3).every((marker) => marker.getAttribute("data-state") !== "inactive")).toBe(true);
    expect(markers.slice(2).map((marker) => marker.textContent)).toEqual(["3", "4", "5"]);
  });

  it("opens by default and collapses locally even when a change observer is supplied", async () => {
    const changed = vi.fn();
    render(<GettingStarted tasks={gettingStartedDemoTasks} onOpenChange={changed} />);
    const trigger = screen.getByRole("button", { name: setupName });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(trigger);
    expect(changed).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(trigger.getAttribute("aria-expanded")).toBe("false"));
    await waitFor(() => expect(screen.queryByRole("list")).toBeNull());
    fireEvent.click(trigger);
    expect(changed).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(5));
  });

  it("honors a controlled value until the host accepts a requested change", () => {
    const changed = vi.fn();
    const view = render(<GettingStarted tasks={gettingStartedDemoTasks} open={false} onOpenChange={changed} />);
    const trigger = screen.getByRole("button", { name: setupName });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(changed).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    view.rerender(<GettingStarted tasks={gettingStartedDemoTasks} open onOpenChange={changed} />);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("updates nonconsecutive completion from caller data without treating earlier steps as completed", () => {
    const tasks = gettingStartedDemoTasks.map((task, index) => ({ ...task, status: index === 4 ? "completed" as const : index === 3 ? "current" as const : "pending" as const }));
    const view = render(<GettingStarted tasks={tasks} />);
    expect(screen.getByRole("button", { name: "Getting started, 1 of 5 tasks completed" })).toBeTruthy();
    expect(screen.getAllByLabelText("Completed")).toHaveLength(1);
    expect(screen.getAllByLabelText("Not completed")).toHaveLength(3);
    expect(screen.getByRole("img", { name: "Completed" }).getAttribute("data-state")).toBe("completed");
    expect(screen.getByRole("img", { name: "Current step" }).getAttribute("data-state")).toBe("active");
    expect(screen.getAllByRole("img", { name: "Not completed" }).every((marker) => marker.getAttribute("data-state") === "inactive")).toBe(true);
    view.rerender(<GettingStarted tasks={gettingStartedDemoTasks} />);
    expect(screen.getByRole("button", { name: setupName })).toBeTruthy();
    expect(screen.getAllByLabelText("Completed")).toHaveLength(2);
  });

  it("keeps header and content as direct Container children and removes folded actions from accessibility", () => {
    const view = render(<GettingStarted tasks={gettingStartedDemoTasks} onTaskAction={vi.fn()} />);
    const frame = view.container.querySelector('[data-slot="container"]')!;
    expect(Array.from(frame.children).map((child) => child.getAttribute("data-slot"))).toEqual(["container-header", "container-body"]);
    const trigger = screen.getByRole("button", { name: setupName });
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(panel.hidden).toBe(false);
    fireEvent.click(trigger);
    expect(panel.hidden).toBe(true);
    expect(screen.queryByRole("button", { name: "Set budget & rules" })).toBeNull();
  });

  it("calls the host action once and retains completion until tasks change", () => {
    const action = vi.fn();
    render(<GettingStarted tasks={gettingStartedDemoTasks} onTaskAction={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Set budget & rules" }));
    expect(action).toHaveBeenCalledExactlyOnceWith("budget");
    expect(screen.getByRole("button", { name: setupName })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create your profile" })).toBeNull();
    expect(screen.getAllByRole("listitem")[2].getAttribute("aria-current")).toBe("step");
  });

  it("prefers a real link over the callback and makes a disabled link a native disabled button", () => {
    const action = vi.fn();
    const task = { id: "setup", title: "Open setup", status: "current" as const, href: "/setup" };
    const view = render(<GettingStarted tasks={[task]} onTaskAction={action} />);
    const link = screen.getByRole("link", { name: "Open setup" });
    expect(link.getAttribute("href")).toBe("/setup");
    fireEvent.click(link);
    expect(action).not.toHaveBeenCalled();
    view.rerender(<GettingStarted tasks={[{ ...task, disabled: true }]} onTaskAction={action} />);
    expect(screen.queryByRole("link")).toBeNull();
    const button = screen.getByRole("button", { name: "Open setup" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(action).not.toHaveBeenCalled();
  });

  it("disables callbacks and leaves tasks with no entry static", () => {
    const action = vi.fn();
    const task = { id: "setup", title: "Setup", status: "pending" as const, disabled: true };
    const view = render(<GettingStarted tasks={[task]} onTaskAction={action} />);
    fireEvent.click(screen.getByRole("button", { name: "Setup" }));
    expect(action).not.toHaveBeenCalled();
    view.rerender(<GettingStarted tasks={[task]} />);
    expect(screen.queryByRole("button", { name: "Setup" })).toBeNull();
    expect(screen.getByText("Setup")).toBeTruthy();
  });

  it("handles empty, all-complete and localized counts without hiding the block", () => {
    const view = render(<GettingStarted tasks={[]} labels={{ empty: "暂无入门任务。", progress: (count, total) => `已完成 ${count} 项，共 ${total} 项` }} />);
    expect(screen.getByText("暂无入门任务。")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Getting started, 已完成 0 项，共 0 项" })).toBeTruthy();
    view.rerender(<GettingStarted tasks={gettingStartedDemoTasks.map((task) => ({ ...task, status: "completed" }))} />);
    expect(screen.getByRole("button", { name: "Getting started, 5 of 5 tasks completed" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("supports host-driven folding and stable per-instance panels", () => {
    function Host() {
      const [open, setOpen] = useState(false);
      return <><GettingStarted tasks={[]} open={open} onOpenChange={setOpen} /><GettingStarted title="Another setup" tasks={[]} /></>;
    }
    render(<Host />);
    const first = screen.getByRole("button", { name: "Getting started, 0 of 0 tasks completed" });
    const second = screen.getByRole("button", { name: "Another setup, 0 of 0 tasks completed" });
    expect(first.getAttribute("aria-controls")).not.toBe(second.getAttribute("aria-controls"));
    fireEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("demonstrates explicit completion, empty state and reset through the host", async () => {
    render(<NextIntlClientProvider locale="en" messages={{}}><GettingStartedDemo /></NextIntlClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Invite creators" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete example task" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Getting started, 3 of 5 tasks completed" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Empty list" }));
    expect(screen.getByText("No setup tasks yet.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(screen.getByRole("button", { name: setupName })).toBeTruthy();
  });
});
