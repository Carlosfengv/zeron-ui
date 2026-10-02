// @vitest-environment jsdom

import { StrictMode, createRef, useEffect } from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { CodeWorkerProvider } from '../packages/ui/src/components/code-block/worker';
import { CodeView as CodeViewClass } from '../packages/ui/src/system/code-engine/components/CodeView';
import { File as FileClass } from '../packages/ui/src/system/code-engine/components/File';
import { FileDiff as FileDiffClass } from '../packages/ui/src/system/code-engine/components/FileDiff';
import { Editor, type EditorFactory } from '../packages/ui/src/system/code-engine/edit';
import { DiffHunksRenderer } from '../packages/ui/src/system/code-engine/renderers/DiffHunksRenderer';
import { DEFAULT_THEMES } from '../packages/ui/src/system/code-engine/constants';
import {
  disposeHighlighter,
  preloadHighlighter,
} from '../packages/ui/src/system/code-engine/highlighter/shared_highlighter';
import {
  CodeView,
  type CodeViewHandle,
} from '../packages/ui/src/system/code-engine/react/CodeView';
import { EditProvider } from '../packages/ui/src/system/code-engine/react/EditContext';
import { File } from '../packages/ui/src/system/code-engine/react/File';
import { FileDiff } from '../packages/ui/src/system/code-engine/react/FileDiff';
import { UnresolvedFile } from '../packages/ui/src/system/code-engine/react/UnresolvedFile';
import { Virtualizer } from '../packages/ui/src/system/code-engine/react/Virtualizer';
import { useWorkerPool } from '../packages/ui/src/system/code-engine/react/WorkerPoolContext';
import { parseDiffFromFile } from '../packages/ui/src/system/code-engine/utils/parseDiffFromFile';
import { preloadFile } from '../packages/ui/src/system/code-engine/ssr/preloadFile';
import { WorkerPoolManager } from '../packages/ui/src/system/code-engine/worker';
import type { WorkerRequest, WorkerResponse } from '../packages/ui/src/system/code-engine/worker/types';

// Keep render responses pending so attachment tests cannot accidentally pass
// because main-thread highlighting finished. Only the transport is mocked:
// components, renderers and WorkerPoolManager are the production classes.
class ControlledWorker {
  readonly listeners = new Map<string, Set<EventListener>>();
  readonly requests: WorkerRequest[] = [];
  terminated = false;

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(request: WorkerRequest): void {
    this.requests.push(request);
    if (request.type === 'file' || request.type === 'diff') return;
    queueMicrotask(() => {
      const event = new MessageEvent('message', {
        data: {
          id: request.id,
          requestType: request.type,
          sentAt: Date.now(),
          type: 'success',
        },
      });
      for (const listener of this.listeners.get('message') ?? []) {
        listener(event);
      }
    });
  }

  respond(response: WorkerResponse): void {
    const event = new MessageEvent('message', { data: response });
    for (const listener of this.listeners.get('message') ?? []) listener(event);
  }

  terminate(): void {
    this.terminated = true;
  }
}

function createPool() {
  const workers: ControlledWorker[] = [];
  return {
    workers,
    factory: () => {
      const worker = new ControlledWorker();
      workers.push(worker);
      return worker as unknown as Worker;
    },
    renderRequests: () =>
      workers.flatMap((worker) =>
        worker.requests.filter(
          (request) => request.type === 'file' || request.type === 'diff'
        )
      ),
  };
}

const oldFile = { name: 'example.ts', contents: 'const value = 1;\n' };
const file = { name: 'example.ts', contents: 'const value = 2;\n' };
const fileDiff = parseDiffFromFile(oldFile, file);
const conflictFile = {
  name: 'conflict.ts',
  contents:
    '<<<<<<< HEAD\nconst value = 1;\n=======\nconst value = 2;\n>>>>>>> incoming\n',
};
const initialItems = [{ id: 'example', type: 'file' as const, file }];
const workerOptions = { useTokenTransformer: true };
const alternativeWorkerOptions = { useTokenTransformer: false };
const surfaces = [
  'file',
  'diff',
  'unresolved',
  'code-view',
  'virtual-file',
  'virtual-diff',
] as const;
type Surface = (typeof surfaces)[number];

