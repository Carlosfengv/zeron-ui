export interface CodeBlockMessages {
  copy: string;
  copied: string;
  copyFailed: string;
  wrap: string;
  scroll: string;
  highlightLoading?: string;
  highlightFailed?: string;
  highlightRetry?: string;
}

export const defaultCodeBlockMessages: Required<CodeBlockMessages> = {
  copy: 'Copy code',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  wrap: 'Wrap lines',
  scroll: 'Scroll lines',
  highlightLoading: 'Loading syntax highlighting…',
  highlightFailed: 'Syntax highlighting unavailable',
  highlightRetry: 'Retry',
};

export function resolveCodeBlockMessages(
  messages?: Partial<CodeBlockMessages>
): Required<CodeBlockMessages> {
  return {
    ...defaultCodeBlockMessages,
    ...messages,
    highlightLoading:
      messages?.highlightLoading ?? defaultCodeBlockMessages.highlightLoading,
    highlightFailed:
      messages?.highlightFailed ?? defaultCodeBlockMessages.highlightFailed,
    highlightRetry:
      messages?.highlightRetry ?? defaultCodeBlockMessages.highlightRetry,
  };
}
