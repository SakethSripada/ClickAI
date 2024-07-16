import React, { useState } from 'react';

const PromptBox = ({ selectedText, onSubmit }) => {
  const [additionalText, setAdditionalText] = useState('');

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
    },
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
    closeButton: {
      padding: '10px 20px',
      fontSize: '14px',
      border: 'none',
      backgroundColor: '#007BFF',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: '5px',
      marginTop: '10px',
    },
    buttonHover: {
      backgroundColor: '#0056b3',
    },
  };

  const handleSubmit = () => {
    onSubmit(additionalText);
  };

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

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.promptBox} onClick={(e) => e.stopPropagation()}>
        <p style={styles.message}>Add additional prompt for:</p>
        <div style={styles.selectedTextContainer}>{selectedText}</div>
        <input
          type="text"
          style={styles.input}
          value={additionalText}
          onChange={(e) => setAdditionalText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={styles.button}
          onClick={handleSubmit}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
        >
          Submit
        </button>
        <button
          style={styles.closeButton}
          onClick={handleClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PromptBox;
