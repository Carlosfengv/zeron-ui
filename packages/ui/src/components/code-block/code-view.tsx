'use client';

import { forwardRef, useMemo } from 'react';

import {
  CodeView as EngineCodeView,
  type CodeViewHandle,
  type CodeViewProps as EngineCodeViewProps,
  type CodeViewReactOptions,
} from '#system/code-engine/react/CodeView';
import { cn } from '#system/utils';

import { getCodeBlockStyle } from './code-block-theme';
import type { CodeBlockPresentationProps } from './code-block-types';
import { codeBlockSurfaceClassName } from './code-block-styles';

export type CodeViewProps<
  LAnnotation = undefined,
  Caret = undefined,
> = EngineCodeViewProps<LAnnotation, Caret> & CodeBlockPresentationProps;

type CodeViewComponent = <LAnnotation = undefined, Caret = undefined>(
  props: CodeViewProps<LAnnotation, Caret> & {
    ref?: React.Ref<CodeViewHandle<LAnnotation, Caret>>;
  }
) => React.JSX.Element;

function CodeViewInner<LAnnotation = undefined, Caret = undefined>(
  {
    appearance = 'zeron',
    themeMode = 'inherit',
    className,
    options,
    style,
    ...props
  }: CodeViewProps<LAnnotation, Caret>,
  ref: React.ForwardedRef<CodeViewHandle<LAnnotation, Caret>>
): React.JSX.Element {
  const itemClassName = cn(
    options?.itemClassName,
    appearance === 'zeron' && 'zeron-code-block'
  );
  const resolvedOptions = useMemo(
    () => ({
      ...options,
      itemClassName,
      // Match the product typography/header/body spacing used by the rendered items.
      itemMetrics: appearance === 'zeron'
        ? {
            ...options?.itemMetrics,
            lineHeight: options?.itemMetrics?.lineHeight ?? 24,
            diffHeaderHeight: options?.itemMetrics?.diffHeaderHeight ?? 36,
            spacing: options?.itemMetrics?.spacing ?? 6,
          }
        : options?.itemMetrics,
    }),
    [appearance, itemClassName, options]
  );

  return (
    <EngineCodeView
      {...(props as EngineCodeViewProps<LAnnotation, Caret>)}
      ref={ref}
      options={resolvedOptions}
      className={cn(
        'overflow-auto',
        codeBlockSurfaceClassName,
        className
      )}
      style={getCodeBlockStyle(themeMode, style)}
    />
  );
}

export const CodeView = forwardRef(CodeViewInner) as CodeViewComponent;

export type { CodeViewHandle, CodeViewReactOptions };
