/*****************************************************
 * src/utils.js
 *
 * Helper functions used by AIResponseAlert and its
 * sub-components.
 *
 * NOTE: We have replaced the old heuristic code detection
 * with a simpler approach that prioritizes triple backticks.
 * If triple backticks are found, that region is code.
 * If not, we have an extremely strict fallback that should
 * rarely, if ever, mark normal text as code.
 *
 * The old code is commented out below for reference.
 *****************************************************/

import { marked } from 'marked';

export function parseMessageToBlocks(message) {
  // 1) If triple backticks exist, parse them as code blocks directly.
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
        parts.push({
          type: "text",
          content: message.slice(currentIndex, startFence),
        });
      }
      const endFence = message.indexOf("```", startFence + 3);
      if (endFence === -1) {
        parts.push({ type: "code", content: message.slice(startFence) });
        break;
      } else {
        parts.push({
          type: "code",
          content: message.slice(startFence, endFence + 3),
        });
        currentIndex = endFence + 3;
      }
    }
    return parts;
  }

  /************************************************************
   * 2) Otherwise, use a fallback code detection that is extremely
   * strict so that normal text is almost never mistaken for code.
   *
   * We'll only mark text as code if:
   *    - The user explicitly includes a known language label line (like "javascript")
   *      AND
   *    - The following lines contain curly braces or semicolons or at least 4-space
   *      indentation on multiple lines in a row.
   *
   * This helps ensure we don't capture normal text in code blocks.
   ************************************************************/

  const lines = message.split("\n");
  const blocks = [];
  let currentBlock = [];
  let inCodeBlock = false;

  // We keep only curly braces, semicolons, or heavy indentation
  // as signals for "code-like" lines.
  // (We've removed parentheses, angle brackets, etc., to reduce false positives.)
  const codePunctuation = /[{};=]/; // Strictly curly braces, semicolons, equals
  const indentation = /^\s{4,}/;    // At least 4 spaces at the start
  function looksStrictlyLikeCode(line) {
    if (line.trim().length === 0) return false;
    return codePunctuation.test(line) || indentation.test(line);
  }

  // Known language labels for fallback detection
  const knownLanguages = [
    "rust", "bash", "toml", "python", "javascript", "js", "c++",
    "c#", "java", "go", "ruby", "php", "html", "css"
  ];
  function isLanguageLabel(line) {
    return knownLanguages.includes(line.trim().toLowerCase());
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If not in a code block, check if line is a known language label.
    if (!inCodeBlock && currentBlock.length === 0 && isLanguageLabel(line)) {
      let j = i + 1;
      let codeCount = 0;
      // Count how many consecutive lines "look like code"
      while (j < lines.length && looksStrictlyLikeCode(lines[j])) {
        codeCount++;
        j++;
      }
      // If we have at least 2 lines that look like code, let's open a code block.
      if (codeCount >= 2) {
        inCodeBlock = true;
        currentBlock.push(line);
        continue;
      }
    }

    if (inCodeBlock) {
      // If we're inside a fallback code block, we continue
      // until we hit a line that doesn't look like code at all.
      if (looksStrictlyLikeCode(line) || line.trim() === "") {
        currentBlock.push(line);
      } else {
        // End the code block
        blocks.push({ type: "code", content: currentBlock.join("\n") });
        currentBlock = [line];
        inCodeBlock = false;
      }
    } else {
      // If we're not in a code block, keep accumulating text.
      currentBlock.push(line);
    }
  }

  // Flush whatever is left
  if (currentBlock.length > 0) {
    blocks.push({
      type: inCodeBlock ? "code" : "text",
      content: currentBlock.join("\n"),
    });
  }

  return blocks;
}

/************************************************************************
 * Below is the OLD heuristic approach. We have now commented it out,
 * because it caused false positives for normal text. We replaced it with
 * a simpler fallback approach that’s less likely to interfere.
 ************************************************************************/
/*
export function parseMessageToBlocks_OLD(message) {
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
*/

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
