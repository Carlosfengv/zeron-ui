import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import tsx from "@shikijs/langs/tsx";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";

type Highlighter = Awaited<ReturnType<typeof createHighlighterCore>>;

let loading: Promise<Highlighter> | null = null;
const highlightedCode = new Map<string, Promise<string>>();
const MAX_CACHE_ENTRIES = 100;

function getHighlighter(): Promise<Highlighter> {
  if (!loading) {
    loading = createHighlighterCore({
      themes: [githubDark, githubLight],
      langs: [tsx],
      engine: createJavaScriptRegexEngine(),
    }).catch((error) => {
      // Allow a later Code-tab visit to retry a transient loading failure.
      loading = null;
      throw error;
    });
  }
  return loading;
}

export function highlight(code: string): Promise<string> {
  const normalized = code.trim();
  const cached = highlightedCode.get(normalized);
  if (cached) return cached;

  if (highlightedCode.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = highlightedCode.keys().next().value;
    if (oldestKey !== undefined) highlightedCode.delete(oldestKey);
  }

  const pending = getHighlighter().then((highlighter) => {
    return highlighter.codeToHtml(normalized, {
      lang: "tsx",
      themes: { dark: "github-dark", light: "github-light" },
      defaultColor: false,
    });
  });

  highlightedCode.set(normalized, pending);
  void pending.catch(() => {
    // Do not permanently cache rejected work; callers can retry later.
    if (highlightedCode.get(normalized) === pending) {
      highlightedCode.delete(normalized);
    }
  });

  return pending;
}
