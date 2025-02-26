/*****************************************************
 * content.js
 * 
 * This file injects the AI chat UI into the webpage,
 * handles floating button creation, message passing,
 * and now also processes snipped images using Tesseract OCR.
 * 
 * PRODUCTION READY: Added robust error handling, input 
 * validation, and OCR image pre-processing to optimize 
 * recognition accuracy and eliminate unnecessary API calls.
 *****************************************************/

import React from 'react';
import { createRoot } from 'react-dom/client';
import AIResponseAlert from '../src/Components/AIResponseAlert';
import PromptBox from '../src/Components/PromptBox';
import SnippingTool from '../src/Components/SnippingTool';
import Tesseract from 'tesseract.js'; // Import Tesseract OCR
import { AiOutlineMessage } from 'react-icons/ai'; 

// ==============================================
// ERROR RESPONSE CONSTANTS (modifiable)
// ==============================================
const ERROR_MESSAGES = {
  NO_TEXT_DETECTED: "[No text detected]",
  OCR_ERROR: "OCR Error: The website may be blocking image scanning workers. Try sending the text by right-clicking instead.",
  UNEXPECTED_OCR_ERROR: "Error: Unexpected error occurred during OCR processing. Please try again.",
  FETCH_ERROR: "Error: Unable to contact AI server. Please check your network connection.",
  GLOBAL_ERROR_PREFIX: "Global Error: ",
  UNHANDLED_REJECTION_PREFIX: "Unhandled Rejection: "
};

// ==============================================
// Global references to the alert container and its React ref
// ==============================================
let aiResponseAlertRoot = null;
window.aiResponseAlertRef = null;

/**
 * Preprocesses the image data to optimize OCR performance.
 * This function loads the image from the data URL, applies a grayscale
 * and contrast filter, and returns a new data URL.
 *
 * @param {string} dataUrl - The base64 image data URL.
 * @returns {Promise<string>} A promise that resolves to the processed data URL.
 */
