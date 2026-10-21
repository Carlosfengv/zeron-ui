/** The selected user message is included in removed so it can become the draft. */
export function splitThreadHistory<T extends { id: string }>(
  messages: readonly T[],
  messageId: string,
): { kept: T[]; removed: T[] } {
  const index = messages.findIndex((message) => message.id === messageId);
  return index < 0
    ? { kept: [...messages], removed: [] }
    : { kept: messages.slice(0, index), removed: messages.slice(index) };
}