function Surface({
  kind,
  disabled = false,
}: {
  kind: Surface;
  disabled?: boolean;
}) {
  switch (kind) {
    case 'file':
      return <File file={file} disableWorkerPool={disabled} />;
    case 'diff':
      return <FileDiff fileDiff={fileDiff} disableWorkerPool={disabled} />;
    case 'unresolved':
      return <UnresolvedFile file={conflictFile} disableWorkerPool={disabled} />;
    case 'code-view':
      return <CodeView initialItems={initialItems} disableWorkerPool={disabled} />;
    case 'virtual-file':
      return <Virtualizer><File file={file} disableWorkerPool={disabled} /></Virtualizer>;
    case 'virtual-diff':
      return <Virtualizer><FileDiff fileDiff={fileDiff} disableWorkerPool={disabled} /></Virtualizer>;
  }
}

function PoolProbe({ onManager }: { onManager(manager: WorkerPoolManager): void }) {
  const manager = useWorkerPool();
  useEffect(() => {
    if (manager != null) onManager(manager);
  }, [manager, onManager]);
  return null;
}

function bindingSpy(kind: Surface) {
  if (kind === 'code-view') return vi.spyOn(CodeViewClass.prototype, 'setWorkerPool');
  if (kind === 'file' || kind === 'virtual-file') {
    return vi.spyOn(FileClass.prototype, 'setWorkerPool');
  }
  return vi.spyOn(FileDiffClass.prototype, 'setWorkerPool');
}

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    font: '',
    measureText: (text: string) => ({ width: text.length * 8 }),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLElement.prototype.scrollIntoView = vi.fn();
  Range.prototype.getBoundingClientRect = () => new DOMRect();
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  CSSStyleSheet.prototype.replaceSync = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  })));
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await disposeHighlighter();
});

