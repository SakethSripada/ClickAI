/**
 * Content Script for ClickAI Browser Extension
 * 
 * This script is injected into every webpage and provides the core functionality
 * for the ClickAI extension. It handles the floating button creation, AI chat
 * interface injection, screen capture with OCR processing, and communication
 * between the webpage and the extension background script.
 * 
 * Key Features:
 * - Creates and manages the floating AI button
 * - Injects the React-based chat interface
 * - Handles screen capture and OCR processing
 * - Processes highlighted text queries
 * - Manages error handling and user feedback
 * 
 * @author ClickAI Team
 * @version 1.0.0
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AIResponseAlert from '../src/Components/AIResponseAlert';
import PromptBox from '../src/Components/PromptBox';
import SnippingTool from '../src/Components/SnippingTool';
import Tesseract from 'tesseract.js';
import { AiOutlineMessage } from 'react-icons/ai'; 

// Error message constants - easily configurable for different languages or customization
const ERROR_MESSAGES = {
  NO_TEXT_DETECTED: "No text was detected in the selected area.",
  OCR_ERROR: "OCR error: Unable to extract text from the image. This may be due to website restrictions. Please try copying the text manually.",
  UNEXPECTED_OCR_ERROR: "An unexpected error occurred during image processing. This website is likely blocking the image extraction worker. Please try again or copy the text manually.",
  FETCH_ERROR: "Network error: Unable to contact our AI service. Please check your connection and try again.",
  GLOBAL_ERROR: "An unexpected error occurred in our extension. Please try again.",
  UNHANDLED_REJECTION: "An unexpected error occurred. Please try again."
};

// Global references for managing the AI chat interface
let aiResponseAlertRoot = null;
window.aiResponseAlertRef = null;

/**
 * Preprocesses an image to optimize OCR accuracy by applying grayscale
 * and contrast enhancement filters. This significantly improves text
 * recognition especially for screenshots with poor contrast.
 * 
 * @param {string} dataUrl - Base64 encoded image data URL
 * @returns {Promise<string>} Promise resolving to processed image data URL
 */
function preprocessImage(dataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for pixel manipulation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply grayscale and contrast enhancement
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale using luminance formula
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          
          // Apply contrast enhancement (simple threshold)
          const enhanced = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8);
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put processed data back on canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to data URL and resolve
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for preprocessing'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Performs OCR (Optical Character Recognition) on an image using Tesseract.js
 * with preprocessing for better accuracy. Handles various error conditions
 * and provides user-friendly feedback.
 * 
 * @param {string} imageDataUrl - Base64 encoded image data URL
 * @returns {Promise<string>} Promise resolving to extracted text
 */
