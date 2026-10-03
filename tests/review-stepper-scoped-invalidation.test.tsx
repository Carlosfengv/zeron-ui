// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  Stepper, StepperContent, StepperItem, StepperList, StepperNext,
  StepperTrigger, type StepperProps,
} from "../packages/ui/src/components/stepper";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  }));
});
afterEach(cleanup);

type Step = "a" | "b" | "c";
function Steps({ disabledSteps = [], removedSteps = [], ...props }: StepperProps & {
  disabledSteps?: Step[];
  removedSteps?: Step[];
}) {
  return <Stepper defaultValue="a" {...props}>
    <StepperList>
      {(["a", "b", "c"] as const).filter((step) => !removedSteps.includes(step)).map((step) =>
        <StepperItem key={step} value={step} disabled={disabledSteps.includes(step)}>
          <StepperTrigger>{step.toUpperCase()}</StepperTrigger>
        </StepperItem>,
      )}
    </StepperList>
    <StepperContent value="a">Page A</StepperContent>
    <StepperContent value="b">Page B</StepperContent>
    <StepperContent value="c">Page C</StepperContent>
    <StepperNext>Next</StepperNext>
  </Stepper>;
}
function deferred() {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((r) => { resolve = r; });
  return { promise, resolve };
}

describe("Stepper scoped validation invalidation", () => {
  it.each([true, false])("allows unrelated disabled changes (initial disabled: %s)", async (initialDisabled) => {
    const pending = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} disabledSteps={initialDisabled ? ["c"] : []} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    view.rerender(<Steps {...props} disabledSteps={initialDisabled ? [] : ["c"]} />);
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it("allows the validator to unlock a future step before resolving", async () => {
    const changed = vi.fn();
    function UnlockingSteps() {
      const [disabledC, setDisabledC] = React.useState(true);
      return <Steps disabledSteps={disabledC ? ["c"] : []} onValueChange={changed}
        onValidate={async () => {
          setDisabledC(false);
          await Promise.resolve();
          return true;
        }} />;
    }
    render(<UnlockingSteps />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Next" })); });
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });

  it.each(["a", "b"] as const)("does not revive navigation after endpoint %s is disabled and re-enabled", async (endpoint) => {
    const pending = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    view.rerender(<Steps {...props} disabledSteps={[endpoint]} />);
    view.rerender(<Steps {...props} />);
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
  });

  it.each(["a", "b", "c"] as const)("scopes removal and re-addition of %s to the pending endpoints", async (step) => {
    const pending = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    view.rerender(<Steps {...props} removedSteps={[step]} />);
    view.rerender(<Steps {...props} />);
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual(step === "c" ? [["b"]] : []);
  });

  it("does not revive navigation after the root is disabled and re-enabled", async () => {
    const pending = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    view.rerender(<Steps {...props} disabled />);
    view.rerender(<Steps {...props} />);
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });

  it("does not let an older settled request clear a newer request's endpoint guard", async () => {
    const b = deferred();
    const c = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: (value: string) => value === "b" ? b.promise : c.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    fireEvent.click(screen.getByRole("tab", { name: "C" }));
    await act(async () => { b.resolve(true); });
    view.rerender(<Steps {...props} disabledSteps={["c"]} />);
    view.rerender(<Steps {...props} />);
    await act(async () => { c.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });

  it("allows the newest request despite a disabled change to the older target", async () => {
    const b = deferred();
    const c = deferred();
    const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: (value: string) => value === "b" ? b.promise : c.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    fireEvent.click(screen.getByRole("tab", { name: "C" }));
    view.rerender(<Steps {...props} disabledSteps={["b"]} />);
    await act(async () => { c.resolve(true); });
    await act(async () => { b.resolve(true); });
    expect(changed.mock.calls).toEqual([["c"]]);
  });
});
