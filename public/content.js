console.log('Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'customAlert') {
        if (request.loading) {
            showLoadingAlert(request.message);
        } else {
            updateAlertMessage(request.message);
        }
    }
});

function showLoadingAlert(message) {
    removeExistingAlert();

    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert-box';

    const alertMessage = document.createElement('p');
    alertMessage.innerText = message;

    const loadingAnimation = document.createElement('div');
    loadingAnimation.className = 'loading-animation';

    alertBox.appendChild(alertMessage);
    alertBox.appendChild(loadingAnimation);
    document.body.appendChild(alertBox);

    const style = document.createElement('style');
    style.innerHTML = `
      .custom-alert-box {
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border: 2px solid #000;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        max-width: 80%;
        max-height: 60%;
        overflow-y: auto;
        overflow-x: hidden;
        text-align: center;
        color: #000;
      }
      .custom-alert-box p {
        margin: 0 0 10px;
        font-size: 16px;
        color: #000;
      }
      .loading-animation {
        border: 4px solid #f3f3f3;
        border-radius: 50%;
        border-top: 4px solid #007BFF;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        margin: 10px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .custom-alert-box button {
        padding: 10px 20px;
        font-size: 14px;
        border: none;
        background-color: #007BFF;
        color: #fff;
        cursor: pointer;
        border-radius: 5px;
        margin: 5px;
      }
      .custom-alert-box button:hover {
        background-color: #0056b3;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', (event) => {
        if (!alertBox.contains(event.target)) {
            alertBox.remove();
        }
    }, { once: true });
}

function updateAlertMessage(message) {
    const alertBox = document.querySelector('.custom-alert-box');
    if (alertBox) {
        const alertMessage = alertBox.querySelector('p');
        alertMessage.innerText = message;

        const loadingAnimation = alertBox.querySelector('.loading-animation');
        if (loadingAnimation) {
            loadingAnimation.remove();
        }

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.onclick = () => alertBox.remove();

        const openChatButton = document.createElement('button');
        openChatButton.innerText = 'Open Chat';
        openChatButton.onclick = () => {
            chrome.runtime.sendMessage({ type: 'openChat', message });
            alertBox.remove();
        };

        alertBox.appendChild(closeButton);
        alertBox.appendChild(openChatButton);
    }
}

function removeExistingAlert() {
    const existingAlert = document.querySelector('.custom-alert-box');
    if (existingAlert) {
        existingAlert.remove();
    }
}
