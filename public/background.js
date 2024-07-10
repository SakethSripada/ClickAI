chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "captureText",
        title: "Ask ClickAI about '%s'",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "captureText") {
        if (info.selectionText) {
            const selectedText = info.selectionText;
            injectConsoleLog(tab.id, "Captured Text: " + selectedText);
            sendTextToAI(tab.id, selectedText, (response) => {
                injectConsoleLog(tab.id, "AI Response: " + response);
                displayCustomAlert(tab.id, `AI Response: ${response}`);
                chrome.runtime.sendMessage({ type: 'openChat', message: response });
            });
        } else {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: captureHighlightedText
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    const selectedText = results[0].result;
                    injectConsoleLog(tab.id, "Captured Text: " + selectedText);
                    sendTextToAI(tab.id, selectedText, (response) => {
                        injectConsoleLog(tab.id, "AI Response: " + response);
                        displayCustomAlert(tab.id, `AI Response: ${response}`);
                        chrome.runtime.sendMessage({ type: 'openChat', message: response });
                    });
                } else {
                    injectConsoleLog(tab.id, 'Error: No text selected');
                    displayCustomAlert(tab.id, 'Error: No text selected');
                }
            });
        }
    }
});

function captureHighlightedText() {
    const selectedText = window.getSelection().toString();
    return selectedText ? selectedText : null;
}

function sendTextToAI(tabId, text, callback) {
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
            injectConsoleLog(tabId, 'Error: No response from AI');
            displayCustomAlert(tabId, 'Error: No response from AI');
        }
    })
    .catch(error => {
        console.error('Error sending text to AI:', error);
        injectConsoleLog(tabId, 'Error: Unable to contact AI server');
        displayCustomAlert(tabId, 'Error: Unable to contact AI server');
    });
}

function displayCustomAlert(tabId, message) {
    chrome.tabs.sendMessage(tabId, { type: 'customAlert', message: message });
}

function injectConsoleLog(tabId, message) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg) => console.log(msg),
        args: [message]
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'openChat') {
        chrome.storage.local.set({ aiMessage: request.message }, () => {
            highlightExtensionIcon();
        });
    }
});

function highlightExtensionIcon() {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'popupOpened') {
        clearBadge();
    }
});

function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
