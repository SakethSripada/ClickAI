import React, { useState } from 'react';

const PromptBox = ({ selectedText, onSubmit }) => {
  const [additionalText, setAdditionalText] = useState('');

  const styles = {
    promptBox: {
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#fff',
      border: '2px solid #000',
      padding: '20px',
      zIndex: 10000,
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
      borderRadius: '10px',
      maxWidth: '80%',
      maxHeight: '60%',
      overflowY: 'auto',
      overflowX: 'hidden',
      textAlign: 'center',
      color: '#000',
    },
    message: {
      margin: '0 0 10px',
      fontSize: '16px',
      color: '#000',
    },
    selectedTextContainer: {
      maxHeight: '100px',
      overflowY: 'auto',
      marginBottom: '10px',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      textAlign: 'left',
      whiteSpace: 'pre-wrap',
    },
    input: {
      width: 'calc(100% - 20px)',
      padding: '10px',
      fontSize: '14px',
      marginBottom: '10px',
      borderRadius: '5px',
      border: '1px solid #ccc',
    },
    button: {
      padding: '10px 20px',
      fontSize: '14px',
      border: 'none',
      backgroundColor: '#007BFF',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: '5px',
      margin: '5px',
    },
  };

  const handleSubmit = () => {
    onSubmit(additionalText);
  };

  return (
    <div style={styles.promptBox}>
      <p style={styles.message}>Add additional prompt for:</p>
      <div style={styles.selectedTextContainer}>{selectedText}</div>
      <input
        type="text"
        style={styles.input}
        value={additionalText}
        onChange={(e) => setAdditionalText(e.target.value)}
      />
      <button style={styles.button} onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default PromptBox;
