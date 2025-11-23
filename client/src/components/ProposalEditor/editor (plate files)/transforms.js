'use client';;
import { insertCallout } from '@platejs/callout';
import { insertCodeBlock, toggleCodeBlock } from '@platejs/code-block';
import { insertDate } from '@platejs/date';
import { insertExcalidraw } from '@platejs/excalidraw';
import { insertColumnGroup, toggleColumnGroup } from '@platejs/layout';
import { triggerFloatingLink } from '@platejs/link/react';
import { insertEquation, insertInlineEquation } from '@platejs/math';
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from '@platejs/media';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { TablePlugin } from '@platejs/table/react';
import { insertToc } from '@platejs/toc';
import { KEYS, PathApi } from 'platejs';

const ACTION_THREE_COLUMNS = 'action_three_columns';

const insertList = (editor, type) => {
  editor.tf.insertNodes(editor.api.create.block({
    indent: 1,
    listStyleType: type,
  }), { select: true });
};

const insertBlockMap = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: (editor) =>
    insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: (editor) => insertCallout(editor, { select: true }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.excalidraw]: (editor) => insertExcalidraw(editor, {}, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) => {
    // Trigger file upload (stores as base64, will upload to S3 on proposal submission)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const file = e.target.files?.[0];
      if (!file) {
        // User cancelled - don't do anything
        input.remove();
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        input.remove();
        return;
      }

      // Read file and convert to base64 (will upload to S3 on proposal submission)
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        
        // Insert image node directly with base64 data URL
        const imageNode = {
          type: KEYS.img,
          url: dataUrl,
          width: '100%',
          children: [{ text: '' }],
        };
        
        // Insert the image node
        editor.tf.insertNodes([imageNode]);
        
        // Move selection after the image
        const path = editor.selection?.focus?.path || [0];
        editor.tf.select({ path: [path[0] + 1, 0], offset: 0 });
        
        input.remove();
      };
      reader.onerror = () => {
        alert('Error reading file');
        input.remove();
      };
      reader.readAsDataURL(file);
    };
    
    // Cancel handler
    input.oncancel = () => {
      input.remove();
    };
    
    input.click();
  },
  [KEYS.mediaEmbed]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.table]: (editor) =>
    editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: (editor) => insertToc(editor, { select: true }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
};

const insertInlineMap = {
  [KEYS.date]: (editor) => insertDate(editor, { select: true }),
  [KEYS.inlineEquation]: (editor) =>
    insertInlineEquation(editor, '', { select: true }),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
};

export const insertBlock = (
  editor,
  type,
  options = {}
) => {
  const { upsert = false } = options;

  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();

    if (!block) return;

    const [currentNode, path] = block;
    const isCurrentBlockEmpty = editor.api.isEmpty(currentNode);
    const currentBlockType = getBlockType(currentNode);

    const isSameBlockType = type === currentBlockType;

    if (upsert && isCurrentBlockEmpty && isSameBlockType) {
      return;
    }

    if (type in insertBlockMap) {
      insertBlockMap[type](editor, type);
    } else {
      editor.tf.insertNodes(editor.api.create.block({ type }), {
        at: PathApi.next(path),
        select: true,
      });
    }

    if (!isSameBlockType) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

export const insertInlineElement = (editor, type) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type);
  }
};

const setList = (
  editor,
  type,
  entry
) => {
  editor.tf.setNodes(editor.api.create.block({
    indent: 1,
    listStyleType: type,
  }), {
    at: entry[1],
  });
};

const setBlockMap = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [ACTION_THREE_COLUMNS]: (editor) => toggleColumnGroup(editor, { columns: 3 }),
  [KEYS.codeBlock]: (editor) => toggleCodeBlock(editor),
};

export const setBlockType = (
  editor,
  type,
  {
    at
  } = {}
) => {
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry) => {
      const [node, path] = entry;

      if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, 'indent'], { at: path });
      }
      if (type in setBlockMap) {
        return setBlockMap[type](editor, type, entry);
      }
      if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path });
      }
    };

    if (at) {
      const entry = editor.api.node(at);

      if (entry) {
        setEntry(entry);

        return;
      }
    }

    const entries = editor.api.blocks({ mode: 'lowest' });

    entries.forEach((entry) => setEntry(entry));
  });
};

export const getBlockType = (block) => {
  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol;
    } else if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo;
    } else {
      return KEYS.ul;
    }
  }

  return block.type;
};
