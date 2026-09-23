// @vitest-environment jsdom
import { StrictMode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { CodeBlock } from '../packages/ui/src/components/code-block/code-block';
import { registerCustomLanguage } from '../packages/ui/src/system/code-engine/highlighter/languages/registerCustomLanguage';
import {
  disposeHighlighter,
  preloadHighlighter,
} from '../packages/ui/src/system/code-engine/highlighter/shared_highlighter';
import { DEFAULT_THEMES } from '../packages/ui/src/system/code-engine/constants';
import type { CodeHighlightState } from '../packages/ui/src/system/code-engine/types';

beforeAll(() => {
  CSSStyleSheet.prototype.replaceSync = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }))
  );
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  await disposeHighlighter();
});
let languageId = 0;
function fixture() {
  const lang = `feedback-${languageId++}`;
  const grammar = {
    default: [
      {
        name: lang,
        scopeName: `source.${lang}`,
        repository: {},
        patterns: [{ match: 'hello', name: 'keyword.control' }],
      },
    ],
  };
  let resolve!: (value: typeof grammar) => void;
  let reject!: (error: Error) => void;
  const loader = vi.fn(
    () =>
      new Promise<typeof grammar>((a, b) => {
        resolve = a;
        reject = b;
      })
  );
  registerCustomLanguage(lang, loader);
  return {
    file: { name: 'example.py', lang, contents: 'hello\nworld' },
    loader,
    grammar,
    resolve: () => resolve(grammar),
    reject: () => reject(new Error('offline')),
  };
}

describe('CodeBlock highlight feedback', () => {
  test('shows delayed loading, preserves text, and reports ready after token DOM is installed', async () => {
    const f = fixture();
    const states: CodeHighlightState[] = [];
    let host: Element | null = null;
    const view = render(
      <CodeBlock
        file={f.file}
        onHighlightStateChange={(state) => {
          states.push(state);
          if (state.status === 'ready')
            expect(
              host?.shadowRoot?.querySelector('[data-line] span[style]')
            ).not.toBeNull();
        }}
      />
    );
    host = view.container.firstElementChild;
    expect(
      host?.shadowRoot?.querySelector('[data-content]')?.textContent
    ).toContain('hello');
    expect(host?.getAttribute('data-highlight-state')).toBe('loading');
    expect(screen.queryByText('Loading syntax highlighting…')).toBeNull();
    await screen.findByText('Loading syntax highlighting…');
    expect(
      host?.shadowRoot?.querySelector('pre')?.getAttribute('aria-busy')
    ).toBe('true');
    await act(async () => {
      f.resolve();
    });
    await waitFor(() =>
      expect(host?.getAttribute('data-highlight-state')).toBe('ready')
    );
    expect(screen.queryByText('Loading syntax highlighting…')).toBeNull();
    expect(states.map((s) => s.status)).toEqual(['loading', 'ready']);
  });

  test('failure can be retried from the toolbar without replacing the host', async () => {
    const f = fixture();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const view = render(<CodeBlock file={f.file} />);
    const host = view.container.firstElementChild;
    await waitFor(() => expect(f.loader).toHaveBeenCalledOnce());
    await act(async () => f.reject());
    await screen.findByText('Syntax highlighting unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith(f.file.contents);
    f.loader.mockResolvedValue(f.grammar);
    const retry = screen.getByRole('button', { name: 'Retry' });
    retry.focus();
    fireEvent.click(retry);
    await waitFor(() =>
      expect(host?.getAttribute('data-highlight-state')).toBe('ready')
    );
    expect(view.container.firstElementChild).toBe(host);
    expect(screen.queryByText('Syntax highlighting unavailable')).toBeNull();
    expect(f.loader).toHaveBeenCalledTimes(2);
  });

  test('custom headers receive state and can retry without default feedback', async () => {
    const f = fixture();
    const onState = vi.fn();
    const props = {
      file: f.file,
      renderCustomHeader: () => <span>Custom</span>,
      onHighlightStateChange: onState,
    };
    const view = render(<CodeBlock {...props} highlightRetryKey={0} />);
    await waitFor(() => expect(f.loader).toHaveBeenCalledOnce());
    await act(async () => f.reject());
    await waitFor(() =>
      expect(onState).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'error' })
      )
    );
    expect(screen.queryByText('Syntax highlighting unavailable')).toBeNull();
    f.loader.mockResolvedValue(f.grammar);
    view.rerender(<CodeBlock {...props} highlightRetryKey={1} />);
    await waitFor(() =>
      expect(onState).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'ready' })
      )
    );
  });

  test('cached language is ready immediately and StrictMode unmount ignores pending work', async () => {
    await preloadHighlighter({
      langs: ['python'],
      themes: Object.values(DEFAULT_THEMES),
    });
    const cached = render(
      <CodeBlock file={{ name: 'main.py', contents: 'print("hello")' }} />
    );
    expect(
      cached.container.firstElementChild?.getAttribute('data-highlight-state')
    ).toBe('ready');
    expect(screen.queryByText('Loading syntax highlighting…')).toBeNull();
    cached.unmount();
    const f = fixture();
    const onState = vi.fn();
    const pending = render(
      <StrictMode>
        <CodeBlock file={f.file} onHighlightStateChange={onState} />
      </StrictMode>
    );
    await waitFor(() => expect(f.loader).toHaveBeenCalledOnce());
    pending.unmount();
    const count = onState.mock.calls.length;
    await act(async () => {
      f.resolve();
    });
    expect(onState).toHaveBeenCalledTimes(count);
  });
});
