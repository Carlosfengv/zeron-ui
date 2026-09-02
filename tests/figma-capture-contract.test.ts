import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("component preview Figma capture", () => {
  const preview = source("docs/components/content/ComponentPreview.tsx");
  const capture = source("docs/lib/figma-capture.ts");
  const captureToaster = source(
    "docs/components/content/FigmaCaptureToaster.tsx",
  );
  const toastPage = source("docs/pages/components/toast/page.tsx");
  const providers = source("app/app-providers.tsx");
  const nextConfig = source("next.config.ts");

  it("targets the rendered component instead of the preview canvas", () => {
    expect(preview).toContain("resolveFigmaCaptureTarget(");
    expect(preview).toContain("copyElementToFigma(captureTarget)");
    expect(preview).toContain("loading={isFigmaCopying}");
    expect(preview).not.toContain("data-figma-capture-id={previewId}");
    expect(capture).toContain("preview.children.length === 1");
    expect(capture).toContain("explicitTarget?: Element | null");
    expect(preview).toContain('{tab === 0 && (');
    expect(preview).toContain('t("copyToFigma")');
  });

  it("marks inline Toast stacks as complete capture targets", () => {
    expect(toastPage.match(/data-figma-capture-target=""/g)).toHaveLength(2);
    expect(toastPage).toContain('portal={false}');
  });

  it("keeps Figma feedback at the top without moving other toasts", () => {
    expect(preview).toContain("figmaCaptureToast.loading");
    expect(captureToaster).toContain('position="top-center"');
    expect(captureToaster).toContain("container={portalContainer}");
    expect(captureToaster).toContain("document.fullscreenElement");
    expect(providers).toContain("<FigmaCaptureToaster />");
    expect(providers).toContain("<Toaster />");
  });

  it("loads the official Figma bridge through a same-origin endpoint", () => {
    expect(capture).toContain('const FIGMA_CAPTURE_SCRIPT_URL = "/figma-capture.js"');
    expect(capture).toContain("captureForDesign");
    expect(capture).toContain("observeClipboardWrite");
    expect(capture).toContain('includes("text/html")');
    expect(capture).toContain("captureInFlight");
    expect(capture).toContain('FIGMA_TOOLBAR_HOST_ID = "__figma_capture_toolbar_host__"');
    expect(capture).toContain("hideOfficialCaptureToolbar();");
    expect(capture).toContain("SCRIPT_LOAD_TIMEOUT_MS");
    expect(preview).toContain("onPointerEnter={prewarmFigmaCapture}");
    expect(preview).not.toContain("if (tab !== 0) return;");
    expect(nextConfig).toContain('source: "/figma-capture.js"');
    expect(nextConfig).toContain(
      'destination: "https://mcp.figma.com/mcp/html-to-design/capture.js"',
    );
  });
});
