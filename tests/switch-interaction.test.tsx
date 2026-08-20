// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Switch } from "../packages/ui/src/components/switch";

afterEach(cleanup);

function ControlledSwitch({ onChange }: { onChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <>
      <Switch
        checked={checked}
        label="同步设置"
        onCheckedChange={(nextChecked) => {
          onChange(nextChecked);
          setChecked(nextChecked);
        }}
      />
      <output>{String(checked)}</output>
    </>
  );
}

describe("Switch interactions", () => {
  it("commits exactly once when the visible switch is clicked", () => {
    const onChange = vi.fn();
    render(<ControlledSwitch onChange={onChange} />);

    fireEvent.click(screen.getByRole("switch", { name: "同步设置" }));

    expect(screen.getByText("true")).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it("commits once when its label is clicked", () => {
    const onChange = vi.fn();
    render(<ControlledSwitch onChange={onChange} />);

    fireEvent.click(screen.getByText("同步设置"));

    expect(screen.getByText("true")).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not submit an additional outer toggle for the hidden checkbox click", () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledSwitch onChange={onChange} />);
    const hiddenInput = container.querySelector('input[type="checkbox"]');

    expect(hiddenInput).not.toBeNull();
    fireEvent.click(hiddenInput!);

    expect(screen.getByText("true")).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
