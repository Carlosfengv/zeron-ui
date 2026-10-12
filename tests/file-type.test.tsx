// @vitest-environment jsdom

import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FileType, fileTypeFamilies, resolveFileType } from "../packages/ui/src/components/file-type";

afterEach(cleanup);

describe("FileType detection", () => {
  it("covers the 99 reference extensions without duplicates", () => {
    const extensions = Object.values(fileTypeFamilies).flat();
    expect(extensions).toHaveLength(99);
    expect(new Set(extensions).size).toBe(99);
    for (const [family, members] of Object.entries(fileTypeFamilies)) {
      for (const extension of members) {
        expect(resolveFileType({ extension }).family).toBe(family);
      }
    }
  });

  it.each([
    ["Quarterly report.PDF", "pdf", "documents"],
    ["/uploads/PHOTO.JPEG", "jpeg", "images"],
    ["C:\\uploads\\data.XLSX", "xlsx", "spreadsheets"],
    ["archive.tar.gz", "gz", "archives"],
    ["https://example.com/downloads/report.pdf?version=2#page=1", "pdf", "documents"],
    ["invoice#final.pdf", "pdf", "documents"],
    ["budget?approved.xlsx", "xlsx", "spreadsheets"],
    ["/folder#draft/budget?approved.xlsx", "xlsx", "spreadsheets"],
    [".config.json", "json", "code"],
    ["folder.with.dots/README", "", null],
    [".gitignore", "", null],
    ["report.", "", null],
  ])("detects %s", (fileName, extension, family) => {
    expect(resolveFileType({ fileName })).toMatchObject({ extension, family });
  });

  it("normalizes explicit extensions and gives them precedence", () => {
    expect(resolveFileType({ extension: " .PdF ", fileName: "image.png" })).toMatchObject({ extension: "pdf", label: "PDF", color: "orange" });
    expect(resolveFileType({ extension: "", fileName: "report.pdf" }).label).toBe("FILE");
  });

  it("preserves unknown labels and safely handles object property names", () => {
    expect(resolveFileType({ extension: "unknownformat" })).toMatchObject({ label: "UNKNOWNFORMAT", color: "gray", family: null });
    expect(resolveFileType({ extension: "constructor" }).family).toBeNull();
    expect(resolveFileType({ extension: "__proto__" }).family).toBeNull();
    expect(resolveFileType().label).toBe("FILE");
  });
});

describe("FileType accessibility and composition", () => {
  it("names a standalone file icon and forwards its ref and native attributes", () => {
    const ref = createRef<SVGSVGElement>();
    render(<FileType fileName="Report.PDF" ref={ref} id="report-icon" />);
    expect(screen.getByRole("img", { name: "Report.PDF" })).toBe(ref.current);
    expect(ref.current?.id).toBe("report-icon");
  });

  it("keeps the complete accessible label when the visual label is shortened", () => {
    render(<FileType extension="longextension" />);
    const icon = screen.getByRole("img", { name: "LONGEXTENSION file" });
    expect(icon.textContent).toBe("LONGE…");
  });

  it("shortens unknown Unicode extensions without splitting surrogate pairs", () => {
    render(<FileType extension="😀😀😀😀😀😀😀" />);
    expect(screen.getByRole("img").textContent).toBe("😀😀😀😀😀…");
  });

  it.each(["WWW", "WWWW", "😀😀😀", "未知格式"])("bounds the drawing width of unknown %s labels", (extension) => {
    render(<FileType extension={extension} />);
    const icon = screen.getByRole("img");
    const text = icon.querySelector("text")!;
    const width = Number(text.getAttribute("textLength"));
    const center = Number(text.getAttribute("x"));
    const viewWidth = Number(icon.getAttribute("viewBox")!.split(" ")[2]);
    expect(width).toBeGreaterThan(0);
    expect(center - width / 2).toBeGreaterThanOrEqual(0);
    expect(center + width / 2).toBeLessThanOrEqual(viewWidth);
  });

  it("keeps its default accessible name when optional native props are undefined", () => {
    render(<FileType extension="pdf" role={undefined} aria-label={undefined} />);
    expect(screen.getByRole("img", { name: "PDF file" })).toBeTruthy();
  });

  it("uses a format name when the supplied file name is blank", () => {
    render(<FileType extension="pdf" fileName="   " />);
    expect(screen.getByRole("img", { name: "PDF file" })).toBeTruthy();
  });

  it.each([
    ["mini", 18], ["xs", 24], ["sm", 32], ["default", 40], ["lg", 48], ["xl", 56],
  ] as const)("gives %s the matching intrinsic SVG size", (size, pixels) => {
    render(<FileType extension="pdf" size={size} />);
    const icon = screen.getByRole("img");
    expect(icon.getAttribute("width")).toBe(String(pixels));
    expect(icon.getAttribute("height")).toBe(String(pixels));
  });

  it("hides decorative icons and honors explicit accessible labels", () => {
    render(<><FileType fileName="report.pdf" aria-hidden="true" /><FileType extension="xlsx" aria-label="Spreadsheet attachment" /></>);
    expect(screen.queryByRole("img", { name: "report.pdf" })).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Spreadsheet attachment" })).toBeTruthy();
  });

  it("uses an existing accessible label without also supplying a default name", () => {
    render(<><span id="file-label">Invoice</span><FileType extension="pdf" aria-labelledby="file-label" /></>);
    expect(screen.getByRole("img", { name: "Invoice" }).hasAttribute("aria-label")).toBe(false);
  });

  it("can switch format, style, and size on the same mounted icon", () => {
    const { rerender } = render(<FileType extension="pdf" />);
    rerender(<FileType fileName="data.xlsx" variant="solid" size="mini" />);
    const icon = screen.getByRole("img", { name: "data.xlsx" });
    expect(icon.textContent).toBe("XLSX");
    expect(icon.getAttribute("data-family")).toBe("spreadsheets");
    expect(icon.getAttribute("data-variant")).toBe("solid");
    expect(icon.getAttribute("data-size")).toBe("mini");
  });
});
