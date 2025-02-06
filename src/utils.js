/*****************************************************
 * src/utils.js
 *
 * Helper functions used by AIResponseAlert and its
 * sub-components.
 *****************************************************/
import { marked } from 'marked';

export function parseMessageToBlocks(message) {
  const parts = [];
  let currentIndex = 0;
  while (currentIndex < message.length) {
    const startFence = message.indexOf('```', currentIndex);
    if (startFence === -1) {
      parts.push({ type: 'text', content: message.slice(currentIndex) });
      break;
    }
    if (startFence > currentIndex) {
      parts.push({
        type: 'text',
        content: message.slice(currentIndex, startFence),
      });
    }
    const endFence = message.indexOf('```', startFence + 3);
    if (endFence === -1) {
      parts.push({ type: 'code', content: message.slice(startFence) });
      break;
    } else {
      parts.push({
        type: 'code',
        content: message.slice(startFence, endFence + 3),
      });
      currentIndex = endFence + 3;
    }
  }
  return parts;
}

export function getLanguageFromFence(content) {
  const lines = content.split('\n');
  const firstLine = lines[0].replace(/```/, '').trim();
  return firstLine || 'javascript';
}

export function getCodeContent(content) {
  return content.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
}

// Configure marked to render non-code text with breaks.
marked.setOptions({
  breaks: true,
});
