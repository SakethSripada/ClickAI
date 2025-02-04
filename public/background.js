/*****************************************************
 * background.js
 * 
 * This file manages background tasks for the extension,
 * such as context menu creation, handling user selections,
 * sending queries to the AI backend, and badge management.
 *****************************************************/
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: "captureText",
    title: "Ask ClickAI about '%s'",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "addPromptAndCaptureText",
    title: "Add prompt and ask ClickAI about '%s'",
    contexts: ["selection"]
  });

  // New context menu for capturing area (snipping tool)
  chrome.contextMenus.create({
    id: "captureArea",
    title: "Select area and send to ClickAI",
    contexts: ["all"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "captureText") {
    handleCaptureText(info, tab);
  } else if (info.menuItemId === "addPromptAndCaptureText") {
    handleAddPromptAndCaptureText(info, tab);
  } else if (info.menuItemId === "captureArea") {
    // Send message to content script to launch the snipping tool
    chrome.tabs.sendMessage(tab.id, { type: 'captureArea' });
  }
});

/**
 * handleCaptureText
 * Processes the selected text from the webpage and sends it to the AI.
 *
 * @param {object} info - Information about the selection.
 * @param {object} tab - The current tab.
 */
function handleCaptureText(info, tab) {
  if (info.selectionText) {
    const selectedText = info.selectionText;
    injectConsoleLog(tab.id, "Captured Text: " + selectedText);
    sendNewUserQuery(tab.id, selectedText);
    sendTextToAI(tab.id, selectedText, (response) => {
      injectConsoleLog(tab.id, "AI Response: " + response);
      updateAIResponse(tab.id, response);
      chrome.runtime.sendMessage({ type: 'openChat', message: response });
    });
  } else {
    // No selectionText in info; try script injection to capture selection
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: captureHighlightedText
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const selectedText = results[0].result;
        injectConsoleLog(tab.id, "Captured Text: " + selectedText);
        sendNewUserQuery(tab.id, selectedText);
        sendTextToAI(tab.id, selectedText, (response) => {
          injectConsoleLog(tab.id, "AI Response: " + response);
          updateAIResponse(tab.id, response);
          chrome.runtime.sendMessage({ type: 'openChat', message: response });
        });
      } else {
        injectConsoleLog(tab.id, 'Error: No text selected');
        displayCustomAlert(tab.id, 'Error: No text selected');
      }
    });
  }
}

/**
 * handleAddPromptAndCaptureText
 * Prompts the user for additional text before sending the query.
 *
 * @param {object} info - Information about the selection.
 * @param {object} tab - The current tab.
 */
function handleAddPromptAndCaptureText(info, tab) {
  if (info.selectionText) {
    const selectedText = info.selectionText;
    promptForAdditionalText(tab.id, selectedText, (combinedText) => {
      handleTextCaptureWithPrompt(tab.id, combinedText);
    });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: captureHighlightedText
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const selectedText = results[0].result;
        promptForAdditionalText(tab.id, selectedText, (combinedText) => {
          handleTextCaptureWithPrompt(tab.id, combinedText);
        });
      } else {
        injectConsoleLog(tab.id, 'Error: No text selected');
        displayCustomAlert(tab.id, 'Error: No text selected');
      }
    });
  }
}

/**
 * promptForAdditionalText
 * Prompts the user for additional text and combines it with the selected text.
 *
 * @param {number} tabId - The ID of the current tab.
 * @param {string} selectedText - The text that was selected.
 * @param {function} callback - Callback function with the combined text.
 */
function promptForAdditionalText(tabId, selectedText, callback) {
  chrome.tabs.sendMessage(
    tabId,
    { type: 'showPrompt', selectedText: selectedText },
    (response) => {
      if (response && response.additionalText !== undefined) {
        const additionalText = response.additionalText;
        const combinedText = additionalText
          ? `${additionalText} ${selectedText}`
          : selectedText;
        callback(combinedText);
      } else {
        callback(selectedText);
      }
    }
  );
}

/**
 * handleTextCaptureWithPrompt
 * Processes the combined text (selected text and user prompt) and sends it to the AI.
 *
 * @param {number} tabId - The ID of the current tab.
 * @param {string} combinedText - The combined text input.
 */
function handleTextCaptureWithPrompt(tabId, combinedText) {
  injectConsoleLog(tabId, "Captured Text with Prompt: " + combinedText);
  sendNewUserQuery(tabId, combinedText);
  sendTextToAI(tabId, combinedText, (response) => {
    injectConsoleLog(tabId, "AI Response: " + response);
    updateAIResponse(tabId, response);
    chrome.runtime.sendMessage({ type: 'openChat', message: response });
  });
}

/**
 * captureHighlightedText
 * (Injected function) Captures any text highlighted on the webpage.
 *
 * @returns {string|null} The highlighted text, or null if none.
 */
function captureHighlightedText() {
  const selectedText = window.getSelection().toString();
  return selectedText ? selectedText : null;
}

/**
 * sendTextToAI
 * Sends a text query to the AI backend along with conversation history.
 *
 * @param {number} tabId - The ID of the current tab.
 * @param {string} text - The text query.
 * @param {function} callback - Callback function with the AI response.
 */
function sendTextToAI(tabId, text, callback) {
  fetch('http://localhost:5010/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationHistory: [{ sender: 'user', text }]
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data && data.response) {
        callback(data.response);
      } else {
        injectConsoleLog(tabId, 'Error: No response from AI');
        updateAIResponse(tabId, 'Error: No response from AI');
      }
    })
    .catch(error => {
      console.error('Error sending text to AI:', error);
      injectConsoleLog(tabId, 'Error: Unable to contact AI server');
      updateAIResponse(tabId, 'Error: Unable to contact AI server');
    });
}

/**
 * Sends a new user query message to the content script.
 *
 * @param {number} tabId - The ID of the current tab.
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
 * @param {number} tabId - The ID of the current tab.
 * @param {string} response - The AI response text.
 */
function updateAIResponse(tabId, response) {
  chrome.tabs.sendMessage(tabId, {
    type: 'updateAIResponse',
    response: response,
    loading: false
  });
}

/**
 * displayCustomAlert
 * Displays an error alert in the content script.
 *
 * @param {number} tabId - The ID of the current tab.
 * @param {string} message - The error message.
 */
function displayCustomAlert(tabId, message) {
  chrome.tabs.sendMessage(tabId, {
    type: 'customAlert',
    message: message,
    loading: false
  });
}

/**
 * Injects a console log into the target tab.
 *
 * @param {number} tabId - The ID of the current tab.
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
 * Badge & openChat logic and screenshot capture
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'openChat') {
    chrome.storage.local.set({ aiMessage: request.message }, () => {
      highlightExtensionIcon();
    });
  }
  if (request.type === 'popupOpened') {
    clearBadge();
  }
  if (request.type === 'continueChat') {
    fetch('http://localhost:5010/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationHistory: request.conversationHistory,
        continueId: request.continueId
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data && data.response) {
          sendResponse({
            response: data.response,
            id: data.id || null,
            isContinued: data.isContinued || false
          });
        } else {
          sendResponse({ error: 'No response from AI' });
        }
      })
      .catch(err => {
        console.error('Error in continueChat fetch:', err);
        sendResponse({ error: 'Unable to contact AI server' });
      });
    return true;
  } else if (request.type === 'captureScreenshot') {
    // Handle screenshot capture request from content script
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true;
  }
});

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
