import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '@/components/ui (plate files)/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];