describe.each(surfaces)('%s worker lifecycle', (kind) => {
  test('attaches the first provider pool to the mounted renderer', async () => {
    const pool = createPool();
    const binding = bindingSpy(kind);
    const managers: WorkerPoolManager[] = [];
    render(
      <CodeWorkerProvider workerFactory={pool.factory} poolSize={1} highlighterOptions={workerOptions}>
        <PoolProbe onManager={(manager) => managers.push(manager)} />
        <Surface kind={kind} />
      </CodeWorkerProvider>
    );

    await waitFor(() => expect(pool.renderRequests().length).toBeGreaterThan(0));
    expect(managers).toHaveLength(1);
    expect(managers[0]!.getStats().themeSubscribers).toBeGreaterThan(0);
    expect(binding.mock.calls[0]?.[0]).toBeUndefined();
    expect(binding.mock.lastCall?.[0]).toBe(managers[0]);
    // Both commits used the same mounted instance, including virtualized ones.
    expect(new Set(binding.mock.contexts).size).toBe(1);
  });

  test('replaces and disables the pool without recreating the component', async () => {
    const first = createPool();
    const second = createPool();
    const binding = bindingSpy(kind);
    const managers = new Set<WorkerPoolManager>();
    const captureManager = (manager: WorkerPoolManager) => managers.add(manager);
    const view = (pool: ReturnType<typeof createPool>, disabled = false) => (
      <CodeWorkerProvider
        workerFactory={pool.factory}
        poolSize={1}
        highlighterOptions={pool === first ? workerOptions : alternativeWorkerOptions}
      >
        <PoolProbe onManager={captureManager} />
        <Surface kind={kind} disabled={disabled} />
      </CodeWorkerProvider>
    );
    const result = render(view(first));
    await waitFor(() => expect(first.renderRequests().length).toBeGreaterThan(0));
    const host = result.container.firstElementChild;
    const instance = binding.mock.contexts[0];
    const firstManager = [...managers][0]!;
    const unsubscribe = vi.spyOn(firstManager, 'unsubscribeToThemeChanges');
    const cancel = vi.spyOn(firstManager, 'cleanUpTasks');

    result.rerender(view(second));
    await waitFor(() => expect(second.renderRequests().length).toBeGreaterThan(0));
    expect(managers.size).toBe(2);
    expect(first.workers.every((worker) => worker.terminated)).toBe(true);
    expect(unsubscribe).toHaveBeenCalledWith(instance);
    expect(cancel).toHaveBeenCalled();
    expect(firstManager.getStats()).toMatchObject({
      themeSubscribers: 0, activeTasks: 0, queuedTasks: 0,
    });
    expect(result.container.firstElementChild).toBe(host);
    expect(new Set(binding.mock.contexts).size).toBe(1);

    const secondManager = [...managers][1]!;
    const detach = vi.spyOn(secondManager, 'unsubscribeToThemeChanges');
    const cancelSecond = vi.spyOn(secondManager, 'cleanUpTasks');
    result.rerender(view(second, true));
    expect(binding.mock.lastCall?.[0]).toBeUndefined();
    expect(detach).toHaveBeenCalledWith(instance);
    expect(cancelSecond).toHaveBeenCalled();
    expect(secondManager.getStats()).toMatchObject({
      themeSubscribers: 0, activeTasks: 0, queuedTasks: 0,
    });
    expect(new Set(binding.mock.contexts).size).toBe(1);

    result.rerender(view(second));
    expect(binding.mock.lastCall?.[0]).toBe(secondManager);
    expect(new Set(binding.mock.contexts).size).toBe(1);
    result.unmount();
    expect(second.workers.every((worker) => worker.terminated)).toBe(true);
  });

  test('starts disabled and attaches only after opt-in', async () => {
    const pool = createPool();
    const binding = bindingSpy(kind);
    let manager: WorkerPoolManager | undefined;
    const captureManager = (value: WorkerPoolManager) => { manager = value; };
    const view = (disabled: boolean) => (
      <CodeWorkerProvider workerFactory={pool.factory} poolSize={1} highlighterOptions={workerOptions}>
        <PoolProbe onManager={captureManager} />
        <Surface kind={kind} disabled={disabled} />
      </CodeWorkerProvider>
    );
    const result = render(view(true));
    await waitFor(() => expect(manager?.isInitialized()).toBe(true));
    expect(pool.renderRequests()).toHaveLength(0);
    expect(binding.mock.calls.every(([value]) => value === undefined)).toBe(true);

    result.rerender(view(false));
    await waitFor(() => expect(pool.renderRequests().length).toBeGreaterThan(0));
    expect(binding.mock.lastCall?.[0]).toBe(manager);
    expect(new Set(binding.mock.contexts).size).toBe(1);
  });

  test('StrictMode retains only the live pool and cleans it up', async () => {
    const pool = createPool();
    const binding = bindingSpy(kind);
    const terminate = vi.spyOn(WorkerPoolManager.prototype, 'terminate');
    let manager: WorkerPoolManager | undefined;
    const result = render(
      <StrictMode>
        <CodeWorkerProvider workerFactory={pool.factory} poolSize={1} highlighterOptions={workerOptions}>
          <PoolProbe onManager={(value) => { manager = value; }} />
          <Surface kind={kind} />
        </CodeWorkerProvider>
      </StrictMode>
    );
    await waitFor(() => expect(pool.renderRequests().length).toBeGreaterThan(0));
    expect(binding.mock.lastCall?.[0]).toBe(manager);
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(terminate.mock.contexts[0]).not.toBe(manager);
    result.unmount();
    expect(terminate).toHaveBeenCalledTimes(2);
    expect(terminate.mock.contexts[1]).toBe(manager);
    expect(manager!.getStats()).toMatchObject({
      themeSubscribers: 0, activeTasks: 0, queuedTasks: 0,
    });
    expect(pool.workers.every((worker) => worker.terminated)).toBe(true);
  });
});

