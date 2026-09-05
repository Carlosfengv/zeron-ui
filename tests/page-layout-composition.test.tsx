// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  PageActions,
  PageContentHeader,
  PageHeaderContent,
  PageSubnav,
  PageTitle,
} from "@zeron/ui/page-layout";

afterEach(cleanup);

describe("PageContentHeader composition", () => {
  it("uses the compact body title style when no class name is supplied", () => {
    render(<PageTitle>Projects</PageTitle>);

    const title = screen.getByRole("heading", { name: "Projects" });

    expect(title.className).toContain("text-body");
    expect(title.className).toContain("font-medium");
  });

  it("keeps actions outside the navigation landmark", () => {
    render(
      <PageContentHeader data-testid="content-header">
        <PageSubnav aria-label="Project settings">
          <a href="#overview">Overview</a>
        </PageSubnav>
        <PageActions>
          <button type="button">Invite member</button>
        </PageActions>
      </PageContentHeader>
    );

    const navigation = screen.getByRole("navigation", { name: "Project settings" });
    const action = screen.getByRole("button", { name: "Invite member" });

    expect(within(navigation).queryByRole("button", { name: "Invite member" })).toBeNull();
    expect(screen.getByTestId("content-header").contains(action)).toBe(true);
  });

  it("renders only the left content when actions are omitted", () => {
    render(
      <PageContentHeader data-testid="content-header">
        <PageHeaderContent>Projects</PageHeaderContent>
      </PageContentHeader>
    );

    const header = screen.getByTestId("content-header");

    expect(header.textContent).toBe("Projects");
    expect(header.querySelector('[data-slot="page-actions"]')).toBeNull();
    expect(header.children).toHaveLength(1);
  });
});
