// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { InfoItem, InfoItemContent, InfoItemTitle } from "@zeron/ui/info-item";

afterEach(cleanup);

it("preserves the default non-interactive row and its forwarded ref", () => {
  const ref = createRef<HTMLDivElement>();
  render(<InfoItem ref={ref}><InfoItemContent><InfoItemTitle>Document</InfoItemTitle></InfoItemContent></InfoItem>);
  expect(ref.current?.tagName).toBe("DIV");
  expect(ref.current?.textContent).toBe("Document");
  expect(screen.queryByRole("button")).toBeNull();
});

it("composes a native button ref and handlers while honoring native disabled state", () => {
  const ref = createRef<HTMLButtonElement>();
  const open = vi.fn();
  const select = vi.fn();
  const { rerender } = render(<InfoItem render={<button type="button" ref={ref} onClick={select} />} onClick={open}>Open document</InfoItem>);
  const button = screen.getByRole("button", { name: "Open document" });
  expect(ref.current).toBe(button);
  fireEvent.click(button);
  expect(open).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledTimes(1);
  rerender(<InfoItem render={<button type="button" disabled />} onClick={open}>Open document</InfoItem>);
  fireEvent.click(screen.getByRole("button", { name: "Open document" }));
  expect(open).toHaveBeenCalledTimes(1);
});
