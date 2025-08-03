/**
 * Utility Functions for ClickAI Extension
 * 
 * This module contains helper functions for parsing AI responses, detecting code blocks,
 * and rendering messages in the chat interface. The parsing logic has been optimized
 * to handle various message formats while avoiding false positives for code detection.
 * 
 * @module utils
 * @author ClickAI Team
 */

import { marked } from 'marked';

/**
 * Parses an AI response message into structured blocks for rendering.
 * Prioritizes triple backticks for code detection and uses conservative
 * fallback heuristics to avoid marking regular text as code.
 * 
 * @param {string} message - The raw AI response message to parse
 * @returns {Array<Object>} Array of block objects with type ('text' or 'code') and content
 */
export function parseMessageToBlocks(message) {
  // Primary parsing: Handle triple backtick code blocks
  if (message.includes("```")) {
    const parts = [];
    let currentIndex = 0;
    
    while (currentIndex < message.length) {
      const startFence = message.indexOf("```", currentIndex);
      
      // No more code blocks found - add remaining text
      if (startFence === -1) {
        parts.push({ type: "text", content: message.slice(currentIndex) });
        break;
      }
      
      // Add text before the code block
      if (startFence > currentIndex) {
        parts.push({
          type: "text",
          content: message.slice(currentIndex, startFence),
        });
      }
      
      // Find the closing fence
      const endFence = message.indexOf("```", startFence + 3);
      if (endFence === -1) {
        // No closing fence - treat rest as code
        parts.push({ type: "code", content: message.slice(startFence) });
        break;
      } else {
        // Complete code block found
        parts.push({
          type: "code",
          content: message.slice(startFence, endFence + 3),
        });
        currentIndex = endFence + 3;
      }
    }
    return parts;
  }

  // Fallback parsing: Very conservative code detection for non-fenced content
  // This runs when no triple backticks are found and uses strict heuristics
  const lines = message.split('\n');
  const blocks = [];
  let currentBlock = { type: "text", content: "" };
  
  for (const line of lines) {
    const isCodeLine = detectCodeLine(line);
    
    if (isCodeLine && currentBlock.type === "text") {
      // Switch from text to code - save current text block if it has content
      if (currentBlock.content.trim()) {
        blocks.push(currentBlock);
      }
      currentBlock = { type: "code", content: line };
    } else if (!isCodeLine && currentBlock.type === "code") {
      // Switch from code to text - save current code block
      blocks.push(currentBlock);
      currentBlock = { type: "text", content: line };
    } else {
      // Continue with current block type
      if (currentBlock.content) {
        currentBlock.content += '\n' + line;
      } else {
        currentBlock.content = line;
      }
    }
  }
  
  // Add the final block if it has content
  if (currentBlock.content.trim()) {
    blocks.push(currentBlock);
  }
  
  return blocks.length > 0 ? blocks : [{ type: "text", content: message }];
}

/**
 * Detects if a single line appears to be code using conservative heuristics.
 * This is used as a fallback when no triple backticks are present.
 * 
 * @param {string} line - The line to analyze
 * @returns {boolean} True if the line appears to be code
 */
function detectCodeLine(line) {
  const trimmed = line.trim();
  
  // Empty lines are not considered code
  if (!trimmed) return false;
  
  // Very conservative patterns that strongly indicate code
  const strongCodePatterns = [
    /^function\s+\w+\s*\(/,           // Function declarations
    /^const\s+\w+\s*=/,              // Const declarations
    /^let\s+\w+\s*=/,                // Let declarations
    /^var\s+\w+\s*=/,                // Var declarations
    /^class\s+\w+/,                  // Class declarations
    /^import\s+.*from/,              // Import statements
    /^export\s+(default\s+)?/,       // Export statements
    /^\s*\/\/.*$/,                   // Single line comments
    /^\s*\/\*.*\*\/\s*$/,           // Single line block comments
    /^\s*#.*$/,                      // Hash comments (Python, shell)
    /^<\w+.*>.*<\/\w+>$/,           // XML/HTML tags
    /^\s*\{.*\}\s*,?\s*$/,          // Object literals
    /^\s*\[.*\]\s*,?\s*$/,          // Array literals
  ];
  
  return strongCodePatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Extracts the language identifier from a fenced code block.
 * 
 * @param {string} codeBlock - Code block starting with ```
 * @returns {string} The language identifier (e.g., 'javascript', 'python') or 'text' as fallback
 */
export function extractCodeLanguage(codeBlock) {
  const match = codeBlock.match(/^```(\w+)/);
  return match ? match[1] : 'text';
}

/**
 * Removes the fence markers from a code block and returns clean code content.
 * 
 * @param {string} codeBlock - Fenced code block with ``` markers
 * @returns {string} Clean code content without fence markers
 */
export function stripCodeFences(codeBlock) {
  return codeBlock
    .replace(/^```\w*\n?/, '')  // Remove opening fence and optional language
    .replace(/\n?```$/, '')     // Remove closing fence
    .trim();
}

/**
 * Checks if a message contains mathematical expressions that should be rendered.
 * Looks for LaTeX-style math delimiters and common mathematical notation.
 * 
 * @param {string} message - The message to check
 * @returns {boolean} True if the message likely contains math expressions
 */
export function containsMathExpressions(message) {
  const mathPatterns = [
    /\\\[[\s\S]*?\\\]/,      // Display math: \[ ... \]
    /\\\([\s\S]*?\\\)/,      // Inline math: \( ... \)
    /\$\$[\s\S]*?\$\$/,      // Display math: $$ ... $$
    /\$[^$\n]+\$/,           // Inline math: $ ... $
    /\\begin\{.*?\}/,        // LaTeX environments
    /\\frac\{.*?\}\{.*?\}/,  // Fractions
    /\\sqrt\{.*?\}/,         // Square roots
    /\\sum\_{.*?\}/,         // Summations
    /\\int\_{.*?\}/,         // Integrals
  ];
  
  return mathPatterns.some(pattern => pattern.test(message));
}

/**
 * Converts a markdown message to HTML using the marked library.
 * Configures marked with safe defaults for rendering AI responses.
 * 
 * @param {string} markdown - Markdown content to convert
 * @returns {string} HTML string
 */
export function markdownToHtml(markdown) {
  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,        // Convert line breaks to <br>
    gfm: true,          // Enable GitHub Flavored Markdown
    headerIds: false,   // Disable header IDs for security
    mangle: false,      // Don't mangle email addresses
  });
  
  return marked(markdown);
}

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving basic formatting.
 * This is a basic implementation - consider using a library like DOMPurify for production.
 * 
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  // Basic HTML sanitization - allows common formatting tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li'];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  
  return html.replace(tagPattern, (match, tagName) => {
    return allowedTags.includes(tagName.toLowerCase()) ? match : '';
  });
}

/**
 * Debounces a function to limit how often it can be called.
 * Useful for rate-limiting user input or API calls.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttles a function to ensure it's called at most once per specified interval.
 * 
 * @param {Function} func - Function to throttle
 * @param {number} interval - Minimum interval between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, interval) {
  let lastCall = 0;
  
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Formats a timestamp for display in the chat interface.
 * 
 * @param {Date|number} timestamp - Date object or timestamp to format
 * @returns {string} Formatted time string (e.g., "2:34 PM")
 */
export function formatTimestamp(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Estimates the reading time for a given text.
 * 
 * @param {string} text - Text to analyze
 * @param {number} wordsPerMinute - Average reading speed (default: 200 WPM)
 * @returns {number} Estimated reading time in minutes
 */
export function estimateReadingTime(text, wordsPerMinute = 200) {
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
