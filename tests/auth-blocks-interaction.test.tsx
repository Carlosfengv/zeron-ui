// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Login01 } from "../packages/blocks/src/application/login-01/login-01";
import { Signup01 } from "../packages/blocks/src/application/signup-01/signup-01";

afterEach(cleanup);

describe("authentication block interactions", () => {
  it("uses the shared AuthLayout anatomy and large control contracts", () => {
    const { container, rerender } = render(<Login01 />);

    const assertAnatomy = () => {
      const content = container.querySelector(
        '[data-slot="auth-layout-content"]'
      );
      expect(
        Array.from(content?.children ?? []).map((element) =>
          element.getAttribute("data-slot")
        )
      ).toEqual([
        "auth-layout-header",
        "auth-layout-body",
        "auth-layout-footer",
      ]);

      for (const input of container.querySelectorAll('[data-slot="input"]')) {
        expect(input.getAttribute("data-size")).toBe("lg");
      }
      for (const button of container.querySelectorAll('[data-slot="button"]')) {
        expect(button.classList.contains("h-control-lg")).toBe(true);
      }
    };

    assertAnatomy();
    expect(
      container
        .querySelector('[data-slot="auth-layout-body"]')
        ?.classList.contains("border-[0.5px]")
    ).toBe(true);

    for (const name of ["Login with Apple", "Login with Google"]) {
      const button = screen.getByRole("button", { name });
      expect(
        button.querySelector('[data-slot="button-leading-icon"]')
      ).not.toBeNull();
      expect(
        button
          .querySelector('[data-slot="button-background"]')
          ?.classList.contains("border-border")
      ).toBe(true);
    }

    rerender(<Signup01 />);
    assertAnatomy();
    expect(
      container
        .querySelector('[data-slot="auth-layout-body"]')
        ?.classList.contains("border-[0.5px]")
    ).toBe(false);
  });

  it("submits login credentials through the integration callback", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<Login01 onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "correct-horse",
      });
    });
  });

  it("routes login provider actions independently", async () => {
    const onAppleLogin = vi.fn();
    const onGoogleLogin = vi.fn();
    render(
      <Login01 onAppleLogin={onAppleLogin} onGoogleLogin={onGoogleLogin} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Login with Apple" }));
    await waitFor(() => expect(onAppleLogin).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Login with Google" }));
    await waitFor(() => expect(onGoogleLogin).toHaveBeenCalledOnce());
  });

  it("submits signup email and exposes external validation state", async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <Signup01 errors={{ email: "Use a work email." }} onSubmit={onSubmit} />
    );

    expect(screen.getByText("Use a work email.").getAttribute("data-slot")).toBe(
      "field-error"
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@company.com" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: "person@company.com" });
    });
  });

  it("disables every signup path while an action is pending", () => {
    render(<Signup01 pendingAction="google" />);

    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(
      true
    );
  });
});
