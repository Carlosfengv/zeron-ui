// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu, DropdownContent, DropdownTrigger } from "../packages/ui/src/components/dropdown";
import { MenuItem } from "../packages/ui/src/components/menu-item";
import { Button } from "../packages/ui/src/components/button";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(cleanup);

describe("菜单动作由 primitive 处理鼠标及键盘激活", () => {
  for (const radio of [false, true]) for (const key of ["pointer", "Enter", " "]) {
    it(`${radio ? "单选" : "动作"}项通过 ${key} 只执行一次回调`, async () => {
      const onSelect = vi.fn();
      const onClick = vi.fn();
      render(<DropdownMenu><DropdownTrigger render={<Button>打开菜单</Button>} /><DropdownContent checkedIndex={radio ? 0 : undefined}><MenuItem index={0} label="原选项" checked={radio ? true : undefined} /><MenuItem index={1} label="目标选项" checked={radio ? false : undefined} onSelect={onSelect} onClick={onClick} /></DropdownContent></DropdownMenu>);
      fireEvent.click(screen.getByRole("button", { name: "打开菜单" }));
      const item = await screen.findByRole(radio ? "menuitemradio" : "menuitem", { name: "目标选项" });
      if (key === "pointer") fireEvent.click(item);
      else { item.focus(); fireEvent.keyDown(item, { key }); fireEvent.keyUp(item, { key }); }
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  }
  it("禁用项不执行动作", async () => {
    const onSelect = vi.fn();
    render(<DropdownMenu><DropdownTrigger render={<Button>打开菜单</Button>} /><DropdownContent><MenuItem index={0} label="禁用选项" disabled onSelect={onSelect} /></DropdownContent></DropdownMenu>);
    fireEvent.click(screen.getByRole("button", { name: "打开菜单" }));
    const item = await screen.findByRole("menuitem", { name: "禁用选项" });
    fireEvent.click(item); fireEvent.keyDown(item, { key: "Enter" });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("退场期间重新打开不会被旧的卸载回调关闭", async () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>重新打开</button>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownTrigger render={<Button>菜单</Button>} />
          <DropdownContent><MenuItem index={0} label="选项" /></DropdownContent>
        </DropdownMenu></>;
    }
    render(<Demo />);
    fireEvent.click(screen.getByRole("button", { name: "菜单" }));
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "重新打开" }));
    await screen.findByRole("menu");
    // Longer than both the exit and its background-tab fallback.
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "菜单" }));
  });

  it("默认打开时 ref 指向语义菜单并在卸载时执行 React 19 清理", async () => {
    const onCleanup = vi.fn();
    const menuRef = vi.fn((_node: HTMLDivElement | null) => onCleanup);
    const { unmount } = render(<DropdownMenu defaultOpen>
      <DropdownTrigger render={<Button>默认菜单</Button>} />
      <DropdownContent ref={menuRef}><MenuItem index={0} label="默认选项" /></DropdownContent>
    </DropdownMenu>);
    const menu = await screen.findByRole("menu");
    expect(menuRef.mock.calls.some(([node]) => node === menu)).toBe(true);
    expect(menu.getAttribute("data-surface")).toBeTruthy();
    unmount();
    expect(onCleanup).toHaveBeenCalled();
  });
});
