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
    expect(ref.current?.getAttribute("data-slot")).toBe("avatar");
    expect(ref.current?.getAttribute("data-size")).toBe("lg");
    expect(ref.current?.classList.contains("avatar-test")).toBe(true);
  });

  it("forwards image attributes and composes a labelled badge", () => {
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
      <AvatarGroup aria-label="Project members">
        <Avatar><AvatarFallback>CN</AvatarFallback></Avatar>
        <Avatar><AvatarFallback>ER</AvatarFallback></Avatar>
        <AvatarGroupCount aria-label="3 more members">+3</AvatarGroupCount>
      </AvatarGroup>
    );

    expect(screen.getByLabelText("Project members").getAttribute("data-slot")).toBe("avatar-group");
    expect(screen.getByLabelText("3 more members").textContent).toBe("+3");
  });

  it("composes user details with an optional badge and forwards the ref", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <AvatarWithDetails
        ref={ref}
        size="lg"
        avatar={<Avatar><AvatarFallback>AJ</AvatarFallback></Avatar>}
        name="Alex Johnson"
        description="Founder & CEO"
        badge={<span>Pro</span>}
      />
    );

    expect(ref.current?.getAttribute("data-slot")).toBe("avatar-with-details");
    expect(ref.current?.getAttribute("data-size")).toBe("lg");
    expect(screen.getByText("Alex Johnson").getAttribute("data-slot")).toBe("avatar-with-details-name");
    expect(screen.getByText("Founder & CEO").getAttribute("data-slot")).toBe("avatar-with-details-description");
    expect(screen.getByText("Pro").parentElement?.getAttribute("data-slot")).toBe("avatar-with-details-badge");
  });
});
