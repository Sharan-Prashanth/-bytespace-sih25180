'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from '@/components/ProposalEditor/editor (plate files)/plugins/indent-kit';
import { ToggleElement } from '@/components/ui (plate files)/toggle-node';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
