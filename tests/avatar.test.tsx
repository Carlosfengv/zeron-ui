// @vitest-environment jsdom

import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  AvatarWithDetails,
} from "../packages/ui/src/components/avatar";

afterEach(cleanup);

describe("Avatar", () => {
  it("renders fallback content and forwards the root ref", () => {
    const ref = createRef<HTMLSpanElement>();

    render(
      <Avatar ref={ref} size="lg" className="avatar-test">
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText("CN").getAttribute("data-slot")).toBe("avatar-fallback");
    expect(screen.getByText("CN").classList.contains("absolute")).toBe(true);
    expect(screen.getByText("CN").classList.contains("inset-0")).toBe(true);
    expect(ref.current?.getAttribute("data-slot")).toBe("avatar");
    expect(ref.current?.getAttribute("data-size")).toBe("lg");
    expect(ref.current?.classList.contains("avatar-test")).toBe(true);
  });

  it("supports circle and rounded shapes", () => {
    render(
      <>
        <Avatar data-testid="circle">
          <AvatarFallback>C</AvatarFallback>
        </Avatar>
        <Avatar data-testid="rounded" shape="rounded">
          <AvatarFallback>R</AvatarFallback>
        </Avatar>
      </>
    );

    const circle = screen.getByTestId("circle");
    const rounded = screen.getByTestId("rounded");

    expect(circle.getAttribute("data-shape")).toBe("circle");
    expect(circle.classList.contains("rounded-full")).toBe(true);
    expect(circle.classList.contains("after:rounded-full")).toBe(true);
    expect(rounded.getAttribute("data-shape")).toBe("rounded");
    expect(rounded.classList.contains("rounded-xl")).toBe(true);
    expect(rounded.classList.contains("after:rounded-xl")).toBe(true);
    expect(
      screen
        .getByText("R")
        .classList.contains("group-data-[shape=rounded]/avatar:rounded-xl")
    ).toBe(true);
  });

  it("composes a labelled badge", () => {
    render(
      <Avatar>
        <AvatarImage src="/profile.png" alt="Chen Ning" />
        <AvatarFallback>CN</AvatarFallback>
        <AvatarBadge role="img" aria-label="Online" />
      </Avatar>
    );

    expect(screen.getByRole("img", { name: "Online" }).getAttribute("data-slot")).toBe("avatar-badge");
  });

  it("renders grouped avatars and an accessible overflow count", () => {
    render(
      <AvatarGroup role="group" aria-label="Project members">
        <Avatar><AvatarFallback>CN</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>ER</AvatarFallback></Avatar>
        <AvatarGroupCount aria-label="3 more members">+3</AvatarGroupCount>
      </AvatarGroup>
    );

    expect(screen.getByRole("group", { name: "Project members" }).getAttribute("data-slot")).toBe("avatar-group");
    expect(screen.getByLabelText("3 more members").textContent).toBe("+3");
  });

  it("composes user details with an optional badge and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <AvatarWithDetails
        ref={ref}
        avatar={<Avatar><AvatarFallback>AJ</AvatarFallback></Avatar>}
        name="Alex Johnson"
        description="Founder & CEO"
        badge={<span>Pro</span>}
      />
    );

    expect(ref.current?.getAttribute("data-slot")).toBe("avatar-with-details");
    expect(ref.current?.classList.contains("gap-2.5")).toBe(true);
    expect(ref.current?.querySelector('[data-slot="avatar"]')?.classList.contains("size-8")).toBe(true);
    expect(screen.getByText("Alex Johnson").getAttribute("data-slot")).toBe("avatar-with-details-name");
    expect(screen.getByText("Alex Johnson").classList.contains("text-body")).toBe(true);
    expect(screen.getByText("Founder & CEO").getAttribute("data-slot")).toBe("avatar-with-details-description");
    expect(screen.getByText("Founder & CEO").classList.contains("text-label")).toBe(true);
    expect(screen.getByText("Pro").parentElement?.getAttribute("data-slot")).toBe("avatar-with-details-badge");
  });
});
