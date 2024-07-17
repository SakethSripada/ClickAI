import React from 'react';
import { createRoot } from 'react-dom/client';
import Tesseract from 'tesseract.js';
import LoadingAlert from '../src/LoadingAlert'; 
import AIResponseAlert from '../src/AIResponseAlert';
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
  } else if (request.type === 'extractTextFromImage') {
    handleExtractTextFromImage(request.imageUrl, sendResponse);
    return true;
  } else if (request.type === 'openChat') {
    chrome.storage.local.set({ aiMessage: request.message }, () => {
      highlightExtensionIcon();
    });
  } else if (request.type === 'popupOpened') {
    clearBadge();
  }
});

function renderLoadingAlert(message) {
  removeExistingAlert();

  const alertBox = document.createElement('div');
  alertBox.id = 'react-root';
  document.body.appendChild(alertBox);

  const root = createRoot(alertBox);
  root.render(<LoadingAlert message={message} loading={true} />);
}

function renderUpdateAlertMessage(message) {
  const alertBox = document.querySelector('#react-root');
  if (alertBox) {
    const root = createRoot(alertBox);
    root.render(<AIResponseAlert message={message} />);
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

function handleExtractTextFromImage(imageUrl, sendResponse) {
  renderLoadingAlert("Extracting text and getting response...");

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imageUrl;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    Tesseract.recognize(dataUrl, 'eng')
      .then(({ data: { text } }) => {
        console.log("Extracted Text: " + text);
        sendResponse({ extractedText: text });
      })
      .catch(error => {
        console.error('Error extracting text from image:', error);
        sendResponse({ extractedText: null });
      });
  };

  img.onerror = (error) => {
    console.error('Error attempting to read image:', error);
    sendResponse({ extractedText: null });
  };
}

function highlightExtensionIcon() {
  chrome.action.setBadgeText({ text: 'NEW' });
  chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'openChat') {
    chrome.storage.local.set({ aiMessage: request.message }, () => {
      highlightExtensionIcon();
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'popupOpened') {
    clearBadge();
  }
});
