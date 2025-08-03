/**
 * Background Script for ClickAI Browser Extension
 * 
 * This service worker handles extension background tasks including context menu
 * creation, screenshot capture, message routing between content scripts and popup,
 * and extension lifecycle management. It serves as the central communication hub
 * for all extension operations.
 * 
 * Key Features:
 * - Context menu management for text and area capture
 * - Screenshot capture API integration
 * - Message routing and event handling
 * - Extension badge and notification management
 * - Cross-tab communication coordination
 * 
 * @author Saketh Sripada
 * @version 1.0.0
 */

/**
 * Initializes the extension by creating context menu items when installed or updated.
 * Sets up the right-click menu options for text selection and area capture.
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('ClickAI extension installed/updated - setting up context menus');

  // Context menu for selected text - direct AI query
  chrome.contextMenus.create({
    id: "captureText",
    title: "Ask ClickAI about '%s'",
    contexts: ["selection"],
    documentUrlPatterns: ["<all_urls>"]
  });

  // Context menu for selected text with additional prompt input
  chrome.contextMenus.create({
    id: "addPromptAndCaptureText", 
    title: "Add prompt and ask ClickAI about '%s'",
    contexts: ["selection"],
    documentUrlPatterns: ["<all_urls>"]
  });

  // Context menu for area capture with OCR processing
  chrome.contextMenus.create({
    id: "captureArea",
    title: "Select area and send to ClickAI",
    contexts: ["all"],
    documentUrlPatterns: ["<all_urls>"]
  });

  // Context menu for area capture with additional prompt input
  chrome.contextMenus.create({
    id: "captureAreaAndPrompt",
    title: "Select area, add prompt, and ask ClickAI", 
    contexts: ["all"],
    documentUrlPatterns: ["<all_urls>"]
  });

  console.log('Context menus created successfully');
});

/**
 * Handles context menu item clicks and routes them to appropriate handlers.
 * Each menu item triggers different functionality based on user selection.
 * 
 * @param {chrome.contextMenus.OnClickData} info - Context menu click information
 * @param {chrome.tabs.Tab} tab - Tab where the context menu was clicked
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log(`Context menu clicked: ${info.menuItemId} on tab ${tab.id}`);

  try {
    switch (info.menuItemId) {
      case "captureText":
        handleTextCapture(info, tab);
        break;
        
      case "addPromptAndCaptureText":
        handleTextCaptureWithPrompt(info, tab);
        break;
        
      case "captureArea":
        handleAreaCapture(tab);
        break;
        
      case "captureAreaAndPrompt":
        handleAreaCaptureWithPrompt(tab);
        break;
        
      default:
        console.warn(`Unknown context menu item: ${info.menuItemId}`);
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
    showErrorNotification('Failed to process your request. Please try again.');
  }
});

/**
 * Handles direct text capture from context menu selection.
 * Sends the selected text directly to the content script for AI processing.
 * 
 * @param {chrome.contextMenus.OnClickData} info - Context menu click data
 * @param {chrome.tabs.Tab} tab - Active tab information
 */
function handleTextCapture(info, tab) {
  const selectedText = info.selectionText?.trim();
  
  if (!selectedText) {
    console.warn('No text selected for capture');
    showErrorNotification('No text was selected. Please select some text and try again.');
    return;
  }

  console.log(`Capturing selected text: "${selectedText.substring(0, 50)}..."`);
  
  // Send message to content script to process the selected text
  chrome.tabs.sendMessage(tab.id, {
    type: 'captureText',
    selectedText: selectedText
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to send message to content script:', chrome.runtime.lastError);
      showErrorNotification('Failed to communicate with the page. Please refresh and try again.');
    } else if (response?.success) {
      console.log('Text capture initiated successfully');
    }
  });
}

/**
 * Handles text capture with additional prompt input.
 * Shows a prompt dialog before sending to AI for enhanced context.
 * 
 * @param {chrome.contextMenus.OnClickData} info - Context menu click data  
 * @param {chrome.tabs.Tab} tab - Active tab information
 */
