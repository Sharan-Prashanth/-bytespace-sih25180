'use client';

import * as React from 'react';
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  SpellCheck,
  MessageSquareTextIcon,
  PencilLineIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly, useEditorRef, useEditorPlugin } from 'platejs/react';

import { LinkToolbarButton } from '@/components/ui (plate files)/link-toolbar-button';
import { MarkToolbarButton } from '@/components/ui (plate files)/mark-toolbar-button';
import { ToolbarButton, ToolbarGroup, ToolbarSeparator } from '@/components/ui (plate files)/toolbar';
import { TurnIntoToolbarButton } from '@/components/ui (plate files)/turn-into-toolbar-button';
import { commentPlugin } from '@/components/ProposalEditor/editor (plate files)/plugins/comment-kit';
import { suggestionPlugin } from '@/components/ProposalEditor/editor (plate files)/plugins/suggestion-kit';

import { cn } from '@/lib/utils';

/**
 * Suggestion Mode Toolbar Button
 * Toggles suggestion mode on/off for the editor
 */
function SuggestionModeButton({ theme }) {
  const { getOption, setOption } = useEditorPlugin(suggestionPlugin);
  const isSuggesting = getOption('isSuggesting');
  const isDark = theme === 'dark' || theme === 'darkest';

  const handleClick = React.useCallback(() => {
    setOption('isSuggesting', !isSuggesting);
    console.log('[SuggestionMode] Toggled to:', !isSuggesting);
  }, [setOption, isSuggesting]);

  return (
    <ToolbarButton
      className={cn(
        isSuggesting && (isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'),
        'gap-1'
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      tooltip={isSuggesting ? 'Exit Suggestion Mode' : 'Enter Suggestion Mode'}
    >
      <PencilLineIcon className="w-4 h-4" />
      <span className="text-xs hidden sm:inline">{isSuggesting ? 'Suggesting' : 'Suggest'}</span>
    </ToolbarButton>
  );
}

/**
 * Add Comment Button
 * Creates a draft comment on selected text
 */
function AddCommentButton({ theme }) {
  const editor = useEditorRef();
  const isDark = theme === 'dark' || theme === 'darkest';

  const handleClick = React.useCallback(() => {
    editor.getTransforms(commentPlugin).comment.setDraft();
  }, [editor]);

  return (
    <ToolbarButton
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      tooltip="Add Comment (Ctrl+Shift+M)"
      data-plate-prevent-overlay
    >
      <MessageSquareTextIcon className="w-4 h-4" />
      <span className="text-xs hidden sm:inline">Comment</span>
    </ToolbarButton>
  );
}

/**
 * Make Suggestion Button (for inline text edits)
 * Only visible when in suggestion mode and text is selected
 */
function MakeSuggestionButtons({ theme }) {
  const { getOption } = useEditorPlugin(suggestionPlugin);
  const isSuggesting = getOption('isSuggesting');
  const isDark = theme === 'dark' || theme === 'darkest';

  if (!isSuggesting) return null;

  return (
    <>
      <ToolbarSeparator />
      <ToolbarGroup>
        <span className={cn(
          'text-xs px-2 py-1 rounded',
          isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
        )}>
          Suggestion Mode Active - Your edits will be tracked
        </span>
      </ToolbarGroup>
    </>
  );
}

/**
 * Custom floating toolbar buttons with role-based restrictions.
 * 
 * Props:
 * - userRole: Current user's role (PI, CI, EXPERT_REVIEWER, CMPDI_MEMBER, etc.)
 * - canEdit: Whether user can make direct edits
 * - canSuggest: Whether user is in suggestion mode (view only)
 * - onFixSpelling: Callback for fixing spelling mistakes (AI feature)
 * - theme: Current theme ('light', 'dark', 'darkest')
 */
export function CollaborateFloatingToolbarButtons({
  userRole = 'USER',
  canEdit = false,
  canSuggest = false,
  onFixSpelling = null,
  theme = 'light'
}) {
  const readOnly = useEditorReadOnly();
  const isDark = theme === 'dark' || theme === 'darkest';

  // Check if user is PI or CI (can use AI features)
  const isPIorCI = ['PI', 'CI', 'SUPER_ADMIN'].includes(userRole) || 
                   userRole?.includes?.('PRINCIPAL') || 
                   userRole?.includes?.('CO_INVESTIGATOR');

  // Committee members and experts cannot use AI features
  const isCommitteeOrExpert = ['EXPERT_REVIEWER', 'CMPDI_MEMBER', 'TSSRC_MEMBER', 'SSRC_MEMBER'].includes(userRole);

  // If completely read-only (view mode) and cannot suggest, don't show toolbar
  if (readOnly && !canSuggest) return null;

  // COMMENT MODE: For committee members and experts who can only add comments
  // They cannot edit text or make suggestions - only comments
  if (canSuggest && !canEdit) {
    return (
      <ToolbarGroup>
        {/* Add Comment Button - primary action for reviewers */}
        <AddCommentButton theme={theme} />
        
        <span className={cn(
          'text-xs px-2 py-1 rounded ml-2',
          isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
        )}>
          Select text to add a comment
        </span>
      </ToolbarGroup>
    );
  }

  // EDIT MODE: For PI/CI who can directly edit
  return (
    <>
      {canEdit && (
        <>
          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (Ctrl+B)">
              <BoldIcon className="w-4 h-4" />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (Ctrl+I)">
              <ItalicIcon className="w-4 h-4" />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (Ctrl+U)">
              <UnderlineIcon className="w-4 h-4" />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Strikethrough (Ctrl+Shift+S)">
              <StrikethroughIcon className="w-4 h-4" />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (Ctrl+E)">
              <Code2Icon className="w-4 h-4" />
            </MarkToolbarButton>

            <LinkToolbarButton />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            {/* Comment Button for editors too */}
            <AddCommentButton theme={theme} />
          </ToolbarGroup>

          {/* AI Features - Only for PI and CI */}
          {isPIorCI && !isCommitteeOrExpert && onFixSpelling && (
            <>
              <ToolbarSeparator />
              <ToolbarGroup>
                <button
                  type="button"
                  onClick={onFixSpelling}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isDark 
                      ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                      : 'hover:bg-black/5 text-black/70 hover:text-black'
                  }`}
                  title="Fix spelling mistakes using AI"
                >
                  <SpellCheck className="w-4 h-4" />
                  <span>Fix Spelling</span>
                </button>
              </ToolbarGroup>
            </>
          )}
        </>
      )}
    </>
  );
}

export default CollaborateFloatingToolbarButtons;
