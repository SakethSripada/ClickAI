import React from 'react';

const LoadingAlert = ({ message, loading }) => {
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
    alertBox: {
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
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50px',
    },
    loadingAnimation: {
      border: '4px solid #f3f3f3',
      borderRadius: '50%',
      borderTop: '4px solid #007BFF',
      width: '20px',
      height: '20px',
      animation: 'spin 1s linear infinite',
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
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <p style={styles.message}>{message}</p>
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingAnimation}></div>
          </div>
        )}
        <button
          style={styles.closeButton}
          onClick={handleClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.closeButton.backgroundColor)}
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
