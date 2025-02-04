/*****************************************************
 * src/PromptBox.js
 *****************************************************/
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './PromptBox.css';

const PromptBox = ({ selectedText, onSubmit }) => {
  const [additionalText, setAdditionalText] = useState('');

  const handleSubmit = () => {
    onSubmit(additionalText);
  };

  return (
    <div className="prompt-box-overlay">
      <div className="prompt-box">
        <h2>Add Prompt</h2>
        <p>Selected Text: {selectedText}</p>
        <textarea
          placeholder="Enter additional prompt..."
          value={additionalText}
          onChange={(e) => setAdditionalText(e.target.value)}
        />
        <div className="prompt-box-buttons">
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
};

export default PromptBox;
