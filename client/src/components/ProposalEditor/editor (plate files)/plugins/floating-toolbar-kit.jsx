'use client';

import { createPlatePlugin } from 'platejs/react';

import { FloatingToolbar } from '@/components/ui (plate files)/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/ui (plate files)/floating-toolbar-buttons';

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];
