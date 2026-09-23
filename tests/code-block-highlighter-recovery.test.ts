import { afterEach, expect, test, vi } from 'vitest';

const create = vi.hoisted(() => ({ failures: 1 }));
vi.mock('shiki', async (importOriginal) => {
  const shiki = await importOriginal<typeof import('shiki')>();
  return {
    ...shiki,
    createHighlighter: (
      ...args: Parameters<typeof shiki.createHighlighter>
    ) => {
      if (create.failures-- > 0)
        return Promise.reject(new Error('engine initialization failed'));
      return shiki.createHighlighter(...args);
    },
  };
});
import {
  disposeHighlighter,
  getSharedHighlighter,
} from '../packages/ui/src/system/code-engine/highlighter/shared_highlighter';
import { DEFAULT_THEMES } from '../packages/ui/src/system/code-engine/constants';

afterEach(disposeHighlighter);

test('a rejected engine initialization does not poison subsequent attempts', async () => {
  const settings = { langs: ['python'], themes: Object.values(DEFAULT_THEMES) };
  await expect(getSharedHighlighter(settings)).rejects.toThrow(
    'engine initialization failed'
  );
  const highlighter = await getSharedHighlighter(settings);
  expect(highlighter.getLoadedLanguages()).toContain('python');
});
