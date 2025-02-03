/*****************************************************
 * content.js
 *****************************************************/
import React from 'react';
import { createRoot } from 'react-dom/client';
import Tesseract from 'tesseract.js';

import LoadingAlert from '../src/LoadingAlert';
import AIResponseAlert from '../src/AIResponseAlert';
import PromptBox from '../src/PromptBox';

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'customAlert') {
    if (request.loading) {
      renderLoadingAlert(request.message);
    } else {
      renderUpdateAlertMessage(request.message);
    }
  } else if (request.type === 'showPrompt') {
    renderPromptBox(request.selectedText, sendResponse);
    // Must return true to handle async sendResponse in React
    return true;
  } else if (request.type === 'openChat') {
    chrome.storage.local.set({ aiMessage: request.message }, () => {
      highlightExtensionIcon();
    });
  } else if (request.type === 'popupOpened') {
    clearBadge();
  }
});

/**
 * Render the loading alert
 */
function renderLoadingAlert(message) {
  removeExistingAlert();

  const alertBox = document.createElement('div');
  alertBox.id = 'react-root';
  document.body.appendChild(alertBox);

  const root = createRoot(alertBox);
  root.render(<LoadingAlert message={message} loading={true} />);
}

/**
 * Render or update AI response alert
 */
function renderUpdateAlertMessage(message) {
  const alertBox = document.querySelector('#react-root');
  if (alertBox) {
    // If root already exists, we re-render with new message
    const root = createRoot(alertBox);
    root.render(<AIResponseAlert message={message} />);
  }
}

/**
 * Render the prompt box
 */
function renderPromptBox(selectedText, sendResponse) {
  removeExistingAlert();

  const promptBox = document.createElement('div');
  promptBox.id = 'react-root';
  document.body.appendChild(promptBox);

  const root = createRoot(promptBox);
  root.render(<PromptBox selectedText={selectedText} onSubmit={(additionalText) => {
    sendResponse({ additionalText });
    removeExistingAlert();
  }} />);
}

/**
 * Remove any existing alert or component
 */
function removeExistingAlert() {
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert) {
    // Clean unmount
    const root = createRoot(existingAlert);
    root.unmount();
    document.body.removeChild(existingAlert);
  }
}

/**
 * Badge management
 */
function highlightExtensionIcon() {
  chrome.action.setBadgeText({ text: 'NEW' });
  chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}
