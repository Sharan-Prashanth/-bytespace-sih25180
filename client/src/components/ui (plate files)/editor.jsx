'use client';;
import * as React from 'react';

import { cva } from 'class-variance-authority';
import { PlateContainer, PlateContent, PlateView } from 'platejs/react';

import { cn } from '@/lib/utils';

const editorContainerVariants = cva(
  'relative w-full cursor-text overflow-y-auto caret-primary select-text selection:bg-brand/25 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        comment: cn(
          'flex flex-wrap justify-between gap-1 px-1 py-0.5 text-sm',
          'rounded-md border-[1.5px] border-transparent',
          'has-[[data-slate-editor]:focus]:border-brand/50 has-[[data-slate-editor]:focus]:ring-2 has-[[data-slate-editor]:focus]:ring-brand/30',
          'has-aria-disabled:border-input'
        ),
        default: 'h-full',
        demo: 'h-[650px]',
        select: cn(
          'group rounded-md border border-input ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'has-data-readonly:w-fit has-data-readonly:cursor-default has-data-readonly:border-transparent has-data-readonly:focus-within:[box-shadow:none]'
        ),
      },
    },
  }
);

export function EditorContainer({
  className,
  variant,
  theme = 'light',
  ...props
}) {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const bgClass = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const tableCellBg = isDarkest ? '#171717' : isDark ? '#1e293b' : '#ffffff';
  const tableBorderColor = isDarkest ? '#525252' : isDark ? '#64748b' : '#e5e7eb';
  
  return (
    <PlateContainer
      className={cn(
        'ignore-click-outside/toolbar',
        editorContainerVariants({ variant }),
        bgClass,
        className
      )}
      style={{ '--table-cell-bg': tableCellBg, '--table-border-color': tableBorderColor }}
      {...props} />
  );
}

const editorVariants = cva(cn(
  'group/editor',
  'relative w-full cursor-text overflow-x-hidden break-words whitespace-pre-wrap select-text',
  'rounded-md ring-offset-background focus-visible:outline-none',
  'placeholder:opacity-100!',
  '[&_strong]:font-bold'
), {
  defaultVariants: {
    variant: 'default',
  },
  variants: {
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
    focused: {
      true: 'ring-2 ring-ring ring-offset-2',
    },
    variant: {
      ai: 'w-full px-0 text-base md:text-sm',
      aiChat:
        'max-h-[min(70vh,320px)] w-full max-w-[700px] overflow-y-auto px-3 py-2 text-base md:text-sm',
      comment: cn('rounded-none border-none bg-transparent text-sm'),
      default:
        'size-full px-4 pt-4 pb-72 text-base',
      demo: 'size-full px-4 pt-4 pb-72 text-base',
      fullWidth: 'size-full px-4 pt-4 pb-72 text-base',
      none: '',
      select: 'px-3 py-2 text-base data-readonly:w-fit',
    },
  },
});

export const Editor = React.forwardRef(({ className, disabled, focused, variant, theme = 'light', ...props }, ref) => {
  const isDark = theme === 'dark' || theme === 'darkest';
  const bgClass = theme === 'darkest' ? 'bg-neutral-900' : theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  const placeholderClass = isDark ? 'placeholder:text-slate-500 **:data-slate-placeholder:text-slate-500' : 'placeholder:text-slate-400 **:data-slate-placeholder:text-slate-400';
  
  return (
    <PlateContent
      ref={ref}
      className={cn(editorVariants({
        disabled,
        focused,
        variant,
      }), bgClass, textClass, placeholderClass, '**:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2', className)}
      disabled={disabled}
      disableDefaultStyles
      {...props} />
  );
});

Editor.displayName = 'Editor';

export function EditorView({
  className,
  variant,
  theme = 'light',
  ...props
}) {
  const isDark = theme === 'dark' || theme === 'darkest';
  const bgClass = theme === 'darkest' ? 'bg-neutral-900' : theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  
  return (<PlateView {...props} className={cn(editorVariants({ variant }), bgClass, textClass, className)} />);
}

EditorView.displayName = 'EditorView';
