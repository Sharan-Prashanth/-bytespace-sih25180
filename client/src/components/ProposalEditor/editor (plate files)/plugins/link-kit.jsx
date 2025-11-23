'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/components/ui (plate files)/link-node';
import { LinkFloatingToolbar } from '@/components/ui (plate files)/link-toolbar';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
