'use client';;
import { BaseSuggestionPlugin } from '@platejs/suggestion';
import { isSlateEditor, isSlateString } from 'platejs';
import { toTPlatePlugin } from 'platejs/react';

import {
  SuggestionLeaf,
  SuggestionLineBreak,
} from '@/components/ui (plate files)/suggestion-node';

export const suggestionPlugin = toTPlatePlugin(BaseSuggestionPlugin, () => ({
  options: {
    activeId: null,
    currentUserId: null, // Will be set by AdvancedProposalEditor when user is available
    hoverId: null,
    isSuggesting: false, // Enable suggestion mode - when true, edits create suggestions instead of direct changes
    uniquePathMap: new Map(),
  },
})).configure({
  handlers: {
    // unset active suggestion when clicking outside of suggestion
    onClick: ({ api, event, setOption, type }) => {
      let leaf = event.target;
      let isSet = false;

      const isBlockLeaf = leaf.dataset.blockSuggestion === 'true';

      const unsetActiveSuggestion = () => {
        setOption('activeId', null);
        isSet = true;
      };

      if (!isSlateString(leaf) && !isBlockLeaf) {
        unsetActiveSuggestion();
      }

      while (leaf.parentElement && !isSlateEditor(leaf.parentElement)) {
        const isBlockSuggestion = leaf.dataset.blockSuggestion === 'true';

        if (leaf.classList.contains(`slate-${type}`) || isBlockSuggestion) {
          const suggestionEntry = api.suggestion.node({
            isText: !isBlockSuggestion,
          });

          if (!suggestionEntry) {
            unsetActiveSuggestion();

            break;
          }

          const id = api.suggestion.nodeId(suggestionEntry[0]);
          setOption('activeId', id ?? null);

          isSet = true;

          break;
        }

        leaf = leaf.parentElement;
      }

      if (!isSet) unsetActiveSuggestion();
    },
  },
  render: {
    belowNodes: SuggestionLineBreak,
    node: SuggestionLeaf,
  },
});

export const SuggestionKit = [suggestionPlugin];
