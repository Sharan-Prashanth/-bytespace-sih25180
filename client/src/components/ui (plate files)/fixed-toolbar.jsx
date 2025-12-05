'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar({ theme = 'light', ...props }) {
  const isDark = theme === 'dark' || theme === 'darkest';
  const isDarkest = theme === 'darkest';
  const bgClass = isDarkest ? 'bg-neutral-900' : isDark ? 'bg-slate-800' : 'bg-white';
  const borderClass = isDarkest ? 'border-neutral-700' : isDark ? 'border-slate-600' : 'border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-black';
  const toolbarHoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDarkest ? '#262626' : isDark ? '#334155' : '#ffffff';
  
  return (
    <Toolbar
      {...props}
      style={{ '--toolbar-hover-bg': toolbarHoverBg, '--input-bg': inputBg }}
      className={cn(
        'sticky top-0 left-0 z-30 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b p-1',
        bgClass,
        borderClass,
        textClass,
        props.className
      )} />
  );
}
