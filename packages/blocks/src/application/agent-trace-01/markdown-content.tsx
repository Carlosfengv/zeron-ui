import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-4 mb-1.5 text-heading font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-title font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-body font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 text-body font-medium first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-fg-default">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-0.5 pl-5 marker:text-fg-muted">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-0.5 pl-5 marker:text-fg-muted">{children}</ol>,
  li: ({ children }) => <li className="pl-1 [&>p]:my-0">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-border pl-3 text-fg-muted">{children}</blockquote>,
  a: ({ children, href }) => <a href={href} className="font-medium text-fg-default underline decoration-current/35 underline-offset-2 hover:decoration-current">{children}</a>,
  hr: () => <hr className="my-5 border-border" />,
  table: ({ children }) => <div className="my-3 max-w-full overflow-x-auto rounded-md border border-border"><table className="w-full border-collapse text-left text-label">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-surface-raised text-fg-default">{children}</thead>,
  th: ({ children }) => <th className="border-b border-border px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-3 py-2 last:border-r-0">{children}</td>,
  pre: ({ children }) => <pre className="my-3 max-w-full overflow-x-auto whitespace-pre rounded-md bg-surface-raised px-3 py-2 font-mono text-label leading-5 [&>code]:bg-transparent [&>code]:p-0">{children}</pre>,
  code: ({ children, className }) => <code className={`${className ?? ""} rounded bg-surface-raised px-1 py-0.5 font-mono text-fg-default`}>{children}</code>,
};

/** Safe GFM rendering that reparses the accumulated response as stream deltas append. */
export function StreamMarkdown({ text, streaming }: { text: string; streaming: boolean }) {
  return <div className="min-w-0 max-w-full whitespace-normal break-words leading-6">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>{text}</ReactMarkdown>
    {streaming && <span role="status" aria-label="Streaming response" className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-0.5 animate-pulse bg-fg-muted" />}
  </div>;
}
