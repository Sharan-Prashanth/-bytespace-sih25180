import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '@/components/ui (plate files)/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];