for (const kind of ['file', 'diff', 'code-view'] as const) {
  test(`${kind} keeps a live editor draft, selection and undo across pool changes`, async () => {
    await preloadHighlighter({ langs: ['typescript'], themes: Object.values(DEFAULT_THEMES) });
    const first = createPool();
    const second = createPool();
    const editors: Editor<'file' | 'file-diff', undefined, undefined>[] = [];
    const createEditor: EditorFactory<undefined, undefined> = (type, options) => {
      const editor = new Editor(type, options);
      editors.push(editor);
      return editor;
    };
    const complete = vi.fn();
    const view = (pool: ReturnType<typeof createPool>, disabled = false) => (
      <CodeWorkerProvider workerFactory={pool.factory} poolSize={1}>
        <EditProvider createEditor={createEditor}>
          {kind === 'file' ? (
            <File file={file} edit disableWorkerPool={disabled} onEditComplete={complete} />
          ) : kind === 'diff' ? (
            <FileDiff fileDiff={fileDiff} edit disableWorkerPool={disabled} onEditComplete={complete} />
          ) : (
            <CodeView
              initialItems={[{ id: 'editing', type: 'file', file, edit: true }]}
              disableWorkerPool={disabled}
              onItemEditComplete={complete}
            />
          )}
        </EditProvider>
      </CodeWorkerProvider>
    );
    const result = render(view(first));
    await waitFor(() => expect(editors[0]?.getText()).toBe(file.contents));
    const editor = editors[0]!;
    act(() => editor.applyEdits([{
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      newText: '// draft\n',
    }]));
    act(() => editor.setSelections([{
      start: { line: 1, character: 2 },
      end: { line: 1, character: 5 },
      direction: 'forward',
    }]));
    const selections = editor.getViewState().selections;
    expect(selections).toHaveLength(1);
    expect(editor.canUndo).toBe(true);

    result.rerender(view(second));
    await waitFor(() => expect(second.workers).toHaveLength(1));
    result.rerender(view(second, true));
    expect(editors).toEqual([editor]);
    expect(editor.getText()).toBe('// draft\n' + file.contents);
    expect(editor.getViewState().selections).toEqual(selections);
    expect(complete).not.toHaveBeenCalled();
    act(() => editor.undo());
    expect(editor.getText()).toBe(file.contents);
  });
}

test('CodeView preserves uncontrolled items and selection when rebinding', async () => {
  const first = createPool();
  const second = createPool();
  const ref = createRef<CodeViewHandle<undefined, undefined>>();
  const view = (pool: ReturnType<typeof createPool>) => (
    <CodeWorkerProvider workerFactory={pool.factory} poolSize={1}>
      <CodeView ref={ref} initialItems={initialItems} />
    </CodeWorkerProvider>
  );
  const result = render(view(first));
  const instance = ref.current!.getInstance();
  act(() => ref.current!.addItems([{ id: 'added', type: 'file', file }]));
  const added = ref.current!.getItem('added');
  const selection = { id: 'added', range: { start: 1, end: 1 } };
  act(() => ref.current!.setSelectedLines(selection));
  result.rerender(view(second));
  await waitFor(() => expect(second.workers).toHaveLength(1));
  expect(ref.current!.getInstance()).toBe(instance);
  expect(ref.current!.getItem('added')).toBe(added);
  expect(ref.current!.getSelectedLines()).toEqual(selection);
});

