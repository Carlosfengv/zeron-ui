// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatScrollToLatest } from "@zeron/ui/chat-message";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("latest-content control", () => {
  it("localizes labels, preserves host overrides and never submits a composer form", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<form onSubmit={onSubmit}><ChatScrollToLatest locale="zh-CN" onClick={onClick} /></form>);
    fireEvent.click(screen.getByRole("button", { name: "回到最新内容" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<ChatScrollToLatest locale="en" onClick={onClick} />);
    expect(screen.getByRole("button", { name: "Scroll to latest" })).not.toBeNull();
    rerender(<ChatScrollToLatest label="Resume following" disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Resume following" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

});