async function performOCR(imageDataUrl) {
  try {
    console.log('Starting OCR processing...');
    
    // Preprocess image for better OCR accuracy
    const processedImageUrl = await preprocessImage(imageDataUrl);
    console.log('Image preprocessing completed');
    
    // Configure Tesseract worker with optimized settings
    const { data: { text } } = await Tesseract.recognize(
      processedImageUrl,
      'eng', // English language
      {
        logger: m => {
          // Log progress for debugging (can be removed in production)
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        // Tesseract configuration for better text recognition
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:()-[]{}"\'/\\@#$%^&*+=<>|`~',
        tessedit_pageseg_mode: '6', // Uniform block of text
      }
    );
    
    const cleanText = text.trim();
    console.log('OCR completed, extracted text length:', cleanText.length);
    
    if (!cleanText) {
      throw new Error(ERROR_MESSAGES.NO_TEXT_DETECTED);
    }
    
    return cleanText;
    
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    // Provide specific error messages based on the failure type
    if (error.message === ERROR_MESSAGES.NO_TEXT_DETECTED) {
      throw error;
    } else if (error.name === 'SecurityError' || error.message.includes('worker')) {
      throw new Error(ERROR_MESSAGES.OCR_ERROR);
    } else {
      throw new Error(ERROR_MESSAGES.UNEXPECTED_OCR_ERROR);
    }
  }
}

/**
 * Creates and displays the floating AI button on the webpage.
 * The button provides quick access to the AI chat interface and is
 * positioned to avoid interfering with page content.
 */
function createFloatingButton() {
  // Check if button already exists to avoid duplicates
  if (document.getElementById('ai-float-btn')) {
    return;
  }

  const floatBtn = document.createElement('div');
  floatBtn.id = 'ai-float-btn';
  floatBtn.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000;
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
      user-select: none;
    " title="Open ClickAI Chat">
      💬
    </div>
  `;

  // Add hover effects
  const btnElement = floatBtn.firstElementChild;
  btnElement.addEventListener('mouseenter', () => {
    btnElement.style.transform = 'scale(1.1)';
    btnElement.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
  });
  
  btnElement.addEventListener('mouseleave', () => {
    btnElement.style.transform = 'scale(1)';
    btnElement.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  });

  // Handle button click to open AI chat
  floatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    launchAIResponseAlert('');
    floatBtn.style.display = 'none';
  });

  document.body.appendChild(floatBtn);
}

/**
 * Launches the AI chat interface with an optional initial query.
 * Manages the React component lifecycle and ensures proper cleanup.
 * 
 * @param {string} query - Initial message to send to the AI
 * @param {string} sender - Source of the query ('contextMenu', 'floatingButton', etc.)
 */
function launchAIResponseAlert(query, sender = 'direct') {
  // Remove existing instance if present
  const existingAlert = document.querySelector('#react-root');
  if (existingAlert) {
    if (aiResponseAlertRoot) {
      aiResponseAlertRoot.unmount();
    }
    document.body.removeChild(existingAlert);
  }

  // Create new container for the React component
  const alertContainer = document.createElement('div');
  alertContainer.id = 'react-root';
  alertContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1500;
    pointer-events: none;
  `;

  document.body.appendChild(alertContainer);

  // Create React root and render the AI chat component
  aiResponseAlertRoot = createRoot(alertContainer);
  aiResponseAlertRoot.render(
    React.createElement(AIResponseAlert, {
      ref: (ref) => {
        window.aiResponseAlertRef = ref;
      },
      initialQuery: query,
      isPopup: false
    })
  );

  console.log(`AI chat launched with query: "${query}" from ${sender}`);
}

/**
 * Launches the screen snipping tool for capturing areas of the screen.
 * Provides OCR processing of the captured area and sends the extracted
 * text to the AI for analysis.
 * 
 * @param {boolean} includePrompt - Whether to show additional prompt input
 */
function launchSnippingTool(includePrompt = false) {
  console.log('Launching snipping tool...');
  
  // Remove any existing snipping tool instances
  const existingSnippingTool = document.querySelector('#snipping-root');
  if (existingSnippingTool) {
    existingSnippingTool.remove();
  }

  // Create container for the snipping tool
  const snippingContainer = document.createElement('div');
  snippingContainer.id = 'snipping-root';
  snippingContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    pointer-events: auto;
  `;

  document.body.appendChild(snippingContainer);

  // Create React root for snipping tool
  const snippingRoot = createRoot(snippingContainer);
  
  /**
   * Handles completion of screen capture with OCR processing
   * @param {string} croppedImageData - Base64 encoded cropped image
   */
  const handleSnippingComplete = async (croppedImageData) => {
    console.log('Snipping completed, starting OCR...');
    
    // Cleanup snipping tool UI
    snippingRoot.unmount();
    document.body.removeChild(snippingContainer);
    
    try {
      // Perform OCR on the captured image
      const extractedText = await performOCR(croppedImageData);
      console.log('OCR successful, extracted text:', extractedText.substring(0, 100) + '...');
      
      if (includePrompt) {
        // Show prompt box for additional context
        showPromptBox(extractedText);
      } else {
        // Directly send extracted text to AI
        launchAIResponseAlert(extractedText, 'snipping');
      }
      
    } catch (error) {
      console.error('OCR failed:', error);
      // Show error message to user
      launchAIResponseAlert(error.message, 'snipping-error');
    }
  };

  /**
   * Handles cancellation of screen capture
   */
  const handleSnippingCancel = () => {
    console.log('Snipping cancelled by user');
    snippingRoot.unmount();
    document.body.removeChild(snippingContainer);
  };

  // Render the snipping tool component
  snippingRoot.render(
    React.createElement(SnippingTool, {
      onComplete: handleSnippingComplete,
      onCancel: handleSnippingCancel
    })
  );
}

/**
 * Displays a prompt box allowing users to add additional context
 * to selected text or OCR results before sending to AI.
 * 
 * @param {string} selectedText - Pre-filled text from selection or OCR
 */
function showPromptBox(selectedText) {
  console.log('Showing prompt box for text:', selectedText.substring(0, 50) + '...');
  
  // Remove any existing prompt box
  const existingPrompt = document.querySelector('#prompt-root');
  if (existingPrompt) {
    existingPrompt.remove();
  }

  // Create container for prompt box
  const promptContainer = document.createElement('div');
  promptContainer.id = 'prompt-root';
  promptContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1600;
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  document.body.appendChild(promptContainer);

  // Create React root for prompt box
  const promptRoot = createRoot(promptContainer);
  
  /**
   * Handles submission of the prompt with additional context
   * @param {string} additionalText - Additional context from user
   */
  const handlePromptSubmit = (additionalText) => {
    // Cleanup prompt UI
    promptRoot.unmount();
    document.body.removeChild(promptContainer);
    
    // Combine selected text with additional context
    const fullQuery = additionalText.trim() 
      ? `${additionalText.trim()}\n\nRegarding this text: ${selectedText}`
      : selectedText;
    
    // Launch AI chat with combined query
    launchAIResponseAlert(fullQuery, 'prompt-enhanced');
  };

  // Render the prompt box component
  promptRoot.render(
    React.createElement(PromptBox, {
      selectedText: selectedText,
      onSubmit: handlePromptSubmit
    })
  );
}

/**
 * Handles text selection queries from context menu interactions.
 * Processes the selected text and determines whether to show additional
 * prompt input or send directly to AI.
 * 
 * @param {string} selectedText - Text selected by the user
 * @param {boolean} includePrompt - Whether to show additional prompt input
 */
function handleTextSelection(selectedText, includePrompt = false) {
  if (!selectedText || !selectedText.trim()) {
    console.warn('No text selected for AI query');
    return;
  }

  console.log(`Processing text selection: "${selectedText.substring(0, 50)}..."`);
  
  if (includePrompt) {
    showPromptBox(selectedText);
  } else {
    launchAIResponseAlert(selectedText, 'contextMenu');
  }
}

// Message listener for communication with background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message.type);
  
  try {
    switch (message.type) {
      case 'captureText':
        handleTextSelection(message.selectedText, false);
        break;
        
      case 'captureTextWithPrompt':
        handleTextSelection(message.selectedText, true);
        break;
        
      case 'captureArea':
        launchSnippingTool(false);
        break;
        
      case 'captureAreaAndPrompt':
        launchSnippingTool(true);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
    
    // Send success response
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse({ success: false, error: error.message });
  }
});

// Global error handlers for better user experience
window.addEventListener('error', (event) => {
  console.error('Global error in ClickAI content script:', event.error);
  // Could implement user notification here if needed
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in ClickAI:', event.reason);
  // Could implement user notification here if needed
});

// Initialize the extension when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createFloatingButton();
    console.log('ClickAI content script initialized');
  });
} else {
  createFloatingButton();
  console.log('ClickAI content script initialized');
}

// Make snipping tool globally accessible for other components
window.launchSnippingTool = launchSnippingTool;

// Export functions for testing purposes (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    preprocessImage,
    performOCR,
    handleTextSelection,
  launchSnippingTool,
    showPromptBox
  };
}