test('keeps prerendered file markup visible while attaching and replacing pools', async () => {
  const { prerenderedHTML } = await preloadFile({ file });
  await disposeHighlighter();
  const first = createPool();
  const second = createPool();
  const binding = bindingSpy('file');
  const view = (pool: ReturnType<typeof createPool>) => (
    <CodeWorkerProvider workerFactory={pool.factory} poolSize={1}>
      <File file={file} prerenderedHTML={prerenderedHTML} />
    </CodeWorkerProvider>
  );
  const result = render(view(first));
  const host = result.container.firstElementChild!;
  const content = () => host.shadowRoot?.querySelector('[data-content]')?.textContent;
  expect(content()).toContain('const value = 2;');
  await waitFor(() => expect(first.renderRequests().length).toBeGreaterThan(0));
  result.rerender(view(second));
  expect(result.container.firstElementChild).toBe(host);
  expect(content()).toContain('const value = 2;');
  await waitFor(() => expect(second.renderRequests().length).toBeGreaterThan(0));
  expect(content()).toContain('const value = 2;');
  expect(new Set(binding.mock.contexts).size).toBe(1);
});


test('ignores a pending diff refresh from a previous pool', async () => {
  const first = createPool();
  const second = createPool();
  const oldManager = new WorkerPoolManager({ workerFactory: first.factory, poolSize: 1 }, {});
  const nextManager = new WorkerPoolManager({ workerFactory: second.factory, poolSize: 1 }, {});
  const updated = vi.fn();
  const renderer = new DiffHunksRenderer(undefined, undefined, updated, oldManager);
  try {
    await Promise.all([oldManager.initialize(), nextManager.initialize()]);
    const diff = { ...fileDiff, cacheKey: 'pending-refresh' };
    renderer.renderDiff(diff);
    const refresh = renderer.refreshHighlightedResult();
    await waitFor(() => expect(first.renderRequests().length).toBeGreaterThan(0));
    const request = first.renderRequests()[0]!;
    renderer.setWorkerPool(nextManager);
    first.workers[0]!.respond({
      type: 'success',
      requestType: 'diff',
      id: request.id,
      result: oldManager.getPlainDiffAST(diff, 0, 100, true, 4)!,
      options: oldManager.getDiffRenderOptions(),
      sentAt: Date.now(),
    });
    await refresh;
    expect(updated).not.toHaveBeenCalled();
  } finally {
    renderer.cleanUp();
    oldManager.terminate();
    nextManager.terminate();
  }
});


for (const kind of ['file', 'diff', 'code-view'] as const) {
  test(`${kind} retains token interactions when the pool omits token metadata`, async () => {
    const pool = createPool();
    const onTokenClick = vi.fn();
    const result = render(
      <CodeWorkerProvider workerFactory={pool.factory} poolSize={1}>
        <div data-testid="interactive-surface">
          {kind === 'file' ? (
            <File file={file} options={{ onTokenClick }} />
          ) : kind === 'diff' ? (
            <FileDiff fileDiff={fileDiff} options={{ onTokenClick }} />
          ) : (
            <CodeView initialItems={initialItems} options={{ onTokenClick }} />
          )}
        </div>
        <File file={{ ...file, name: 'background.ts' }} />
      </CodeWorkerProvider>
    );
    const findToken = () => {
      const host = result.getByTestId('interactive-surface')
        .querySelector('zeron-code-container');
      return Array.from(host?.shadowRoot?.querySelectorAll('[data-line] span[data-char]') ?? [])
        .find((element) => element.textContent === 'value');
    };
    await waitFor(() => expect(findToken()).toBeDefined());
    fireEvent.click(findToken()!, { composed: true });
    expect(onTokenClick.mock.lastCall?.[0]).toMatchObject({ tokenText: 'value' });
    // Only the metadata-incompatible surface falls back. Other files really
    // dispatch to the production manager and worker transport.
    await waitFor(() => expect(pool.renderRequests().some(
      (request) => request.type === 'file' && request.file.name === 'background.ts'
    )).toBe(true));
    expect(pool.renderRequests().every(
      (request) => request.type === 'file' && request.file.name === 'background.ts'
    )).toBe(true);
  });
}
