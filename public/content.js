console.log('Content script loaded');


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'customAlert') {
      showCustomAlert(request.message);
    }
  });
  
  function showCustomAlert(message) {
    const existingAlert = document.querySelector('.custom-alert-box');
    if (existingAlert) {
      existingAlert.remove();
    }
  
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert-box';
    
    const alertMessage = document.createElement('p');
    alertMessage.innerText = message;
    
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.onclick = () => alertBox.remove();
    
    alertBox.appendChild(alertMessage);
    alertBox.appendChild(closeButton);
    document.body.appendChild(alertBox);
  
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-alert-box {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border: 2px solid #000;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        max-width: 80%;
        text-align: center;
        color: #000; 
      }
      .custom-alert-box p {
        margin: 0 0 10px;
        font-size: 16px;
        color: #000; 
      }
      .custom-alert-box button {
        padding: 10px 20px;
        font-size: 14px;
        border: none;
        background-color: #007BFF;
        color: #fff;
        cursor: pointer;
        border-radius: 5px;
      }
      .custom-alert-box button:hover {
        background-color: #0056b3;
      }
    `;
    document.head.appendChild(style);
  }
  