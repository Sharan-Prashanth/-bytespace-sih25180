'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 left-0 z-50 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b border-gray-200 bg-white p-1',
        props.className
      )} />
  );
}
