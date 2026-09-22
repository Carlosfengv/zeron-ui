// @vitest-environment jsdom

import { useEffect } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { CodeWorkerProvider } from '@zeron/ui/code-block/worker';
import { useWorkerPool } from '../packages/ui/src/system/code-engine/react';
import type { WorkerPoolManager } from '../packages/ui/src/system/code-engine/worker';

class MockWorker {
  readonly listeners = new Map<string, Set<EventListener>>();
  terminated = false;

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(request: { id: string; type: string }): void {
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

  terminate(): void {
    this.terminated = true;
  }
}

function Probe({ onManager }: { onManager(manager: WorkerPoolManager): void }) {
  const manager = useWorkerPool();
  useEffect(() => {
    if (manager != null) onManager(manager);
  }, [manager, onManager]);
  return null;
}

afterEach(cleanup);

describe('CodeWorkerProvider', () => {
  test('isolates pools and only terminates the provider that unmounts', async () => {
    const workersA: MockWorker[] = [];
    const workersB: MockWorker[] = [];
    const managersA: WorkerPoolManager[] = [];
    const managersB: WorkerPoolManager[] = [];
    const factoryA = () => {
      const worker = new MockWorker();
      workersA.push(worker);
      return worker as unknown as Worker;
    };
    const factoryB = () => {
      const worker = new MockWorker();
      workersB.push(worker);
      return worker as unknown as Worker;
    };
    const onManagerA = (manager: WorkerPoolManager) => managersA.push(manager);
    const onManagerB = (manager: WorkerPoolManager) => managersB.push(manager);
    const view = (showA: boolean) => (
      <>
        {showA ? (
          <CodeWorkerProvider key="a" workerFactory={factoryA} poolSize={1}>
            <Probe onManager={onManagerA} />
          </CodeWorkerProvider>
        ) : null}
        <CodeWorkerProvider key="b" workerFactory={factoryB} poolSize={1}>
          <Probe onManager={onManagerB} />
        </CodeWorkerProvider>
      </>
    );

    const result = render(view(true));
    await waitFor(() => {
      expect(workersA).toHaveLength(1);
      expect(workersB).toHaveLength(1);
      expect(managersA).toHaveLength(1);
      expect(managersB).toHaveLength(1);
    });
    expect(managersA[0]).not.toBe(managersB[0]);

    result.rerender(view(false));
    await waitFor(() => expect(workersA[0]?.terminated).toBe(true));
    expect(workersB[0]?.terminated).toBe(false);

    result.unmount();
    expect(workersB[0]?.terminated).toBe(true);
  });
});
