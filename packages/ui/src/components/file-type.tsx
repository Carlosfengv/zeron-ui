"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "#system/utils";
import { badgeCategoricalTokens, type BadgeColor } from "./badge-colors";

const fileTypeFamilies = {
  documents: ["pdf", "doc", "docx", "odt", "rtf", "pages", "txt", "md", "log"],
  spreadsheets: ["xls", "xlsx", "xlsm", "ods", "csv", "tsv"],
  presentations: ["ppt", "pptx", "odp", "key"],
  images: ["png", "jpg", "jpeg", "gif", "webp", "avif", "heic", "bmp", "tif", "tiff", "ico", "raw", "svg"],
  video: ["mp4", "mov", "avi", "mkv", "webm", "mpeg", "mpg", "wmv"],
  audio: ["mp3", "wav", "aac", "flac", "ogg", "m4a", "aiff"],
  code: ["js", "jsx", "mjs", "ts", "tsx", "html", "htm", "css", "scss", "json", "xml", "yaml", "yml", "sql", "py", "java", "php", "rb", "go", "rs", "c", "cpp", "h", "cs", "sh", "rss"],
  archives: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"],
  design: ["fig", "sketch", "psd", "ai", "eps", "indd", "aep", "xd"],
  applications: ["exe", "msi", "dmg", "apk", "deb", "iso", "app"],
  fonts: ["ttf", "otf", "woff", "woff2"],
} as const;

type FileTypeFamily = keyof typeof fileTypeFamilies;
type FileTypeExtension = (typeof fileTypeFamilies)[FileTypeFamily][number];
type FileTypeVariant = "outline" | "solid" | "light" | "mono";
type FileTypeSize = "mini" | "xs" | "sm" | "default" | "lg" | "xl";

const familyColors: Record<FileTypeFamily, BadgeColor> = {
  documents: "blue", spreadsheets: "green", presentations: "red",
  images: "violet", video: "blue", audio: "pink", code: "gray",
  archives: "gray", design: "purple", applications: "gray", fonts: "gray",
};

const extensionColors: Partial<Record<FileTypeExtension, BadgeColor>> = {
  pdf: "orange", pages: "amber", txt: "gray", md: "gray", log: "gray",
  key: "blue", png: "yellow", svg: "yellow", raw: "gray",
  js: "yellow", jsx: "yellow", mjs: "yellow", ts: "blue", tsx: "blue",
  html: "orange", htm: "orange", css: "purple", scss: "pink", py: "blue",
  java: "orange", php: "indigo", rb: "red", go: "cyan", rs: "orange",
  cpp: "blue", cs: "purple", sh: "green", rss: "orange",
  sketch: "amber", psd: "cyan", ai: "orange", indd: "pink", aep: "violet", xd: "fuchsia",
  apk: "green", deb: "rose",
};

const extensionCatalog = new Map<string, { family: FileTypeFamily; color: BadgeColor }>();
for (const family of Object.keys(fileTypeFamilies) as FileTypeFamily[]) {
  for (const extension of fileTypeFamilies[family]) {
    extensionCatalog.set(extension, {
      family,
      color: extensionColors[extension] ?? familyColors[family],
    });
  }
}

function fileNameExtension(fileName = "") {
  let name = fileName.trim();
  // Query and fragment delimiters only have special meaning in a URL.
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(name)) {
    try {
      name = new URL(name).pathname;
    } catch {
      // An invalid URL is still safe to handle as a literal name.
    }
  }
  const baseName = name.split(/[/\\]/).pop() ?? "";
  const dot = baseName.lastIndexOf(".");
  return dot > 0 ? baseName.slice(dot + 1) : "";
}

/** Explicit extensions take precedence over the final suffix of a file name. */
function resolveFileType({ extension, fileName }: Pick<FileTypeProps, "extension" | "fileName"> = {}) {
  const normalized = (extension !== undefined
    ? extension.trim().replace(/^\.+/, "")
    : fileNameExtension(fileName)).toLowerCase();
  const entry = extensionCatalog.get(normalized);

  return {
    extension: normalized,
    label: normalized ? normalized.toUpperCase() : "FILE",
    family: entry?.family ?? null,
    color: entry?.color ?? "gray",
  };
}

