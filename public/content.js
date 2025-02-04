/*****************************************************
 * content.js
 *****************************************************/
import React from 'react';
import { createRoot } from 'react-dom/client';
import AIResponseAlert from '../src/AIResponseAlert';
import PromptBox from '../src/PromptBox';

// Global references to the alert container and its React ref
let aiResponseAlertRoot = null;
window.aiResponseAlertRef = null;

/**
 * If an AIResponseAlert is already open, append the new user query;
 * otherwise, render a new AIResponseAlert with the initial query.
 */
function renderOrAppendQuery(newQuery) {
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert && window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
    // Append new user query to existing AIResponseAlert
    window.aiResponseAlertRef.current.appendUserQuery(newQuery);
  } else {
    // Create a new AIResponseAlert with initialQuery
    createAIResponseAlert(newQuery);
  }
}

/**
 * Creates and opens AIResponseAlert.
 */
function createAIResponseAlert(initialQuery = "") {
  const alertBox = document.createElement('div');
  alertBox.id = 'react-root';
  document.body.appendChild(alertBox);
  window.aiResponseAlertRef = React.createRef();
  aiResponseAlertRoot = createRoot(alertBox);
  aiResponseAlertRoot.render(<AIResponseAlert ref={window.aiResponseAlertRef} initialQuery={initialQuery} />);
}

/**
 * Injects a floating button on all web pages for opening AIResponseAlert.
 */
function injectFloatingButton() {
  if (document.getElementById('ai-float-btn')) return; // Prevent duplicates

  const btn = document.createElement('button');
  btn.id = 'ai-float-btn';
  btn.innerText = '💬';
  btn.onclick = () => {
    if (!document.getElementById('react-root')) {
      createAIResponseAlert();
    }
  };

  document.body.appendChild(btn);

  // Apply styles
  const style = document.createElement('style');
  style.innerHTML = `
    #ai-float-btn {
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 25px;
      height: 25px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      transition: background 0.3s, transform 0.2s;
      z-index: 999999;
    }
    
    #ai-float-btn:hover {
      background: #45a049;
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Injects the floating button when the script runs.
 */
injectFloatingButton();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'newUserQuery') {
    renderOrAppendQuery(request.query);
  } else if (request.type === 'updateAIResponse') {
    if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
      window.aiResponseAlertRef.current.updateLastAssistantResponse(request.response);
    }
  } else if (request.type === 'showPrompt') {
    renderPromptBox(request.selectedText, sendResponse);
    // Return true to handle async sendResponse in React
    return true;
  } else if (request.type === 'openChat') {
    chrome.storage.local.set({ aiMessage: request.message }, () => {
      highlightExtensionIcon();
    });
  } else if (request.type === 'popupOpened') {
    clearBadge();
  }
});

function renderPromptBox(selectedText, sendResponse) {
  removeExistingAlert();
  const promptBox = document.createElement('div');
  promptBox.id = 'react-root';
  document.body.appendChild(promptBox);
  const root = createRoot(promptBox);
  root.render(
    <PromptBox
      selectedText={selectedText}
      onSubmit={(additionalText) => {
        sendResponse({ additionalText });
        removeExistingAlert();
      }}
    />
  );
}

function removeExistingAlert() {
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert) {
    // Attempt to unmount any React component (if mounted via createRoot)
    try {
      const root = createRoot(existingAlert);
      root.unmount();
    } catch (e) {
      // ignore errors during unmount
    }
    document.body.removeChild(existingAlert);
  }
}

function highlightExtensionIcon() {
  chrome.action.setBadgeText({ text: 'NEW' });
  chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}
