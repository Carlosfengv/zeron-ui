'use client';

import { useMemo, type ReactNode } from 'react';

import {
  WorkerPoolContextProvider,
  type WorkerInitializationRenderOptions,
  type WorkerPoolOptions,
} from '#system/code-engine/react/WorkerPoolContext';
import {
  defaultCodeWorkerFactory,
  type CodeWorkerFactory,
} from '#system/code-engine/worker/worker-factory';

export interface CodeWorkerProviderProps {
  children: ReactNode;
  workerFactory?: CodeWorkerFactory;
  poolSize?: number;
  workerInitializationTimeout?: number;
  totalASTLRUCacheSize?: number;
  highlighterOptions?: WorkerInitializationRenderOptions;
}

export function CodeWorkerProvider({
  children,
  workerFactory = defaultCodeWorkerFactory,
  poolSize,
  workerInitializationTimeout,
  totalASTLRUCacheSize,
  highlighterOptions,
}: CodeWorkerProviderProps): React.JSX.Element {
  const poolOptions = useMemo<WorkerPoolOptions>(
    () => ({
      workerFactory,
      poolSize,
      workerInitializationTimeout,
      totalASTLRUCacheSize,
    }),
    [
      poolSize,
      totalASTLRUCacheSize,
      workerFactory,
      workerInitializationTimeout,
    ]
  );
  const resolvedHighlighterOptions = useMemo(
    () => highlighterOptions ?? {},
    [highlighterOptions]
  );

  return (
    <WorkerPoolContextProvider
      poolOptions={poolOptions}
      highlighterOptions={resolvedHighlighterOptions}
    >
      {children}
    </WorkerPoolContextProvider>
  );
}

export {
  createCodeWorker,
  defaultCodeWorkerFactory,
} from '#system/code-engine/worker/worker-factory';
export type {
  CodeWorkerFactory,
  WorkerInitializationRenderOptions,
  WorkerPoolOptions,
};
