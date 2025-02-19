import { marked } from 'marked';
import React from 'react';

// =======================
// Existing functions (unchanged)
// =======================

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

  const looksLikeCode = (line) => {
    if (line.trim().length === 0) return false;
    const codePunctuation = /[{}();<>]/;
    const indentation = /^\s{4,}/;
    return codePunctuation.test(line) || indentation.test(line);
  };

  const knownLanguages = ["rust", "bash", "toml", "python", "javascript", "js", "c++", "c#", "java", "go", "ruby", "php", "html", "css"];
  const isLanguageLabel = (line) => {
    return knownLanguages.includes(line.trim().toLowerCase());
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
        blocks.push({ type: "code", content: currentBlock.join("\n") });
        currentBlock = [line];
        inCodeBlock = false;
      }
    } else {
      if (looksLikeCode(line)) {
        let codeCount = 0;
        let j = i;
        while (j < lines.length && looksLikeCode(lines[j])) {
          codeCount++;
          j++;
        }
        if (codeCount >= 2) {
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

// =======================
// Custom Math Renderer Helpers
// =======================

/**
 * processMathCommands takes a math string and replaces common LaTeX commands with simple HTML/text.
 * - Replaces \frac{a}{b} with (a/b)
 * - Replaces \times and \cdot with *
 * - Replaces spacing commands with a single space
 * - Removes \left and \right.
 */
export function processMathCommands(mathString) {
  let result = mathString;
  result = result.replace(/\\frac\s*{([^}]+)}{([^}]+)}/g, (_, num, denom) => {
    return `(${num}/${denom})`;
  });
  result = result.replace(/\\times/g, '*');
  result = result.replace(/\\cdot/g, '*');
  result = result.replace(/\\quad/g, ' ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\left/g, '');
  result = result.replace(/\\right/g, '');
  return result;
}

/**
 * renderCustomMath splits a text string into plain text and math blocks.
 * We assume math blocks are delimited by a line containing only "[" and a line containing only "]".
 * The math content is processed via processMathCommands and rendered in a styled div.
 */
export function renderCustomMath(text) {
  const elements = [];
  let key = 0;
  const lines = text.split('\n');
  let inMathBlock = false;
  let currentMathLines = [];
  let currentPlainLines = [];

  // Flush plain text as a React element (using React fragments)
  const flushPlain = () => {
    if (currentPlainLines.length > 0) {
      const plainText = currentPlainLines.join('\n');
      // Use marked to convert markdown to HTML, then strip wrapping <p> tags.
      let html = marked.parse(plainText);
      html = html.replace(/^<p>/, '').replace(/<\/p>$/, '');
      // Use dangerouslySetInnerHTML here because our markdown conversion is trusted.
      elements.push(
        <span key={key++} dangerouslySetInnerHTML={{ __html: html }} />
      );
      currentPlainLines = [];
    }
  };

  for (let line of lines) {
    if (!inMathBlock && line.trim() === '[') {
      flushPlain();
      inMathBlock = true;
    } else if (inMathBlock && line.trim() === ']') {
      const mathContent = currentMathLines.join('\n');
      const processedMath = processMathCommands(mathContent);
      // Render the processed math content in a styled div without extra brackets.
      elements.push(
        <div
          key={key++}
          style={{
            fontFamily: 'monospace',
            background: '#f0f0f0',
            padding: '4px 8px',
            margin: '8px 0',
            borderLeft: '4px solid #007BFF',
            whiteSpace: 'pre-wrap',
          }}
        >
          {processedMath}
        </div>
      );
      currentMathLines = [];
      inMathBlock = false;
    } else if (inMathBlock) {
      currentMathLines.push(line);
    } else {
      currentPlainLines.push(line);
    }
  }
  flushPlain();
  return elements;
}

// Configure marked to render with breaks
marked.setOptions({
  breaks: true,
});
