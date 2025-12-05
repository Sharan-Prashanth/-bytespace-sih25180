'use client';

import * as React from 'react';

import { flip, offset, useFloatingToolbar, useFloatingToolbarState } from '@platejs/floating';
import { KEYS } from 'platejs';
import {
  useEditorId,
  useEventEditorValue,
  usePluginOption,
} from 'platejs/react';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, 'open');

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen || isAIChatOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: [
            'top-start',
            'top-end',
            'bottom-start',
            'bottom-end',
          ],
          padding: 12,
        }),
      ],
      placement: 'top',
      ...state?.floatingOptions,
    },
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  // Store refs in a stable ref object to prevent callback recreation
  const refsRef = React.useRef({ floatingRef: null, propsRef: null });
  refsRef.current.floatingRef = floatingRef;
  refsRef.current.propsRef = props.ref;

  // Use stable callback ref - no dependencies to prevent recreation
  const setRefs = React.useCallback((node) => {
    const { floatingRef: fRef, propsRef } = refsRef.current;
    // Set floating ref
    if (fRef) {
      if (typeof fRef === 'function') {
        fRef(node);
      } else {
        fRef.current = node;
      }
    }
    // Set external ref from props
    if (propsRef) {
      if (typeof propsRef === 'function') {
        propsRef(node);
      } else {
        propsRef.current = node;
      }
    }
  }, []);

  if (hidden) return null;

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={setRefs}
        className={cn(
          'absolute z-50 scrollbar-hide overflow-x-auto rounded-md border bg-popover p-1 whitespace-nowrap opacity-100 shadow-md print:hidden',
          'max-w-[80vw]',
          className
        )}>
        {children}
      </Toolbar>
    </div>
  );
}
