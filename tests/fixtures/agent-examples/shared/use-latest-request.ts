import { useCallback, useEffect, useRef, useState } from "react";

type RequestState<T> = { key: string; loading: boolean; data: T | null; error: unknown };

/** Keep query data tied to its current identity, even if an adapter ignores cancellation. */
export function useLatestRequest<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<RequestState<T>>({ key, loading: true, data: null, error: null });
  const generation = useRef(0);
  useEffect(() => {
    const id = ++generation.current;
    const controller = new AbortController();
    setState(previous => ({ key, loading: true, data: previous.key === key ? previous.data : null, error: null }));
    Promise.resolve().then(() => load(controller.signal)).then(data => {
      if (generation.current === id && !controller.signal.aborted) setState({ key, loading: false, data, error: null });
    }, error => {
      if (generation.current === id && !controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error }));
    });
    return () => controller.abort();
  }, [key, load, retry]);
  const reload = useCallback(() => setRetry(value => value + 1), []);
  return { ...(state.key === key ? state : { key, loading: true, data: null, error: null }), reload };
}
