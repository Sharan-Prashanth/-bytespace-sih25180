/**
 * Transform chunks like [**,bold,**] to [**bold**] make the md deserializer
 * happy.
 *
 * @experimental
 */
export const markdownJoinerTransform =
  () => () => {
    const joiner = new MarkdownJoiner();
    let lastTextDeltaId;
    let textStreamEnded = false;

    return new TransformStream({
      async flush(controller) {
        // Only flush if we haven't seen text-end yet
        if (!textStreamEnded) {
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta'
            });
          }
        }
      },
      async transform(chunk, controller) {
        if (chunk.type === 'text-delta') {
          lastTextDeltaId = chunk.id;
          const processedText = joiner.processText(chunk.text);
          if (processedText) {
            controller.enqueue({
              ...chunk,
              text: processedText,
            });
            await delay(joiner.delayInMs);
          }
        } else if (chunk.type === 'text-end') {
          // Flush any remaining buffer before text-end
          const remaining = joiner.flush();
          if (remaining && lastTextDeltaId) {
            controller.enqueue({
              id: lastTextDeltaId,
              text: remaining,
              type: 'text-delta'
            });
          }
          textStreamEnded = true;
          controller.enqueue(chunk);
        } else {
          controller.enqueue(chunk);
        }
      },
    });
  };

const DEFAULT_DELAY_IN_MS = 10;
const NEST_BLOCK_DELAY_IN_MS = 100;

export class MarkdownJoiner {
  buffer = '';
  documentCharacterCount = 0;
  isBuffering = false;
  streamingCodeBlock = false;
  streamingLargeDocument = false;
  streamingTable = false;
  delayInMs = DEFAULT_DELAY_IN_MS;

  clearBuffer() {
    this.buffer = '';
    this.isBuffering = false;
  }
  isCompleteBold() {
    const boldPattern = /\*\*.*?\*\*/;

    return boldPattern.test(this.buffer);
  }

  isCompleteCodeBlockEnd() {
    return this.buffer.trimEnd() === '```';
  }

  isCompleteCodeBlockStart() {
    const codeLinePattern = /```[^\s]+/;
    return codeLinePattern.test(this.buffer);
  }

  isCompleteLink() {
    const linkPattern = /^\[.*?\]\(.*?\)$/;
    return linkPattern.test(this.buffer);
  }

  isCompleteList() {
    const unorderedListPattern = /^[*-]\s+.+/;
    const todoListPattern = /^[*-]\s+\[[ xX]\]\s+.+/;
    const orderedListPattern = /^\d+\.\s+.+/;

    if (unorderedListPattern.test(this.buffer) && this.buffer.includes('['))
      return todoListPattern.test(this.buffer);

    return (unorderedListPattern.test(this.buffer) ||
    orderedListPattern.test(this.buffer) || todoListPattern.test(this.buffer));
  }

  isCompleteMdxTag() {
    const mdxTagPattern = /<([A-Za-z][A-Za-z0-9\-_]*)>/;

    return mdxTagPattern.test(this.buffer);
  }

  isCompleteTableStart() {
    return this.buffer.startsWith('|') && this.buffer.endsWith('|');
  }

  isFalsePositive(char) {
    // when link is not complete, even if ths buffer is more than 30 characters, it is not a false positive
    if (this.buffer.startsWith('[') && this.buffer.includes('http')) {
      return false;
    }

    return char === '\n' || this.buffer.length > 30;
  }

  isLargeDocumentStart() {
    return this.documentCharacterCount > 2500;
  }

  isListStartChar(char) {
    return char === '-' || char === '*' || /^[0-9]$/.test(char);
  }

  isTableExisted() {
    return this.buffer.length > 10 && !this.buffer.includes('|');
  }

  flush() {
    const remaining = this.buffer;
    this.clearBuffer();
    return remaining;
  }

  processText(text) {
    let output = '';

    for (const char of text) {
      if (
        this.streamingCodeBlock ||
        this.streamingTable ||
        this.streamingLargeDocument
      ) {
        this.buffer += char;

        if (char === '\n') {
          output += this.buffer;
          this.clearBuffer();
        }

        if (this.isCompleteCodeBlockEnd() && this.streamingCodeBlock) {
          this.streamingCodeBlock = false;
          this.delayInMs = DEFAULT_DELAY_IN_MS;

          output += this.buffer;
          this.clearBuffer();
        }

        if (this.isTableExisted() && this.streamingTable) {
          this.streamingTable = false;
          this.delayInMs = DEFAULT_DELAY_IN_MS;

          output += this.buffer;
          this.clearBuffer();
        }
      } else if (this.isBuffering) {
        this.buffer += char;

        if (this.isCompleteCodeBlockStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingCodeBlock = true;
          continue;
        }

        if (this.isCompleteTableStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingTable = true;
          continue;
        }

        if (this.isLargeDocumentStart()) {
          this.delayInMs = NEST_BLOCK_DELAY_IN_MS;
          this.streamingLargeDocument = true;
          continue;
        }

        if (
          this.isCompleteBold() ||
          this.isCompleteMdxTag() ||
          this.isCompleteList() ||
          this.isCompleteLink()
        ) {
          output += this.buffer;
          this.clearBuffer();
        } else if (this.isFalsePositive(char)) {
          // False positive - flush buffer as raw text
          output += this.buffer;
          this.clearBuffer();
        }
      } else {
        // Check if we should start buffering

        if (
          char === '*' ||
          char === '<' ||
          char === '`' ||
          char === '|' ||
          char === '[' ||
          this.isListStartChar(char)
        ) {
          this.buffer = char;
          this.isBuffering = true;
        } else {
          // Pass through character directly
          output += char;
        }
      }
    }

    this.documentCharacterCount += text.length;
    return output;
  }
}

async function delay(delayInMs) {
  return delayInMs == null
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, delayInMs));
}
