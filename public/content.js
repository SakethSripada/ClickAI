/*****************************************************
 * content.js
 * 
 * This file injects the AI chat UI into the webpage,
 * handles floating button creation, message passing,
 * and now also processes snipped images using Tesseract OCR.
 *****************************************************/
import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import AIResponseAlert from '../src/Components/AIResponseAlert';
import PromptBox from '../src/Components/PromptBox';
import SnippingTool from '../src/Components/SnippingTool';
import Tesseract from 'tesseract.js'; // Import Tesseract OCR
import { AiOutlineMessage } from 'react-icons/ai'; 

// Global references to the alert container and its React ref
let aiResponseAlertRoot = null;
window.aiResponseAlertRef = null;

/**
 * If an AIResponseAlert is already open, append the new user query;
 * otherwise, render a new AIResponseAlert with the initial query.
 *
 * @param {string} newQuery - The user query to append or use as initial input.
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
 *
 * @param {string} [initialQuery=""] - The initial query to display.
 */
function createAIResponseAlert(initialQuery = "") {
  const alertBox = document.createElement('div');
  alertBox.id = 'react-root';
  document.body.appendChild(alertBox);
  window.aiResponseAlertRef = React.createRef();
  aiResponseAlertRoot = createRoot(alertBox);
  aiResponseAlertRoot.render(<AIResponseAlert ref={window.aiResponseAlertRef} initialQuery={initialQuery} />);
  // Hide the floating button since the chat window is open
  const floatBtn = document.getElementById('ai-float-btn');
  if (floatBtn) {
    floatBtn.style.display = 'none';
  }
}

/**
 * Injects a floating button on all web pages for opening/closing AIResponseAlert.
 */
