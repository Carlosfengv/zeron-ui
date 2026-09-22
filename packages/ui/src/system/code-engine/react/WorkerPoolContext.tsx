'use client';

import {
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  type WorkerInitializationRenderOptions,
  WorkerPoolManager,
  type WorkerPoolOptions,
} from '../worker';

export type { WorkerPoolOptions, WorkerInitializationRenderOptions };

export const WorkerPoolContext: Context<WorkerPoolManager | undefined> =
  createContext<WorkerPoolManager | undefined>(undefined);

interface WorkerPoolContextProps {
  children: ReactNode;
  poolOptions: WorkerPoolOptions;
  highlighterOptions: WorkerInitializationRenderOptions;
}

export function WorkerPoolContextProvider({
  children,
  poolOptions,
  highlighterOptions,
}: WorkerPoolContextProps): React.JSX.Element {
  const [poolManager, setPoolManager] = useState<WorkerPoolManager>();

  useEffect(() => {
    const manager = new WorkerPoolManager(poolOptions, highlighterOptions);
    setPoolManager(manager);
    return () => {
      manager.terminate();
    };
  }, [highlighterOptions, poolOptions]);
  return (
    <WorkerPoolContext.Provider value={poolManager}>
      {children}
    </WorkerPoolContext.Provider>
  );
}

export function useWorkerPool(): WorkerPoolManager | undefined {
  return useContext(WorkerPoolContext);
}
