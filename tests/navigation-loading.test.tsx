// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PrimaryNavigationLabel } from "../docs/components/shell/site/primary-navigation-label";
import { ComponentsGalleryLoading } from "../docs/components/shell/site/components-gallery-loading";

const status = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", () => ({ useLinkStatus: () => status }));
afterEach(() => { cleanup(); status.pending = false; });

describe("primary navigation feedback", () => {
  it.each(["Loading page…", "正在加载页面…"])("reflects router-owned pending and cancellation with %s", (loadingLabel) => {
    const view = render(<PrimaryNavigationLabel label="Components" loadingLabel={loadingLabel} />);
    expect(view.container.querySelector("[data-navigation-pending]")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
    status.pending = true;
    view.rerender(<PrimaryNavigationLabel label="Components" loadingLabel={loadingLabel} />);
    const pending = view.container.querySelector("[data-navigation-pending]");
    expect(pending?.getAttribute("aria-hidden")).toBe("true");
    expect(pending?.className).toContain("motion-reduce:animate-none");
    expect(pending?.className).toContain("absolute");
    expect(screen.getByRole("status").textContent).toBe(loadingLabel);
    status.pending = false;
    view.rerender(<PrimaryNavigationLabel label="Components" loadingLabel={loadingLabel} />);
    expect(view.container.querySelector("[data-navigation-pending]")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("does not manage URLs, invent timers or intercept browser navigation", () => {
    const source = readFileSync("docs/components/shell/site/primary-navigation-label.tsx", "utf8");
    expect(source).toContain("useLinkStatus()");
    expect(source).not.toMatch(/setTimeout|setInterval|useState|onClick|onNavigate|pushState|replaceState/);
    const shell = readFileSync("docs/components/shell/site/site-shell.tsx", "utf8");
    expect(shell).toContain('<Link href={item.href} prefetch />');
  });
});

describe("lightweight route boundaries", () => {
  it.each([ComponentsGalleryLoading])("hides placeholder shapes and adds no duplicate live regions", (Fallback) => {
    const view = render(<Fallback />);
    expect(view.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    const shapes = view.container.querySelectorAll('[data-slot="skeleton"]');
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.getAttribute("aria-hidden")).toBe("true");
      expect(shape.className).toContain("motion-reduce:animate-none");
    }
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the fallback independent of gallery client chunks", () => {
    const source = readFileSync("docs/components/shell/site/components-gallery-loading.tsx", "utf8");
    expect(source).not.toContain('from "@zeron/ui/page-layout"');
    expect(source).not.toContain('"use client"');
    expect(source).toContain("grid-cols-[220px_minmax(0,1fr)]");
    expect(source).toContain("max-lg:flex-col");
  });

  it("shares the component skeleton between route and in-page Suspense", () => {
    for (const path of ["app/[locale]/docs/components/loading.tsx", "app/[locale]/docs/components/page.tsx"]) {
      expect(readFileSync(path, "utf8")).toContain("@docs/components/shell/site/components-gallery-loading");
    }
  });
});
