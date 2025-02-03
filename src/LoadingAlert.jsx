/*****************************************************
 * LoadingAlert.jsx
 *****************************************************/
import React from 'react';
import { createRoot } from 'react-dom/client';

const LoadingAlert = ({ message, loading }) => {
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  const alertBoxStyle = {
    backgroundColor: '#fff',
    border: '2px solid #000',
    padding: '20px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.5)',
    borderRadius: '10px',
    maxWidth: '80%',
    maxHeight: '60%',
    overflowY: 'auto',
    overflowX: 'hidden',
    textAlign: 'center',
    color: '#000',
    position: 'relative'
  };

  const messageStyle = {
    margin: '0 0 10px',
    fontSize: '16px',
    color: '#000'
  };

  const loadingContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50px'
  };

  const spinnerStyle = {
    border: '4px solid #f3f3f3',
    borderRadius: '50%',
    borderTop: '4px solid #007BFF',
    width: '24px',
    height: '24px',
    animation: 'spin 1s linear infinite'
  };

  const closeButtonStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: '5px',
    marginTop: '10px'
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

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={alertBoxStyle} onClick={(e) => e.stopPropagation()}>
        <p style={messageStyle}>{message}</p>
        {loading && (
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle} />
          </div>
        )}
        <button
          style={closeButtonStyle}
          onClick={handleClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
        >
          Close
        </button>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default LoadingAlert;
