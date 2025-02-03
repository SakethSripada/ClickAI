import React from 'react';
import { createRoot } from 'react-dom/client';
import './LoadingAlert.css';

const LoadingAlert = ({ message, loading }) => {
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
    <div className="loading-overlay" onClick={handleClose}>
      <div className="loading-alert-box" onClick={(e) => e.stopPropagation()}>
        <p className="loading-message">{message}</p>
        {loading && (
          <div className="loading-spinner-container">
            <div className="loading-spinner" />
          </div>
        )}
        <button
          className="loading-close-btn"
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LoadingAlert;
