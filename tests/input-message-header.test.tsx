// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { InputMessage } from "@zeron/ui/input-message";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("keeps header actions outside editor focus and message submission", () => {
  const open = vi.fn();
  const send = vi.fn();
  const { container } = render(<InputMessage value="Draft in progress" onValueChange={() => {}} onSend={send}
    header={<><span>2 items need review</span><button onClick={open}>Review first</button></>} />);
  const header = container.querySelector('[data-slot="container-header"]');
  const action = screen.getByRole("button", { name: "Review first" });
  expect(header?.contains(action)).toBe(true);
  action.focus();
  fireEvent.mouseDown(action);
  fireEvent.click(action);
  expect(document.activeElement).toBe(action);
  expect(open).toHaveBeenCalledTimes(1);
  expect(send).not.toHaveBeenCalled();
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Draft in progress");
});

it("retains the textarea and its draft when the header appears or disappears", () => {
  const props = { value: "Draft in progress", onValueChange: () => {} };
  const { container, rerender } = render(<InputMessage {...props} />);
  const textarea = screen.getByRole("textbox");
  expect(container.querySelector('[data-slot="container-header"]')).toBeNull();
  rerender(<InputMessage {...props} header={<span>1 item needs review</span>} />);
  expect(screen.getByRole("textbox")).toBe(textarea);
  rerender(<InputMessage {...props} />);
  expect(screen.getByRole("textbox")).toBe(textarea);
  expect(container.querySelector('[data-slot="container-header"]')).toBeNull();
});