function preprocessImage(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        // Apply filters to enhance OCR accuracy
        ctx.filter = 'grayscale(100%) contrast(120%)';
        ctx.drawImage(img, 0, 0);
        const processedDataUrl = canvas.toDataURL();
        resolve(processedDataUrl);
      };
      img.onerror = () => {
        reject(new Error("Image preprocessing failed: Unable to load image."));
      };
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

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
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
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
      margin: 0; /* Ensure no extra margins cause misalignment */
    }
  `;
  document.head.appendChild(style);
}

/* 
 * Instead of calling injectFloatingButton() immediately, wait until 
 * the entire page (including any React elements) has loaded to prevent 
 * hydration conflicts on pages that use React.
 */
if (document.readyState === 'complete') {
  injectFloatingButton();
} else {
  window.addEventListener('load', injectFloatingButton);
}


function removeExistingPrompt() {
  const existingPrompt = document.querySelector('#prompt-root');
  if (existingPrompt) {
    try {
      const root = createRoot(existingPrompt);
      root.unmount();
    } catch (e) {
      // Ignore errors during unmount
    }
    document.body.removeChild(existingPrompt);
  }
}


/**
 * Launches the snipping tool overlay.
 * After the user snips an area, the image is pre-processed and then
 * processed via OCR to extract text. The extracted text is validated
 * and then sent as a normal user query to the AI backend.
 */
function launchSnippingTool() {
  // Check if a snipping container already exists and remove it.
  const existingContainer = document.getElementById('snip-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Create container for SnippingTool
  const snipContainer = document.createElement('div');
  snipContainer.id = 'snip-container';
  document.body.appendChild(snipContainer);
  const snipRoot = createRoot(snipContainer);
  
  snipRoot.render(
    <SnippingTool
      onComplete={(croppedImageData) => {
        // Remove snipping tool overlay immediately
        snipRoot.unmount();
        document.body.removeChild(snipContainer);

        // Preprocess the image before OCR to improve recognition accuracy
        preprocessImage(croppedImageData)
          .then((processedImageData) => {
            return Tesseract.recognize(processedImageData, 'eng', { logger: m => console.log(m) });
          })
          .then(({ data: { text } }) => {
            const extractedText = text.trim();
            if (!extractedText) {
              // If OCR yields no text, notify the user and do not call API
              renderOrAppendQuery(ERROR_MESSAGES.NO_TEXT_DETECTED);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: No text detected in the snip.');
              }
              return;
            }
            // Append the extracted text as a new user query
            renderOrAppendQuery(extractedText);
            // Validate the extracted text before calling the API
            if (typeof extractedText !== 'string' || extractedText.length < 2) {
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: Extracted text is invalid.');
              }
              return;
            }
            // Send the extracted text to AI as a normal text query
            fetch(`http://${process.env.BASE_URL}/generate`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-extension-secret': process.env.EXTENSION_SECRET
              },
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
                // For fetch errors, show a generic network error message
                updateAIResponse(null, ERROR_MESSAGES.FETCH_ERROR);
              });
          })
          .catch(err => {
            console.error('Error during OCR processing:', err);
            // Distinguish OCR-related errors from unexpected ones
            if (err && err.message && (err.message.toLowerCase().includes("ocr") || err.message.toLowerCase().includes("preprocessing"))) {
              renderOrAppendQuery(ERROR_MESSAGES.OCR_ERROR);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: OCR processing failed.');
              }
            } else {
              renderOrAppendQuery(ERROR_MESSAGES.UNEXPECTED_OCR_ERROR);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: Unexpected error occurred.');
              }
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
 * NEW FUNCTION:
 * Launches the snipping tool overlay with an additional prompt.
 * After the user snips an area, the image is pre-processed and then
 * processed via OCR to extract text. Then the user is asked for an additional prompt.
 * Both the extracted text and additional prompt are combined and sent to the AI backend.
 */
function launchSnippingToolWithPrompt() {
  // Create container for SnippingTool
  const snipContainer = document.createElement('div');
  snipContainer.id = 'snip-container';
  document.body.appendChild(snipContainer);
  const snipRoot = createRoot(snipContainer);
  snipRoot.render(
    <SnippingTool
      onComplete={(croppedImageData) => {
        // Remove snipping tool overlay immediately
        snipRoot.unmount();
        document.body.removeChild(snipContainer);

        // Preprocess the image before OCR to improve recognition accuracy
        preprocessImage(croppedImageData)
          .then((processedImageData) => {
            return Tesseract.recognize(processedImageData, 'eng', { logger: m => console.log(m) });
          })
          .then(({ data: { text } }) => {
            const extractedText = text.trim();
            if (!extractedText) {
              // If OCR yields no text, notify the user and do not call API
              renderOrAppendQuery(ERROR_MESSAGES.NO_TEXT_DETECTED);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: No text detected in the snip.');
              }
              return;
            }
            // Ask for an additional prompt using the PromptBox
            renderPromptBox(extractedText, (response) => {
              const additionalPrompt = response.additionalText;
              const combinedQuery = extractedText + "\n" + additionalPrompt;
              renderOrAppendQuery(combinedQuery);
              // Validate combined query before sending to the AI
              if (typeof combinedQuery !== 'string' || combinedQuery.trim().length < 2) {
                if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                  window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: Combined query is invalid.');
                }
                return;
              }
              // Send the combined query to AI as a normal text query
              fetch(`http://${process.env.BASE_URL}/generate`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-extension-secret': process.env.EXTENSION_SECRET
                },
                body: JSON.stringify({
                  conversationHistory: [{ sender: 'user', text: combinedQuery }]
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
                  // For fetch errors, show a generic network error message
                  updateAIResponse(null, ERROR_MESSAGES.FETCH_ERROR);
                });
            });
          })
          .catch(err => {
            console.error('Error during OCR processing:', err);
            if (err && err.message && (err.message.toLowerCase().includes("ocr") || err.message.toLowerCase().includes("preprocessing"))) {
              renderOrAppendQuery(ERROR_MESSAGES.OCR_ERROR);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: OCR processing failed.');
              }
            } else {
              renderOrAppendQuery(ERROR_MESSAGES.UNEXPECTED_OCR_ERROR);
              if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
                window.aiResponseAlertRef.current.updateLastAssistantResponse('Error: Unexpected error occurred.');
              }
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
  removeExistingPrompt(); // remove any existing prompt container
  const promptBox = document.createElement('div');
  promptBox.id = 'prompt-root';
  document.body.appendChild(promptBox);
  const root = createRoot(promptBox);
  root.render(
    <PromptBox
      selectedText={selectedText}
      onSubmit={(additionalText) => {
        sendResponse({ additionalText });
        removeExistingPrompt(); // remove prompt after submission
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

// Listen for messages from the extension
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
  } else if (request.type === 'captureArea') {
    // Trigger snipping tool from context menu
    launchSnippingTool();
  } else if (request.type === 'captureAreaAndPrompt') {
    // NEW: Trigger snipping tool with an additional prompt from context menu
    launchSnippingToolWithPrompt();
  }
});

window.launchSnippingTool = launchSnippingTool;

export {
  renderOrAppendQuery,
  createAIResponseAlert,
  launchSnippingTool,
  launchSnippingToolWithPrompt, // Export the new function as well
  sendNewUserQuery,
  updateAIResponse,
  injectConsoleLog
};

// Global error handling for any uncaught errors or unhandled rejections
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.message);
  renderOrAppendQuery(`${ERROR_MESSAGES.GLOBAL_ERROR_PREFIX}${e.message}`);
  if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
    window.aiResponseAlertRef.current.updateLastAssistantResponse(`${ERROR_MESSAGES.GLOBAL_ERROR_PREFIX}${e.message}`);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  const errorMsg = e.reason && e.reason.message ? e.reason.message : 'Unhandled rejection error';
  renderOrAppendQuery(`${ERROR_MESSAGES.UNHANDLED_REJECTION_PREFIX}${errorMsg}`);
  if (window.aiResponseAlertRef && window.aiResponseAlertRef.current) {
    window.aiResponseAlertRef.current.updateLastAssistantResponse(`${ERROR_MESSAGES.UNHANDLED_REJECTION_PREFIX}${errorMsg}`);
  }
});

// Inject the floating button when the script runs
injectFloatingButton();
