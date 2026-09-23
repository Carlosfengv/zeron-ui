import { afterEach, describe, expect, test, vi } from 'vitest';
import { FileRenderer } from '../packages/ui/src/system/code-engine/renderers/FileRenderer';
import {
  disposeHighlighter,
  preloadHighlighter,
} from '../packages/ui/src/system/code-engine/highlighter/shared_highlighter';
import { registerCustomLanguage } from '../packages/ui/src/system/code-engine/highlighter/languages/registerCustomLanguage';
import {
  DEFAULT_RENDER_RANGE,
  DEFAULT_THEMES,
} from '../packages/ui/src/system/code-engine/constants';
import { renderPlainFile } from '../packages/ui/src/system/code-engine/utils/renderPlainFile';
import type { FileRendererInstance } from '../packages/ui/src/system/code-engine/worker/types';
import type { WorkerPoolManager } from '../packages/ui/src/system/code-engine/worker';

const renderers: FileRenderer[] = [];
function createRenderer(pool?: WorkerPoolManager) {
  const renderer: FileRenderer = new FileRenderer(
    undefined,
    undefined,
    () => {
      renderer.renderFile();
    },
    pool
  );
  renderers.push(renderer);
  return renderer;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
let nextLanguage = 0;
function grammarFixture() {
  const lang = `highlight-test-${nextLanguage++}`;
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
  const pending = deferred<typeof grammar>();
  const loader = vi.fn(() => pending.promise);
  registerCustomLanguage(lang, loader);
  return {
    lang,
    grammar,
    pending,
    loader,
    file: { name: 'sample', lang, contents: 'hello\nworld' },
  };
}
afterEach(async () => {
  renderers.splice(0).forEach((renderer) => renderer.cleanUp());
  vi.useRealTimers();
  await disposeHighlighter();
});

describe('highlight lifecycle', () => {
  test('cold content is escaped and visible before the language resolves, then becomes highlighted', async () => {
    const fixture = grammarFixture();
    fixture.file.contents = 'hello <script>alert(1)</script>\r\nworld\r';
    const renderer = createRenderer();
    const cold = renderer.renderFile(fixture.file)!;
    expect(renderer.getHighlightState()?.status).toBe('loading');
    expect(cold.totalLines).toBe(3);
    expect(renderer.renderFullHTML(cold)).toContain('&#x3C;script>');
    expect(renderer.renderFullHTML(cold)).not.toContain('<script>');
    await vi.waitFor(() => expect(fixture.loader).toHaveBeenCalledTimes(1));
    renderer.renderFile(fixture.file);
    expect(fixture.loader).toHaveBeenCalledTimes(1);
    fixture.pending.resolve(fixture.grammar);
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()?.status).toBe('ready')
    );
    expect(
      renderer.renderFullHTML(renderer.renderFile(fixture.file)!)
    ).toContain('--diffs-token');
  });

  test('failure stays terminal across rerenders and explicit retry recovers', async () => {
    const fixture = grammarFixture();
    const renderer = createRenderer();
    renderer.renderFile(fixture.file);
    await vi.waitFor(() => expect(fixture.loader).toHaveBeenCalledOnce());
    fixture.pending.reject(new Error('offline'));
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()?.status).toBe('error')
    );
    for (let i = 0; i < 3; i++) renderer.renderFile({ ...fixture.file });
    expect(fixture.loader).toHaveBeenCalledOnce();
    fixture.loader.mockResolvedValue(fixture.grammar);
    expect(renderer.retryHighlight()).toBe(true);
    renderer.renderFile(fixture.file);
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()?.status).toBe('ready')
    );
    expect(fixture.loader).toHaveBeenCalledTimes(2);
  });

  test('timeout ignores late success, but retry can use the now cached language', async () => {
    const fixture = grammarFixture();
    const renderer = createRenderer();
    renderer.highlightTimeoutMs = 10;
    renderer.renderFile(fixture.file);
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()).toMatchObject({
        status: 'error',
        reason: 'timeout',
      })
    );
    fixture.pending.resolve(fixture.grammar);
    await preloadHighlighter({
      langs: [fixture.lang],
      themes: Object.values(DEFAULT_THEMES),
    });
    renderer.renderFile(fixture.file);
    expect(renderer.getHighlightState()?.status).toBe('error');
    renderer.retryHighlight();
    renderer.renderFile(fixture.file);
    expect(renderer.getHighlightState()?.status).toBe('ready');
  });

  test('Python is supported and cached results do not restart loading', async () => {
    const renderer = createRenderer();
    const file = {
      name: 'main.py',
      contents: 'def greet():\n    print("Hello")',
    };
    renderer.renderFile(file);
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()).toMatchObject({
        status: 'ready',
        language: 'python',
      })
    );
    const ready = renderer.getHighlightState();
    renderer.renderFile({ ...file });
    expect(renderer.getHighlightState()).toBe(ready);
  });

  test('plain, empty and size-limited files terminate without loading', () => {
    const renderer = createRenderer();
    for (const [file, reason] of [
      [{ name: 'a.txt', contents: 'hello' }, 'text'],
      [{ name: 'empty.py', contents: '' }, 'empty'],
      [{ name: 'large.py', contents: 'a\nb\nc' }, 'size-limit'],
    ] as const) {
      renderer.setOptions({ tokenizeMaxLength: 2 });
      expect(renderer.renderFile(file)).toBeDefined();
      expect(renderer.getHighlightState()).toMatchObject({
        status: 'plain',
        reason,
      });
    }
  });

  test('cold fallback only creates rows inside the requested virtual window', () => {
    const renderer = createRenderer();
    renderer.setOptions({ tokenizeMaxLength: 10 });
    const file = {
      name: 'large.py',
      contents: Array.from({ length: 1000 }, (_, i) => `line${i}`).join('\n'),
    };
    const result = renderer.renderFile(file, {
      ...DEFAULT_RENDER_RANGE,
      startingLine: 400,
      totalLines: 5,
    })!;
    expect(result.contentAST).toHaveLength(5);
    expect(result.totalLines).toBe(1000);
    expect(renderer.renderFullHTML(result)).toContain('line400');
    expect(renderer.renderFullHTML(result)).not.toContain('line405');
  });

  test('cleanup suppresses late results and callbacks', async () => {
    const fixture = grammarFixture();
    const callback = vi.fn();
    const renderer = new FileRenderer(undefined, undefined, callback);
    renderer.renderFile(fixture.file);
    await vi.waitFor(() => expect(fixture.loader).toHaveBeenCalledOnce());
    renderer.cleanUp();
    fixture.pending.resolve(fixture.grammar);
    await preloadHighlighter({
      langs: [fixture.lang],
      themes: Object.values(DEFAULT_THEMES),
    });
    expect(callback).not.toHaveBeenCalled();
  });

  test('hydrated highlighted markup is not replaced while rebuilding its AST', async () => {
    const fixture = grammarFixture();
    const renderer = createRenderer();
    renderer.hydrate(fixture.file);
    expect(renderer.getHighlightState()?.status).toBe('ready');
    expect(renderer.renderFile(fixture.file)).toBeUndefined();
    await vi.waitFor(() => expect(fixture.loader).toHaveBeenCalledOnce());
    fixture.pending.reject(new Error('offline'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderer.getHighlightState()?.status).toBe('ready');
  });

  test('Worker initialization failure can recover on the main thread', async () => {
    let working = true;
    let subscriber: FileRendererInstance | undefined;
    const pool = {
      isWorkingPool: () => working,
      getFileRenderOptions: () => ({
        theme: DEFAULT_THEMES,
        tokenizeMaxLineLength: 1000,
        useTokenTransformer: false,
      }),
      getPreferredHighlighter: () => 'shiki-js',
      getFileResultCache: () => undefined,
      getPlainFileAST: () => undefined,
      highlightFileAST: (next: FileRendererInstance) => {
        subscriber = next;
      },
      cleanUpTasks: vi.fn(),
    } as unknown as WorkerPoolManager;
    const renderer = createRenderer(pool);
    const file = { name: 'fallback.py', contents: 'print("hello")' };
    renderer.renderFile(file);
    expect(subscriber).toBeDefined();
    working = false;
    renderer.renderFile(file);
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()?.status).toBe('ready')
    );
  });

  test('a theme resolution failure preserves content and exposes an error', async () => {
    const renderer = createRenderer();
    renderer.setOptions({ theme: 'nonexistent-highlight-test-theme' });
    const file = { name: 'example.py', contents: 'print("hello")' };
    expect(renderer.renderFullHTML(renderer.renderFile(file)!)).toContain(
      'print'
    );
    await vi.waitFor(() =>
      expect(renderer.getHighlightState()?.status).toBe('error')
    );
  });

  test('worker A -> B -> A isolates late success and failure from the current attempt', () => {
    const subscribers: FileRendererInstance[] = [];
    const options = {
      theme: DEFAULT_THEMES,
      tokenizeMaxLineLength: 1000,
      useTokenTransformer: false,
    };
    const pool = {
      isWorkingPool: () => true,
      getFileRenderOptions: () => options,
      getFileResultCache: () => undefined,
      getPlainFileAST: () => undefined,
      highlightFileAST: (subscriber: FileRendererInstance) =>
        subscribers.push(subscriber),
      cleanUpTasks: vi.fn(),
    } as unknown as WorkerPoolManager;
    const renderer = createRenderer(pool);
    const a = { name: 'a.py', contents: 'hello' };
    const b = { name: 'b.js', contents: 'world' };
    renderer.renderFile(a);
    renderer.renderFile(b);
    renderer.renderFile(a);
    expect(subscribers).toHaveLength(3);
    subscribers[0].onHighlightError(new Error('old A'));
    subscribers[1].onHighlightSuccess(
      b,
      renderPlainFile(['world'], DEFAULT_RENDER_RANGE),
      options
    );
    expect(renderer.getHighlightState()).toMatchObject({
      fileName: 'a.py',
      status: 'loading',
    });
    subscribers[2].onHighlightSuccess(
      a,
      renderPlainFile(['hello'], DEFAULT_RENDER_RANGE),
      options
    );
    renderer.renderFile(a);
    expect(renderer.getHighlightState()).toMatchObject({
      fileName: 'a.py',
      status: 'ready',
    });
  });
});