function handleTextCaptureWithPrompt(info, tab) {
  const selectedText = info.selectionText?.trim();
  
  if (!selectedText) {
    console.warn('No text selected for enhanced capture');
    showErrorNotification('No text was selected. Please select some text and try again.');
    return;
  }

  console.log(`Capturing text with prompt: "${selectedText.substring(0, 50)}..."`);
  
  // Send message to content script to show prompt box
  chrome.tabs.sendMessage(tab.id, {
    type: 'captureTextWithPrompt',
    selectedText: selectedText
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to send enhanced capture message:', chrome.runtime.lastError);
      showErrorNotification('Failed to communicate with the page. Please refresh and try again.');
    } else if (response?.success) {
      console.log('Enhanced text capture initiated successfully');
    }
  });
}

/**
 * Handles area capture (screenshot + OCR) functionality.
 * Initiates the snipping tool for screen region selection.
 * 
 * @param {chrome.tabs.Tab} tab - Active tab information
 */
function handleAreaCapture(tab) {
  console.log(`Initiating area capture on tab ${tab.id}`);
  
  // Send message to content script to launch snipping tool
  chrome.tabs.sendMessage(tab.id, {
    type: 'captureArea'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to initiate area capture:', chrome.runtime.lastError);
      showErrorNotification('Failed to start screen capture. Please refresh and try again.');
    } else if (response?.success) {
      console.log('Area capture initiated successfully');
    }
  });
}

/**
 * Handles area capture with additional prompt input.
 * Combines screenshot OCR with user-provided context.
 * 
 * @param {chrome.tabs.Tab} tab - Active tab information
 */
function handleAreaCaptureWithPrompt(tab) {
  console.log(`Initiating enhanced area capture on tab ${tab.id}`);
  
  // Send message to content script to launch enhanced snipping tool
  chrome.tabs.sendMessage(tab.id, {
    type: 'captureAreaAndPrompt'
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to initiate enhanced area capture:', chrome.runtime.lastError);
      showErrorNotification('Failed to start enhanced screen capture. Please refresh and try again.');
    } else if (response?.success) {
      console.log('Enhanced area capture initiated successfully');
    }
  });
}

/**
 * Handles runtime messages from content scripts, popup, and other extension components.
 * Serves as the central message router for inter-component communication.
 * 
 * @param {Object} message - Message object with type and data
 * @param {chrome.runtime.MessageSender} sender - Message sender information
 * @param {Function} sendResponse - Response callback function
 * @returns {boolean} True if response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`Background received message: ${message.type} from ${sender.tab ? 'content script' : 'popup'}`);

  try {
    switch (message.type) {
      case 'captureScreenshot':
        handleScreenshotCapture(sender.tab.id, sendResponse);
        return true; // Indicates async response
        
      case 'showNotification':
        showNotification(message.title, message.text, message.iconUrl);
        sendResponse({ success: true });
        break;
        
      case 'updateBadge':
        updateExtensionBadge(message.text, message.color);
        sendResponse({ success: true });
        break;
        
      case 'getActiveTab':
        getActiveTabInfo(sendResponse);
        return true; // Indicates async response
        
      case 'openOptionsPage':
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling runtime message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

/**
 * Captures a screenshot of the current tab for use in the snipping tool.
 * Uses the Chrome tabs API to capture the visible area of the active tab.
 * 
 * @param {number} tabId - ID of the tab to capture
 * @param {Function} sendResponse - Callback to send the screenshot data
 */
function handleScreenshotCapture(tabId, sendResponse) {
  console.log(`Capturing screenshot for tab ${tabId}`);
  
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (screenshotUrl) => {
    if (chrome.runtime.lastError) {
      console.error('Screenshot capture failed:', chrome.runtime.lastError);
      sendResponse({ 
        success: false, 
        error: 'Failed to capture screenshot: ' + chrome.runtime.lastError.message 
      });
      return;
    }
    
    if (screenshotUrl) {
      console.log('Screenshot captured successfully');
      sendResponse({ 
        success: true, 
        screenshot: screenshotUrl 
      });
    } else {
      console.error('Screenshot capture returned empty result');
      sendResponse({ 
        success: false, 
        error: 'Screenshot capture returned no data' 
      });
    }
  });
}

