export type CodeWorkerFactory = () => Worker;

export function createCodeWorker(): Worker {
  if (typeof Worker === 'undefined') {
    throw new Error('Code Worker can only be created in a browser environment');
  }

  return new Worker(new URL('./worker.js', import.meta.url), {
    name: 'zeron-code-worker',
    type: 'module',
  });
}

export const defaultCodeWorkerFactory: CodeWorkerFactory = createCodeWorker;
