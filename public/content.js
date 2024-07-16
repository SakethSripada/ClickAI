import React from 'react';
import { createRoot } from 'react-dom/client';
import LoadingAlert from '../src/LoadingAlert';
import PromptBox from '../src/PromptBox';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'customAlert') {
    if (request.loading) {
      renderLoadingAlert(request.message);
    } else {
      renderUpdateAlertMessage(request.message);
    }
  } else if (request.type === 'showPrompt') {
    renderPromptBox(request.selectedText, sendResponse);
    return true;
  }
});

function renderLoadingAlert(message) {
  removeExistingAlert();

  const alertBox = document.createElement('div');
  alertBox.id = 'react-root';
  document.body.appendChild(alertBox);

  const root = createRoot(alertBox);
  root.render(<LoadingAlert message={message} />);
}

function renderUpdateAlertMessage(message) {
  const alertBox = document.querySelector('#react-root');
  if (alertBox) {
    const root = createRoot(alertBox);
    root.render(<LoadingAlert message={message} />);
  }
}

function renderPromptBox(selectedText, sendResponse) {
  removeExistingAlert();

  const promptBox = document.createElement('div');
  promptBox.id = 'react-root';
  document.body.appendChild(promptBox);

  const handleSubmit = (additionalText) => {
    sendResponse({ additionalText });
    removeExistingAlert();
  };

  const root = createRoot(promptBox);
  root.render(<PromptBox selectedText={selectedText} onSubmit={handleSubmit} />);
}

function removeExistingAlert() {
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert) {
    const root = createRoot(existingAlert);
    root.unmount();
    document.body.removeChild(existingAlert);
  }
}
