// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentTasks, agentTasksChineseLabels, agentTasksDemoData, type AgentTask } from "@zeron/blocks/agent-tasks-01";
import { AgentTasksDemo } from "@docs/components/blocks/AgentTasksDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((media: string) => ({ matches: false, media, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("AgentTasks demo", () => {
  it("labels its creation field uniquely and only adds nonblank tasks", async () => {
    render(<><input id="agent-task-title" aria-label="Existing host input" /><AgentTasksDemo /></>);
    fireEvent.click(screen.getByRole("button", { name: "New task" }));
    const input = screen.getByRole("textbox", { name: "Task name" });
    expect(input).not.toBe(document.getElementById("agent-task-title"));
    fireEvent.change(input, { target: { value: "   " } });
    expect((screen.getByRole("button", { name: "Create task" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByRole("textbox", { name: "Task name" })).toBeTruthy();
    fireEvent.change(input, { target: { value: "  Verify accessibility  " } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByRole("tab", { name: "All 8" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("1 needs you · 5 running");
    expect(screen.getByRole("button", { name: /Verify accessibility/ }).getAttribute("aria-expanded")).toBe("true");
    expect(agentTasksDemoData).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Verify accessibility" })).toBeTruthy();
    expect(within(screen.getByRole("dialog")).getByText("Local demo task created")).toBeTruthy();
  });
});

describe("AgentTasks", () => {
  it("derives counts, groups failures with pending attention, and filters locally", () => {
    const pending: AgentTask = { id: "pending", title: "Approve deployment", model: "Opus", duration: "1m", status: "needs-you" };
    render(<AgentTasks tasks={[...agentTasksDemoData, pending]} />);
    expect(screen.getByRole("tab", { name: "All 8" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("2 needs you · 4 running");
    fireEvent.click(screen.getByRole("tab", { name: "Needs you 2" }));
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText(pending.title)).toBeTruthy();
    expect(within(panel).getByText(agentTasksDemoData[0].title)).toBeTruthy();
    expect(within(panel).queryByText(agentTasksDemoData[1].title)).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Done 2" }));
    expect(within(screen.getByRole("tabpanel")).getAllByRole("button")).toHaveLength(2);
  });

  it("emits controlled selection and expansion intent while waiting for host updates", () => {
    const onFilterChange = vi.fn();
    const onExpandedTaskChange = vi.fn();
    const { rerender } = render(<AgentTasks tasks={agentTasksDemoData} filter="all" expandedTaskId={null} onFilterChange={onFilterChange} onExpandedTaskChange={onExpandedTaskChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Running 4" }));
    expect(onFilterChange).toHaveBeenCalledWith("running");
    expect(screen.getByRole("tab", { name: "All 7" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Migrate users table/ }));
    expect(onExpandedTaskChange).toHaveBeenCalledWith("migration");
    expect(screen.queryByRole("list", { name: "Task activity" })).toBeNull();
    rerender(<AgentTasks tasks={agentTasksDemoData} filter="running" expandedTaskId="migration" onExpandedTaskChange={onExpandedTaskChange} />);
    expect(screen.getByRole("list", { name: "Task activity" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Migrate users table/ }));
    expect(onExpandedTaskChange).toHaveBeenLastCalledWith(null);
  });

  it("expands locally, preserves expansion through filters, and wires host actions", () => {
    const onOpenTask = vi.fn();
    const onNewTask = vi.fn();
    render(<AgentTasks tasks={agentTasksDemoData} defaultExpandedTaskId="migration" onOpenTask={onOpenTask} onNewTask={onNewTask} />);
    expect(within(screen.getByRole("list", { name: "Task activity" })).getAllByRole("listitem")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(onOpenTask).toHaveBeenCalledWith(agentTasksDemoData[1]);
    fireEvent.click(screen.getByRole("button", { name: "New task" }));
    expect(onNewTask).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("tab", { name: "Done 2" }));
    fireEvent.click(screen.getByRole("tab", { name: "All 7" }));
    expect(screen.getByRole("list", { name: "Task activity" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Migrate users table/ }));
    expect(screen.queryByRole("list", { name: "Task activity" })).toBeNull();
  });

  it("disables missing host actions and supports tasks without activity", () => {
    render(<AgentTasks tasks={agentTasksDemoData} defaultExpandedTaskId="review" />);
    expect(screen.getByText("No activity yet.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Open" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "New task" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("updates counts from host data and localizes empty views", () => {
    const { rerender } = render(<AgentTasks tasks={agentTasksDemoData} />);
    rerender(<AgentTasks tasks={[]} labels={agentTasksChineseLabels} />);
    expect(screen.getByRole("region", { name: "Agent 任务" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "全部 0" })).toBeTruthy();
    expect(screen.getByText("此分类暂无任务。")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("0 项待处理 · 0 项运行中");
  });

  it("keeps disclosure relationships valid for arbitrary host IDs and multiple instances", () => {
    const task: AgentTask = { ...agentTasksDemoData[1], id: "任务 / review #482" };
    const onOpenTask = vi.fn();
    render(<><AgentTasks tasks={[task]} defaultExpandedTaskId={task.id} onOpenTask={onOpenTask} /><AgentTasks tasks={[task]} defaultExpandedTaskId={task.id} /></>);
    const triggers = screen.getAllByRole("button", { name: /Migrate users table/ });
    const targets = triggers.map((trigger) => {
      const controls = trigger.getAttribute("aria-controls")!;
      expect(controls.split(/\s+/)).toHaveLength(1);
      const details = document.getElementById(controls);
      expect(details).not.toBeNull();
      expect(details?.getAttribute("aria-labelledby")).toBe(trigger.id);
      return controls;
    });
    expect(new Set(targets).size).toBe(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
    expect(onOpenTask).toHaveBeenCalledWith(task);
  });
});
