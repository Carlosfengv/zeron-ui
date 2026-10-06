// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});