function injectFloatingButton() {
  if (document.getElementById('ai-float-btn')) return; // Prevent duplicates

  const btn = document.createElement('button');
  btn.id = 'ai-float-btn';
  const btnRoot = createRoot(btn);
  btnRoot.render(<AiOutlineMessage size={28} color="white" />);

  btn.onclick = () => {
    const existingAlert = document.querySelector('#react-root');
    if (existingAlert) {
      // If the chat window is already open, close it
      removeExistingAlert();
    } else {
      // Otherwise, open the chat window
      createAIResponseAlert();
      // Hide the floating button while chat window is open
      btn.style.display = 'none';
    }
  };

  document.body.appendChild(btn);

  const style = document.createElement('style');
  style.innerHTML = `
    #ai-float-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 55px;
      height: 55px;
      background: linear-gradient(135deg, #007BFF, #0056b3);
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease-in-out;
      z-index: 999999;
    }
    
    #ai-float-btn:hover {
      background: linear-gradient(135deg, #FF7B00, #FF4500);
      transform: scale(1.1);
    }

    #ai-float-btn:active {
      transform: scale(0.95);
    }

    #ai-float-btn svg {
      width: 30px;
      height: 30px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Launches the snipping tool overlay.
 * After the user snips an area, the image is processed via OCR to extract text.
 * That text is then sent as a normal user query to the AI backend.
 */
function launchSnippingTool() {
  // Create container for SnippingTool
  const snipContainer = document.createElement('div');
  snipContainer.id = 'snip-container';
  document.body.appendChild(snipContainer);
  const snipRoot = createRoot(snipContainer);
  snipRoot.render(
    <SnippingTool
      onComplete={(croppedImageData) => {
        // Remove snipping tool overlay
        snipRoot.unmount();
        document.body.removeChild(snipContainer);
        // Process the snipped image using Tesseract OCR to extract text
        Tesseract.recognize(croppedImageData, 'eng', { logger: m => console.log(m) })
          .then(({ data: { text } }) => {
            const extractedText = text.trim();
            if (!extractedText) {
              // If OCR yields no text, notify the user
              renderOrAppendQuery('[No text detected]');
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: No text detected in the snip.');
              }
              return;
            }
            // Append the extracted text as a new user query
            renderOrAppendQuery(extractedText);
            // Send the extracted text to AI as a normal text query
            fetch('http://localhost:5010/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                conversationHistory: [{ sender: 'user', text: extractedText }]
              })
            })
              .then(response => response.json())
              .then(data => {
                if (data && data.response) {
                  if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                    window.aiResponseAlertRef.current.updateLastAssistantResponse(data.response);
                  }
                  chrome.runtime.sendMessage({ type: 'openChat', message: data.response });
                } else {
                  if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                    window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: No response from AI');
                  }
                }
              })
              .catch(error => {
                console.error('Error sending text to AI:', error);
                if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                  window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: Unable to contact AI server');
                }
              });
          })
          .catch(err => {
            console.error('Error during OCR processing:', err);
            renderOrAppendQuery('[OCR Error]');
            if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
              window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: OCR processing failed.');
            }
          });
      }}
      onCancel={() => {
        snipRoot.unmount();
        document.body.removeChild(snipContainer);
      }}
    />
  );
}

/**
 * Converts a base64 data URL to a Blob.
 *
 * @param {string} dataurl - The base64 data URL.
 * @returns {Blob} The resulting Blob.
 */
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/*
 * The sendImageToAI function is no longer used because we now process the image using OCR.
 * It is kept here commented out for reference.
 *
// function sendImageToAI(imageData, callback) {
//   const blob = dataURLtoBlob(imageData);
//   const formData = new FormData();
//   formData.append('file', blob, 'image.png');
//   // Optionally, add conversationHistory as JSON string if needed.
//   formData.append('conversationHistory', JSON.stringify([{ sender: 'user', text: '[Image Input]' }]));
//
//   fetch('http://localhost:5010/generate', {
//     method: 'POST',
//     body: formData,
//   })
//     .then(response => response.json())
//     .then(data => {
//       if (data && data.response) {
//         callback(data.response);
//       } else {
//         callback('Error: No response from AI');
//       }
//     })
//     .catch(error => {
//       console.error('Error sending image to AI:', error);
//       callback('Error: Unable to contact AI server');
//     });
// }
*/

/**
 * Removes any existing AI alert from the DOM and shows the floating button.
 */
function removeExistingAlert() {
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert) {
    try {
      const root = createRoot(existingAlert);
      root.unmount();
    } catch (e) {
      // Ignore errors during unmount
    }
    document.body.removeChild(existingAlert);
  }
  // Show floating button again
  const floatBtn = document.getElementById('ai-float-btn');
  if (floatBtn) {
    floatBtn.style.display = 'block';
  }
}

/**
 * Renders the prompt box for additional text when required.
 *
 * @param {string} selectedText - The text that was selected.
 * @param {function} sendResponse - The callback to send the response.
 */
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

/**
 * Highlights the extension icon by setting a badge.
 */
function highlightExtensionIcon() {
  chrome.action.setBadgeText({ text: 'NEW' });
  chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
}

/**
 * Clears the extension badge.
 */
function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

/**
 * Injects a console log into the target tab.
 *
 * @param {number} tabId - The ID of the tab.
 * @param {string} message - The message to log.
 */
function injectConsoleLog(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (msg) => console.log(msg),
    args: [message]
  });
}

/**
 * Sends a new user query message to the content script.
 *
 * @param {number} tabId - The ID of the tab.
 * @param {string} query - The user query.
 */
function sendNewUserQuery(tabId, query) {
  chrome.tabs.sendMessage(tabId, {
    type: 'newUserQuery',
    query: query,
    loading: true
  });
}

/**
 * Sends an updated AI response message to the content script.
 *
 * @param {number} tabId - The ID of the tab.
 * @param {string} response - The AI response text.
 */
function updateAIResponse(tabId, response) {
  chrome.tabs.sendMessage(tabId, {
    type: 'updateAIResponse',
    response: response,
    loading: false
  });
}

window.launchSnippingTool = launchSnippingTool;

export {
  renderOrAppendQuery,
  createAIResponseAlert,
  launchSnippingTool,
  sendNewUserQuery,
  updateAIResponse,
  injectConsoleLog
};

// Inject the floating button when the script runs
injectFloatingButton();
