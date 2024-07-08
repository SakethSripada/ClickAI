chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "captureText",
      title: "Ask ClickAI about '%s'",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "captureText") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: captureHighlightedText
      }, (results) => {
        if (results && results[0] && results[0].result) {
          const selectedText = results[0].result;
          sendTextToAI(selectedText, (response) => {
            displayAlert(tab.id, `AI Response: ${response}`);
          });
        }
      });
    }
  });
  
  function captureHighlightedText() {
    const selectedText = window.getSelection().toString();
    return selectedText ? selectedText : null;
  }
  
  function sendTextToAI(text, callback) {
    fetch('http://localhost:5010/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationHistory: [{ sender: 'user', text }]
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data && data.response) {
        callback(data.response);
      } else {
        displayAlert(tab.id, 'Error: No response from AI');
      }
    })
    .catch(error => {
      console.error('Error sending text to AI:', error);
      displayAlert(tab.id, 'Error: Unable to contact AI server');
    });
  }
  
  function displayAlert(tabId, message) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (msg) => alert(msg),
      args: [message]
    });
  }
  