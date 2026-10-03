// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Stepper, StepperContent, StepperItem, StepperList, StepperTrigger,
  type StepperProps,
} from "../packages/ui/src/components/stepper";

afterEach(cleanup);

type Step = "a" | "b" | "c";
type StepsProps = StepperProps & {
  disabledSteps?: Step[];
  removedSteps?: Step[];
  triggerDisabled?: boolean;
  onAutoFocus?: React.FocusEventHandler<HTMLButtonElement>;
  focusOnListMount?: boolean;
};

function Steps({
  disabledSteps = [], removedSteps = [], triggerDisabled = false,
  onAutoFocus, focusOnListMount = false, ...props
}: StepsProps) {
  return <>
    <Stepper defaultValue="a" {...props}>
      <StepperList ref={focusOnListMount ? (node) => {
        node?.querySelector<HTMLButtonElement>("[data-autofocus-target]")?.focus();
      } : undefined}>
        {(["a", "b", "c"] as const).filter((step) => !removedSteps.includes(step)).map((step) =>
          <StepperItem key={step} value={step} disabled={disabledSteps.includes(step)}>
            <StepperTrigger autoFocus={step === "b" && !focusOnListMount}
              data-autofocus-target={step === "b" ? "" : undefined}
              disabled={step === "b" && triggerDisabled}
              onFocus={step === "b" ? onAutoFocus : undefined}>
              {step.toUpperCase()}
            </StepperTrigger>
          </StepperItem>,
        )}
      </StepperList>
      <StepperContent value="a">Page A</StepperContent>
      <StepperContent value="b">Page B</StepperContent>
      <StepperContent value="c">Page C</StepperContent>
    </Stepper>
    <button>Outside</button>
  </>;
}

function deferred() {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((r) => { resolve = r; });
  return { promise, resolve };
}

function ClickOnMountSteps(props: StepsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    rootRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[2]?.click();
  }, []);
  return <div ref={rootRef}><Steps {...props} /></div>;
}

async function flushFocus() {
  await act(async () => {});
}

