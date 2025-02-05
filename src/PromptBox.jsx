import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './PromptBox.css';

/**
 * Simple heuristic to decide if the text “looks like” code.
 */
function looksLikeCode(text) {
  const codeIndicators = [/function\s+/, /=>/, /{.*}/, /#include/, /<\w+>/];
  return codeIndicators.some((regex) => regex.test(text));
}

const PromptBox = ({ selectedText, onSubmit }) => {
  const [additionalText, setAdditionalText] = useState('');

  const handleClose = (e) => {
    e.stopPropagation();
    const existingAlert = document.querySelector('#react-root');
    if (existingAlert) {
      setTimeout(() => {
        const root = createRoot(existingAlert);
        root.unmount();
        document.body.removeChild(existingAlert);
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    onSubmit(additionalText);
  };

  return (
    <div className="prompt-container">
      <div className="prompt-box">
        <h2 className="prompt-title">Add Additional Prompt</h2>
        <div className="selected-text-container">
          {looksLikeCode(selectedText) ? (
            <SyntaxHighlighter language="javascript" style={oneDark}>
              {selectedText}
            </SyntaxHighlighter>
          ) : (
            <p className="selected-text">{selectedText}</p>
          )}
        </div>
        <input
          className="prompt-input"
          type="text"
          placeholder="Enter your prompt here..."
          value={additionalText}
          onChange={(e) => setAdditionalText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="prompt-button-container">
          <button className="prompt-btn primary-btn" onClick={handleSubmit}>
            Submit
          </button>
          <button className="prompt-btn outline-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptBox;