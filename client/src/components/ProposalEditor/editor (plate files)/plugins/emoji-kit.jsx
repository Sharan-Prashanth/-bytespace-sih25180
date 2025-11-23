'use client';

import emojiMartData from '@emoji-mart/data';
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react';

import { EmojiInputElement } from '@/components/ui (plate files)/emoji-node';

export const EmojiKit = [
  EmojiPlugin.configure({
    options: { data: emojiMartData },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
