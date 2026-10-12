// @vitest-environment jsdom

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { CodeView } from '../../packages/ui/src/system/code-engine/components/CodeView';
import { clearRenderQueue } from '../../packages/ui/src/system/code-engine/managers/UniversalRenderingManager';

let deliverResize: ResizeObserverCallback;
let frame: FrameRequestCallback | undefined;
let view: CodeView;
let root: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn(() => { frame = undefined; }));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { deliverResize = callback; }
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  root = document.createElement('div');
  document.body.append(root);
  view = new CodeView();
  view.setup(root);
});

afterEach(() => {
  view.cleanUp();
  clearRenderQueue();
  root.remove();
  frame = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function notify(target: Element, height: number) {
  deliverResize([{
    target,
    borderBoxSize: [{ blockSize: height, inlineSize: 320 }],
    contentBoxSize: [{ blockSize: height, inlineSize: 320 }],
    devicePixelContentBoxSize: [{ blockSize: height, inlineSize: 320 }],
    contentRect: new DOMRect(0, 0, 320, height),
  }], {} as ResizeObserver);
}

test('defers observed-container writes and combines deliveries into one frame', () => {
  const render = vi.spyOn(view, 'render');
  const before = root.innerHTML;
  const sticky = root.firstElementChild!.children[1]!;
  notify(sticky, 40);
  notify(sticky, 48);
  notify(root, 384);

  expect(render).not.toHaveBeenCalled();
  expect(root.innerHTML).toBe(before);
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  frame!(16);
  expect(render).toHaveBeenCalledTimes(1);
});

test('cancels a pending resize when the viewer is removed', () => {
  const render = vi.spyOn(view, 'render');
  notify(root, 384);
  expect(frame).toBeDefined();
  view.cleanUp();

  expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
  expect(frame).toBeUndefined();
  expect(render).not.toHaveBeenCalled();
});