const fileTypeVariants = cva("inline-block shrink-0 align-middle select-none", {
  variants: {
    size: {
      mini: "size-4.5", xs: "size-6", sm: "size-8",
      default: "size-10", lg: "size-12", xl: "size-14",
    },
    variant: { outline: "", solid: "", light: "", mono: "" },
  },
  defaultVariants: { size: "default", variant: "outline" },
});

const fileTypeDimensions: Record<FileTypeSize, number> = {
  mini: 18, xs: 24, sm: 32, default: 40, lg: 48, xl: 56,
};

interface FileTypeProps extends Omit<ComponentPropsWithoutRef<"svg">, "children"> {
  /** Extension, with or without a leading dot. Overrides fileName detection. */
  extension?: string;
  /** Literal file name, path, or absolute URL used to detect the extension and name the icon. */
  fileName?: string;
  variant?: FileTypeVariant;
  /** Square icon bounds: 18, 24, 32, 40, 48, or 56px. */
  size?: FileTypeSize;
}

const FileType = forwardRef<SVGSVGElement, FileTypeProps>(function FileType(
  {
    extension, fileName, variant = "outline", size = "default", className,
    role, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy,
    "aria-hidden": ariaHidden, ...props
  },
  ref,
) {
  const file = resolveFileType({ extension, fileName });
  const colors = badgeCategoricalTokens(variant === "mono" ? "gray" : file.color).strong;
  const solid = variant === "solid";
  // Long, unknown extensions stay inside the same icon bounds.
  const characters = Array.from(file.label);
  const label = characters.length > 6 ? `${characters.slice(0, 5).join("")}…` : file.label;
  const labelLength = Math.min(characters.length, 6);
  const fontSize = labelLength > 5 ? 6.5 : labelLength > 4 ? 7.5 : 8.5;
  const badgeWidth = Math.max(16, labelLength * fontSize * 0.64 + 6);
  const hidden = ariaHidden === true || ariaHidden === "true";

  return (
    <svg
      ref={ref}
      data-slot="file-type"
      data-size={size}
      data-variant={variant}
      data-extension={file.extension || undefined}
      data-family={file.family ?? "unknown"}
      xmlns="http://www.w3.org/2000/svg"
      width={fileTypeDimensions[size]}
      height={fileTypeDimensions[size]}
      viewBox="0 0 40 40"
      fill="none"
      role={hidden ? undefined : role ?? "img"}
      aria-hidden={ariaHidden}
      aria-label={hidden ? undefined : ariaLabel ?? (ariaLabelledBy ? undefined : fileName?.trim() || `${file.label} file`)}
      aria-labelledby={ariaLabelledBy}
      focusable="false"
      className={cn(fileTypeVariants({ variant, size }), className)}
      {...props}
    >
      <path
        d="M11 1.5H26.5L37 12V35.5A3 3 0 0 1 34 38.5H11A3 3 0 0 1 8 35.5V4.5A3 3 0 0 1 11 1.5Z"
        fill={solid ? colors.background : variant === "light" ? "var(--muted)" : "var(--surface-floating)"}
        stroke={solid ? colors.background : "var(--fg-subtle)"}
        strokeOpacity={solid ? 1 : 0.4}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {solid && (
        <path d="M26.5 1.5V10A2 2 0 0 0 28.5 12H37Z" fill={colors.foreground} opacity="0.25" />
      )}
      <path
        d="M26.5 1.5V10A2 2 0 0 0 28.5 12H37"
        stroke={solid ? colors.foreground : "var(--fg-subtle)"}
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {!solid && <rect x="1.5" y="19" width={badgeWidth} height="14" rx="3.5" fill={colors.background} />}
      <text
        x={solid ? 22.5 : 1.5 + badgeWidth / 2}
        y="26"
        fill={colors.foreground}
        fontSize={fontSize}
        fontWeight="550"
        fontFamily="inherit"
        textAnchor="middle"
        dominantBaseline="central"
        textLength={file.family === null ? badgeWidth - 6 : undefined}
        lengthAdjust="spacingAndGlyphs"
      >
        {label}
      </text>
    </svg>
  );
});
FileType.displayName = "FileType";

export { FileType, fileTypeVariants, fileTypeFamilies, resolveFileType };
export type { FileTypeProps, FileTypeSize, FileTypeVariant, FileTypeFamily, FileTypeExtension };