describe("Stepper native autoFocus", () => {
  it.each([false, true])("activates an uncontrolled step after registration (StrictMode: %s)", async (strict) => {
    const changed = vi.fn();
    const content = <Steps onValueChange={changed} />;
    render(strict ? <React.StrictMode>{content}</React.StrictMode> : content);
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "B" }));
    await flushFocus();
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it.each([false, true])("requests a controlled value exactly once (validator: %s)", async (withValidator) => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps value="a" onValueChange={changed} onValidate={withValidator ? validate : undefined} />);
    await flushFocus();
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(validate.mock.calls).toEqual(withValidator ? [["b", "next"]] : []);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it("updates a controlled consumer that commits the requested value", async () => {
    const changed = vi.fn();
    function ControlledSteps() {
      const [value, setValue] = React.useState("a");
      return <Steps value={value} onValueChange={(next) => { changed(next); setValue(next); }} />;
    }
    render(<ControlledSteps />);
    await flushFocus();
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it.each([false, true])("waits for initial asynchronous validation after layout effects (StrictMode: %s)", async (strict) => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn(() => pending.promise);
    const content = <Steps onValueChange={changed} onValidate={validate} />;
    render(strict ? <React.StrictMode>{content}</React.StrictMode> : content);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it.each([false, true])("requests the controlled value once after asynchronous validation (StrictMode: %s)", async (strict) => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn(() => pending.promise);
    const content = <Steps value="a" onValueChange={changed} onValidate={validate} />;
    render(strict ? <React.StrictMode>{content}</React.StrictMode> : content);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it.each([false, true])("accepts callback-ref focus after item registration but before root layout (StrictMode: %s)", async (strict) => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    const content = <Steps focusOnListMount onValueChange={changed} onValidate={validate} />;
    render(strict ? <React.StrictMode>{content}</React.StrictMode> : content);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it("waits for asynchronous validation triggered by initial callback-ref focus", async () => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn(() => pending.promise);
    render(<Steps focusOnListMount value="a" onValueChange={changed} onValidate={validate} />);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["b"]]);
  });

  it.each(["reject", "throw"] as const)("does not activate when initial validation returns %s", async (result) => {
    const changed = vi.fn();
    const validate = vi.fn(async () => {
      if (result === "throw") throw new Error("Validation failed");
      return false;
    });
    render(<Steps onValueChange={changed} onValidate={validate} />);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it.each(["a", "c"] as const)("derives direction from the registered order starting at %s", async (value) => {
    const validate = vi.fn(() => true);
    render(<Steps defaultValue={value} onValidate={validate} />);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", value === "a" ? "next" : "prev"]]);
  });

  it("uses the latest controlled source value before processing initial focus", async () => {
    const validate = vi.fn(() => true);
    const changed = vi.fn();
    const view = render(<Steps value="a" onValidate={validate} onValueChange={changed} />);
    view.rerender(<Steps value="c" onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "prev"]]);
    expect(changed.mock.calls).toEqual([["b"]]);
  });

  it("does not validate the already active step", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps defaultValue="b" onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  const inactiveCases: [string, Partial<StepsProps>][] = [
    ["disabled root", { disabled: true }],
    ["disabled item", { disabledSteps: ["b"] }],
    ["disabled trigger", { triggerDisabled: true }],
    ["manual activation", { activationMode: "manual" }],
    ["non-interactive root", { nonInteractive: true }],
  ];

  it.each(inactiveCases)("does not activate an initially %s", async (_name, props) => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps {...props} onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it.each(inactiveCases)("rechecks %s before processing deferred focus", async (_name, props) => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    const view = render(<Steps onValidate={validate} onValueChange={changed} />);
    view.rerender(<Steps {...props} onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("honors a prevented native focus event", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps onAutoFocus={(event) => event.preventDefault()}
      onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("discards initial focus after focus moves outside before deferred handling", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps onValidate={validate} onValueChange={changed} />);
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("does not duplicate validation when focus leaves and returns before deferred handling", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps value="a" onValidate={validate} onValueChange={changed} />);
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    act(() => screen.getByRole("tab", { name: "B" }).focus());
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    expect(changed.mock.calls).toEqual([["b"]]);
  });

  it("discards deferred focus when the target is removed", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    const view = render(<Steps onValidate={validate} onValueChange={changed} />);
    view.rerender(<Steps removedSteps={["b"]} onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("discards deferred focus when the root unmounts", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    const view = render(<Steps onValidate={validate} onValueChange={changed} />);
    view.unmount();
    await flushFocus();
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it("does not notify after unmount during initial asynchronous validation", async () => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn(() => pending.promise);
    const view = render(<Steps onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate).toHaveBeenCalledTimes(1);
    view.unmount();
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });

  const interruptedCases: [string, Partial<StepsProps>][] = [
    ["disabled source", { disabledSteps: ["a"] }],
    ["disabled target", { disabledSteps: ["b"] }],
    ["removed source", { removedSteps: ["a"] }],
    ["removed target", { removedSteps: ["b"] }],
    ["disabled root", { disabled: true }],
    ["new controlled value", { value: "c" }],
  ];

  it.each(interruptedCases)("does not revive initial asynchronous validation after %s", async (_name, interruption) => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn(() => pending.promise);
    const props = { onValidate: validate, onValueChange: changed };
    const view = render(<Steps {...props} />);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["b", "next"]]);
    view.rerender(<Steps {...props} {...interruption} />);
    view.rerender(<Steps {...props} />);
    // Re-adding an auto-focused target is a new navigation intent of its own.
    if (interruption.removedSteps?.includes("b")) {
      act(() => screen.getByRole("button", { name: "Outside" }).focus());
    }
    await act(async () => { pending.resolve(true); });
    expect(validate).toHaveBeenCalledTimes(1);
    expect(changed).not.toHaveBeenCalled();
  });

  it("keeps a newer focus request when the initial validator resolves late", async () => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn((value: string) => value === "b" ? pending.promise : true);
    render(<Steps onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    act(() => screen.getByRole("tab", { name: "C" }).focus());
    await flushFocus();
    await act(async () => { pending.resolve(true); });
    expect(validate.mock.calls).toEqual([["b", "next"], ["c", "next"]]);
    expect(changed.mock.calls).toEqual([["c"]]);
  });

  it("does not replace a newer click request with deferred initial focus", async () => {
    const changed = vi.fn();
    const validate = vi.fn(() => true);
    render(<Steps onValidate={validate} onValueChange={changed} />);
    const target = screen.getByRole("tab", { name: "C" });
    fireEvent.mouseDown(target);
    act(() => target.focus());
    fireEvent.click(target);
    await flushFocus();
    expect(validate.mock.calls).toEqual([["c", "next"]]);
    expect(changed.mock.calls).toEqual([["c"]]);
  });

  it("does not overwrite a newer mount-layout click that leaves initial focus in place", async () => {
    const changed = vi.fn();
    render(<ClickOnMountSteps onValueChange={changed} />);
    await flushFocus();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "B" }));
    expect(changed.mock.calls).toEqual([["c"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page C");
  });

  it.each([false, true])("yields to a newer validated mount-layout click (accepted: %s)", async (accepted) => {
    const changed = vi.fn();
    const validate = vi.fn((value: string) => value === "c" && accepted);
    render(<ClickOnMountSteps value="a" onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate.mock.calls.map(([value]) => value)).toEqual(["c"]);
    expect(changed.mock.calls).toEqual(accepted ? [["c"]] : []);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it("does not supersede a newer pending mount-layout click with deferred initial focus", async () => {
    const pending = deferred();
    const changed = vi.fn();
    const validate = vi.fn((value: string) => value === "c" ? pending.promise : true);
    render(<ClickOnMountSteps onValidate={validate} onValueChange={changed} />);
    await flushFocus();
    expect(validate.mock.calls.map(([value]) => value)).toEqual(["c"]);
    expect(changed).not.toHaveBeenCalled();
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["c"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page C");
  });
});
