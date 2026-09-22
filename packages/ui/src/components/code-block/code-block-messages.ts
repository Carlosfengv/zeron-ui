export interface CodeBlockMessages {
  copy: string;
  copied: string;
  copyFailed: string;
  wrap: string;
  scroll: string;
}

export const defaultCodeBlockMessages: CodeBlockMessages = {
  copy: 'Copy code',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  wrap: 'Wrap lines',
  scroll: 'Scroll lines',
};

export function resolveCodeBlockMessages(
  messages?: Partial<CodeBlockMessages>
): CodeBlockMessages {
  return { ...defaultCodeBlockMessages, ...messages };
}
