/*****************************************************
 * src/utils.js
 *
 * Helper functions used by AIResponseAlert and its
 * sub-components.
 * 
 * Updated parseMessageToBlocks to detect code heuristically
 * if triple backticks are missing.
 *****************************************************/
import { marked } from 'marked';

export function parseMessageToBlocks(message) {
  // If triple backticks exist, use them.
  if (message.includes("```")) {
    const parts = [];
    let currentIndex = 0;
    while (currentIndex < message.length) {
      const startFence = message.indexOf("```", currentIndex);
      if (startFence === -1) {
        parts.push({ type: "text", content: message.slice(currentIndex) });
        break;
      }
      if (startFence > currentIndex) {
        parts.push({ type: "text", content: message.slice(currentIndex, startFence) });
      }
      const endFence = message.indexOf("```", startFence + 3);
      if (endFence === -1) {
        parts.push({ type: "code", content: message.slice(startFence) });
        break;
      } else {
        parts.push({ type: "code", content: message.slice(startFence, endFence + 3) });
        currentIndex = endFence + 3;
      }
    }
    return parts;
  }

  // Otherwise, use heuristic detection.
  const lines = message.split("\n");
  const blocks = [];
  let currentBlock = [];
  let inCodeBlock = false;

  // Heuristic: A line "looks like code" if it contains typical code punctuation
  // (such as { } ( ) ; < >) or if it is significantly indented.
  const looksLikeCode = (line) => {
    if (line.trim().length === 0) return false;
    const codePunctuation = /[{}();<>]/;
    const indentation = /^\s{4,}/;
    return codePunctuation.test(line) || indentation.test(line);
  };

  // Check for a known language label (e.g. "rust", "bash", etc.)
  const knownLanguages = ["rust", "bash", "toml", "python", "javascript", "js", "c++", "c#", "java", "go", "ruby", "php", "html", "css"];
  const isLanguageLabel = (line) => {
    return knownLanguages.includes(line.trim().toLowerCase());
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // If not already in a code block and the line is a known language label,
    // check whether subsequent lines look like code.
    if (!inCodeBlock && currentBlock.length === 0 && isLanguageLabel(line)) {
      let j = i + 1;
      let codeCount = 0;
      while (j < lines.length && looksLikeCode(lines[j])) {
        codeCount++;
        j++;
      }
      if (codeCount >= 2) {
        inCodeBlock = true;
        currentBlock.push(line);
        continue;
      }
    }

    if (inCodeBlock) {
      if (looksLikeCode(line) || line.trim() === "") {
        currentBlock.push(line);
      } else {
        // End the code block if a non-code line is encountered.
        blocks.push({ type: "code", content: currentBlock.join("\n") });
        currentBlock = [line];
        inCodeBlock = false;
      }
    } else {
      // Not in a code block; check if the current line should start one.
      if (looksLikeCode(line)) {
        let codeCount = 0;
        let j = i;
        while (j < lines.length && looksLikeCode(lines[j])) {
          codeCount++;
          j++;
        }
        if (codeCount >= 2) {
          // Flush any existing text block.
          if (currentBlock.length > 0) {
            blocks.push({ type: "text", content: currentBlock.join("\n") });
            currentBlock = [];
          }
          inCodeBlock = true;
          currentBlock.push(line);
          continue;
        } else {
          currentBlock.push(line);
        }
      } else {
        currentBlock.push(line);
      }
    }
  }
  if (currentBlock.length > 0) {
    blocks.push({ type: inCodeBlock ? "code" : "text", content: currentBlock.join("\n") });
  }
  return blocks;
}

export function getLanguageFromFence(content) {
  const lines = content.split("\n");
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
