import { useEffect, useRef, useState } from "react";

/** Synchronous guard prevents duplicate dispatch before React updates disabled controls. */
export function useSingleSubmit<Input, Result>(task: (input: Input, signal: AbortSignal) => Promise<Result>, onSuccess: (result: Result) => void) {
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function submit(input: Input) {
    if (active.current) return false;
    const controller = new AbortController();
    active.current = controller;
    setPending(true); setError(null);
    try {
      const result = await task(input, controller.signal);
      if (controller.signal.aborted) return false;
      onSuccess(result);
      return true;
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure);
      return false;
    } finally {
      if (active.current === controller) active.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }
  return { submit, pending, error, clearError: () => { if (!active.current) setError(null); } };
}