/**
 * Shows a browser notification to the user.
 * Used for error messages, status updates, and user feedback.
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification message text
 * @param {string} iconUrl - Optional notification icon URL
 */
function showNotification(title, message, iconUrl = 'logo192.png') {
  const notificationOptions = {
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 1
  };
  
  chrome.notifications.create('', notificationOptions, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to create notification:', chrome.runtime.lastError);
    } else {
      console.log(`Notification created: ${notificationId}`);
      
      // Auto-clear notification after 5 seconds
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 5000);
    }
  });
}

/**
 * Shows an error notification with consistent styling and messaging.
 * Standardized error notification for user-facing error messages.
 * 
 * @param {string} message - Error message to display
 */
function showErrorNotification(message) {
  showNotification('ClickAI Error', message, 'logo192.png');
}

/**
 * Updates the extension badge text and color for visual status indication.
 * Used to show processing state, error conditions, or other status information.
 * 
 * @param {string} text - Badge text (up to 4 characters)
 * @param {string} color - Badge background color
 */
function updateExtensionBadge(text, color = '#FF6B6B') {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
  
  // Clear badge after 3 seconds unless it's an error state
  if (text && !text.includes('!')) {
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }
}

/**
 * Retrieves information about the currently active tab.
 * Used by popup and content scripts that need current tab context.
 * 
 * @param {Function} sendResponse - Callback to send tab information
 */
function getActiveTabInfo(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('Failed to get active tab:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
      return;
    }
    
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      console.log(`Active tab: ${activeTab.title} (${activeTab.url})`);
      sendResponse({ 
        success: true, 
        tab: {
          id: activeTab.id,
          url: activeTab.url,
          title: activeTab.title,
          favIconUrl: activeTab.favIconUrl
        }
      });
    } else {
      sendResponse({ success: false, error: 'No active tab found' });
    }
  });
}

/**
 * Handles extension startup and initialization.
 * Performs any necessary setup when the extension service worker starts.
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('ClickAI extension starting up');
  
  // Clear any existing badge text on startup
  chrome.action.setBadgeText({ text: '' });
  
  // Initialize any persistent storage or settings if needed
  chrome.storage.local.get(['clickaiSettings'], (result) => {
    if (!result.clickaiSettings) {
      // Set default settings on first run
      const defaultSettings = {
        theme: 'light',
        autoCapture: true,
        notifications: true,
        version: chrome.runtime.getManifest().version
      };
      
      chrome.storage.local.set({ clickaiSettings: defaultSettings }, () => {
        console.log('Default settings initialized');
      });
    }
  });
});

/**
 * Handles extension suspension and cleanup.
 * Performs cleanup when the service worker is being suspended.
 */
chrome.runtime.onSuspend.addListener(() => {
  console.log('ClickAI extension suspending - performing cleanup');
  
  // Clear any temporary data or pending operations
  chrome.action.setBadgeText({ text: '' });
});

/**
 * Handles tab updates to ensure extension functionality is maintained.
 * Monitors tab changes that might affect extension operation.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process completed page loads
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab ${tabId} completed loading: ${tab.url}`);
    
    // Ensure content script is ready (in case of dynamic injection)
    // This is mainly for debugging and ensuring proper setup
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      // Content script should already be injected via manifest
      // This is just a fallback check
      chrome.tabs.sendMessage(tabId, { type: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not responding - this is normal for some pages
          console.log(`Content script not available on tab ${tabId}`);
        }
      });
    }
  }
});

// Global error handler for unhandled errors in the background script
self.addEventListener('error', (event) => {
  console.error('Unhandled error in background script:', event.error);
});

// Global handler for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in background script:', event.reason);
});

console.log('ClickAI background script loaded successfully');
