"use client";

import { Children, createContext, isValidElement, useContext, useId, useMemo, type HTMLAttributes, type ReactNode } from "react";
import { Checkbox } from "#components/checkbox";
import { CodeBlock, type CodeBlockProps } from "#components/code-block";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "#components/table";
import { cn } from "#system/utils";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const TaskLabel = createContext("");

function taskText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{ children?: ReactNode }>(child) ? taskText(child.props.children) : "";
  }).join("").trim();
}

function MarkdownTaskCheckbox({ checked }: { checked?: boolean }) {
  const label = useContext(TaskLabel);
  return <span className="mr-2 inline-flex align-middle"><Checkbox checked={Boolean(checked)} readOnly tabIndex={-1} aria-label={label || "Task"} /></span>;
}

function MarkdownPre({ children }: { children?: ReactNode }) {
  return <pre className="my-4 w-full min-w-0 max-w-full overflow-x-auto whitespace-pre rounded-md bg-surface-raised px-4 py-3 font-mono text-label [&>code]:bg-transparent [&>code]:p-0">{children}</pre>;
}

const markdownComponents: Components = {
  h1: ({ children, id }) => <h1 id={id} className="mt-8 mb-3 text-heading font-semibold first:mt-0">{children}</h1>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-body font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 mb-2 text-body font-medium first:mt-0">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-4 mb-2 text-label font-semibold first:mt-0">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-4 mb-2 text-label font-medium text-fg-muted first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-fg-default">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children, className }) => <ul className={cn("my-3 list-disc space-y-1 pl-5 marker:text-fg-muted first:mt-0 last:mb-0", className?.includes("contains-task-list") && "list-none pl-0")}>{children}</ul>,
  ol: ({ children, start }) => <ol start={start} className="my-3 list-decimal space-y-1 pl-5 marker:text-fg-muted first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children, className, id }) => {
    const task = className?.includes("task-list-item");
    const item = <li id={id} className={cn("pl-1 [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1", task && "list-none pl-0")}>{children}</li>;
    return task ? <TaskLabel.Provider value={taskText(children)}>{item}</TaskLabel.Provider> : item;
  },
  input: MarkdownTaskCheckbox,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-border pl-4 text-fg-muted first:mt-0 last:mb-0">{children}</blockquote>,
  hr: () => <hr className="my-6 border-0 border-t-hairline border-border" />,
  table: ({ children }) => <Table variant="bordered" size="md" containerClassName="my-4 w-full min-w-0">{children}</Table>,
  thead: ({ children }) => <TableHeader>{children}</TableHeader>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children, style }) => <TableHead style={style}>{children}</TableHead>,
  td: ({ children, style }) => <TableCell style={style}>{children}</TableCell>,
  pre: MarkdownPre,
  code: ({ children, className }) => <code className={cn("rounded bg-surface-raised px-1 py-0.5 font-mono text-label text-fg-default", className)}>{children}</code>,
  // Images stay in the message column, including intrinsic-width remote images.
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ node: _node, alt, ...props }) => <img {...props} alt={alt ?? ""} loading="lazy" className="my-4 inline-block h-auto max-w-full rounded-md" />,
};

function MarkdownCodeBlock({ children, messages }: { children?: ReactNode; messages?: CodeBlockProps["messages"] }) {
    const code = Children.toArray(children).find(isValidElement);
    if (!isValidElement<{ children?: ReactNode; className?: string; node?: { data?: { meta?: string } } }>(code))
      return <MarkdownPre>{children}</MarkdownPre>;
    const language = code.props.className?.match(/(?:^|\s)language-(\S+)/)?.[1];
    const filename = code.props.node?.data?.meta?.match(/(?:^|\s)(?:filename|title)="([^"]+)"/)?.[1];
    return (
      <div className="my-4 w-full min-w-0 max-w-full">
        <CodeBlock
          messages={messages}
          file={{
            name: filename || `snippet.${language ?? "txt"}`,
            contents: String(code.props.children ?? "").replace(/\n$/, ""),
            // The fence owns syntax; a display filename may have another extension.
            lang: language && /^(?:txt|text|plain|plaintext)$/i.test(language) ? "text" : language,
          }}
        />
      </div>
    );
}

export type MarkdownComponents = Components;

export interface MarkdownProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Accumulated Markdown source. Raw HTML is not rendered. */
  text: string;
  streaming?: boolean;
  streamingLabel?: string;
  /** Use CodeBlock's toolbar/highlighting or a lightweight preformatted block. */
  codeVariant?: "block" | "plain";
  /** Localize the existing CodeBlock toolbar without replacing its renderer. */
  codeMessages?: CodeBlockProps["messages"];
  footnoteLabel?: string;
  footnoteBackLabel?: string;
  /** Override individual semantic elements; callers own renderer safety. */
  components?: MarkdownComponents;
}

/** Safe GFM, tables and streaming output with optional Zeron CodeBlock integration. */
export function Markdown({
  text,
  streaming = false,
  streamingLabel = "Streaming response",
  codeVariant = "block",
  codeMessages,
  footnoteLabel = "Footnotes",
  footnoteBackLabel,
  components,
  className,
  ...props
}: MarkdownProps) {
  const id = useId();
  const prefix = `markdown-${id.replace(/[^a-zA-Z0-9_-]/g, "")}-`;
  const renderers = useMemo<Components>(() => ({
    ...markdownComponents,
    h2: ({ children, id }) => <h2 id={id === "footnote-label" ? `${prefix}footnote-label` : id} className="mt-6 mb-3 text-title font-semibold first:mt-0">{children}</h2>,
    a: ({ children, node: _node, ...props }) => <a {...props} aria-describedby={props["aria-describedby"] === "footnote-label" ? `${prefix}footnote-label` : props["aria-describedby"]} className="rounded-sm font-medium text-fg-default underline decoration-current/35 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">{children}</a>,
    ...(codeVariant === "block" ? { pre: ({ children }) => <MarkdownCodeBlock messages={codeMessages}>{children}</MarkdownCodeBlock> } : {}),
    ...components,
  }), [codeVariant, codeMessages, components, prefix]);
  return (
    <div data-slot="markdown" className={cn("w-full min-w-0 max-w-full whitespace-normal break-words text-body leading-6 text-fg-default", className)} {...props}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        remarkRehypeOptions={{ clobberPrefix: prefix, footnoteLabel, footnoteBackLabel }}
        components={renderers}
      >
        {text}
      </ReactMarkdown>
      {streaming && (
        <span role="status" aria-label={streamingLabel} className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-fg-muted motion-reduce:animate-none" />
      )}
    </div>
  );
}
