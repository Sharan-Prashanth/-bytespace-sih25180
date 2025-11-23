'use client';;
import { TrailingBlockPlugin } from 'platejs';
import { useEditorRef } from 'platejs/react';

import { AlignKit } from '@/components/ProposalEditor/editor (plate files)/plugins/align-kit';
import { AutoformatKit } from '@/components/ProposalEditor/editor (plate files)/plugins/autoformat-kit';
import { BasicBlocksKit } from '@/components/ProposalEditor/editor (plate files)/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/ProposalEditor/editor (plate files)/plugins/basic-marks-kit';
import { BlockMenuKit } from '@/components/ProposalEditor/editor (plate files)/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@/components/ProposalEditor/editor (plate files)/plugins/block-placeholder-kit';
import { BlockSelectionKit } from '@/components/ProposalEditor/editor (plate files)/plugins/block-selection-kit';
import { CalloutKit } from '@/components/ProposalEditor/editor (plate files)/plugins/callout-kit';
import { CodeBlockKit } from '@/components/ProposalEditor/editor (plate files)/plugins/code-block-kit';
import { ColumnKit } from '@/components/ProposalEditor/editor (plate files)/plugins/column-kit';
import { CommentKit } from '@/components/ProposalEditor/editor (plate files)/plugins/comment-kit';
import { CursorOverlayKit } from '@/components/ProposalEditor/editor (plate files)/plugins/cursor-overlay-kit';
import { DiscussionKit } from '@/components/ProposalEditor/editor (plate files)/plugins/discussion-kit';
import { DndKit } from '@/components/ProposalEditor/editor (plate files)/plugins/dnd-kit';
import { SuggestionKit } from '@/components/ProposalEditor/editor (plate files)/plugins/suggestion-kit';
import { DocxKit } from '@/components/ProposalEditor/editor (plate files)/plugins/docx-kit';
import { ExitBreakKit } from '@/components/ProposalEditor/editor (plate files)/plugins/exit-break-kit';
import { FixedToolbarKit } from '@/components/ProposalEditor/editor (plate files)/plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from '@/components/ProposalEditor/editor (plate files)/plugins/floating-toolbar-kit';
import { FontKit } from '@/components/ProposalEditor/editor (plate files)/plugins/font-kit';
import { LineHeightKit } from '@/components/ProposalEditor/editor (plate files)/plugins/line-height-kit';
import { LinkKit } from '@/components/ProposalEditor/editor (plate files)/plugins/link-kit';
import { ListKit } from '@/components/ProposalEditor/editor (plate files)/plugins/list-kit';
import { MarkdownKit } from '@/components/ProposalEditor/editor (plate files)/plugins/markdown-kit';
import { MathKit } from '@/components/ProposalEditor/editor (plate files)/plugins/math-kit';
import { MediaKit } from '@/components/ProposalEditor/editor (plate files)/plugins/media-kit';
import { TableKit } from '@/components/ProposalEditor/editor (plate files)/plugins/table-kit';
import { TocKit } from '@/components/ProposalEditor/editor (plate files)/plugins/toc-kit';

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...TocKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...MediaKit,
  ...LinkKit,
  // ...MentionKit, // Disabled - not needed

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Editing
  // ...SlashKit, // Disabled - slash commands not needed
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockSelectionKit,
  // ...BlockMenuKit, // Disabled - block menu not needed
  ...CommentKit,
  ...DiscussionKit,
  ...SuggestionKit,
  ...DndKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  // ...FixedToolbarKit, // Disabled - manually added in component
  // ...FloatingToolbarKit, // Disabled - floating toolbar not needed
];

export const useEditor = () => useEditorRef();
