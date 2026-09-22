// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const streamMocks = vi.hoisted(() => ({
  cleanUp: vi.fn(),
  options: [] as Array<Record<string, unknown>>,
  setup: vi.fn(() => Promise.resolve()),
}));

vi.mock('#system/code-engine/components/FileStream', () => ({
  FileStream: class {
    constructor(options: Record<string, unknown>) {
      streamMocks.options.push(options);
    }

    setup = streamMocks.setup;
    cleanUp = streamMocks.cleanUp;
  },
}));

import { CodeStream } from '@zeron/ui/code-block/stream';

afterEach(() => {
  cleanup();
  streamMocks.cleanUp.mockClear();
  streamMocks.options.length = 0;
  streamMocks.setup.mockClear();
});

describe('CodeStream', () => {
  test('keeps the active stream when equivalent inline props rerender', async () => {
    const source = () => new ReadableStream<string>();
    const result = render(
      <CodeStream
        source={source}
        options={{ lang: 'typescript' }}
        onError={() => {}}
      />
    );

    await waitFor(() => expect(streamMocks.setup).toHaveBeenCalledTimes(1));
    expect(streamMocks.options[0]?.containerClassName).toBe('zeron-code-block');

    result.rerender(
      <CodeStream
        source={source}
        options={{ lang: 'typescript' }}
        onError={() => {}}
      />
    );
    expect(streamMocks.setup).toHaveBeenCalledTimes(1);
    expect(streamMocks.cleanUp).not.toHaveBeenCalled();

    result.rerender(
      <CodeStream source={source} options={{ lang: 'javascript' }} />
    );
    await waitFor(() => expect(streamMocks.setup).toHaveBeenCalledTimes(2));
    expect(streamMocks.cleanUp).toHaveBeenCalledTimes(1);
  });

  test('reports source factory failures through onError', async () => {
    const error = new Error('source failed');
    const onError = vi.fn();

    render(
      <CodeStream
        source={() => {
          throw error;
        }}
        onError={onError}
      />
    );

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });
});
