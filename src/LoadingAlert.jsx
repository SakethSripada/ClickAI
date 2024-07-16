import React from 'react';

const LoadingAlert = ({ message }) => {
  const styles = {
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
  };

  return (
    <div style={styles.alertBox}>
      <p style={styles.message}>{message}</p>
      <div style={styles.loadingContainer}>
        <div style={styles.loadingAnimation}></div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingAlert;
