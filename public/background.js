chrome.runtime.onInstalled.addListener(() => {
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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "captureText") {
        handleCaptureText(info, tab);
    } else if (info.menuItemId === "addPromptAndCaptureText") {
        handleAddPromptAndCaptureText(info, tab);
    }
});

function handleCaptureText(info, tab) {
    if (info.selectionText) {
        const selectedText = info.selectionText;
        injectConsoleLog(tab.id, "Captured Text: " + selectedText);
        displayLoadingAlert(tab.id, "Getting AI Response...");
        sendTextToAI(tab.id, selectedText, (response) => {
            injectConsoleLog(tab.id, "AI Response: " + response);
            updateCustomAlert(tab.id, `AI Response: ${response}`);
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
                displayLoadingAlert(tab.id, "Getting AI Response...");
                sendTextToAI(tab.id, selectedText, (response) => {
                    injectConsoleLog(tab.id, "AI Response: " + response);
                    updateCustomAlert(tab.id, `AI Response: ${response}`);
                    chrome.runtime.sendMessage({ type: 'openChat', message: response });
                });
            } else {
                injectConsoleLog(tab.id, 'Error: No text selected');
                displayCustomAlert(tab.id, 'Error: No text selected');
            }
        });
    }
}

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


function promptForAdditionalText(tabId, selectedText, callback) {
    chrome.tabs.sendMessage(tabId, { type: 'showPrompt', selectedText: selectedText }, (response) => {
        if (response && response.additionalText !== undefined) {
            const additionalText = response.additionalText;
            const combinedText = additionalText ? `${additionalText} ${selectedText}` : selectedText;
            callback(combinedText);
        } else {
            callback(selectedText);
        }
    });
}

function handleTextCaptureWithPrompt(tabId, combinedText) {
    injectConsoleLog(tabId, "Captured Text with Prompt: " + combinedText);
    displayLoadingAlert(tabId, "Getting AI Response...");
    sendTextToAI(tabId, combinedText, (response) => {
        injectConsoleLog(tabId, "AI Response: " + response);
        updateCustomAlert(tabId, `AI Response: ${response}`);
        chrome.runtime.sendMessage({ type: 'openChat', message: response });
    });
}

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
            updateCustomAlert(tabId, 'Error: No response from AI');
        }
    })
    .catch(error => {
        console.error('Error sending text to AI:', error);
        injectConsoleLog(tabId, 'Error: Unable to contact AI server');
        updateCustomAlert(tabId, 'Error: Unable to contact AI server');
    });
}

function displayLoadingAlert(tabId, message) {
    chrome.tabs.sendMessage(tabId, { type: 'customAlert', message: message, loading: true });
}

function updateCustomAlert(tabId, message) {
    chrome.tabs.sendMessage(tabId, { type: 'customAlert', message: message, loading: false });
}

function injectConsoleLog(tabId, message) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (msg) => console.log(msg),
        args: [message]
    });
}

function displayCustomAlert(tabId, message) {
    chrome.tabs.sendMessage(tabId, { type: 'customAlert', message: message, loading: false });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'openChat') {
        chrome.storage.local.set({ aiMessage: request.message }, () => {
            highlightExtensionIcon();
        });
    }
});

function highlightExtensionIcon() {
    chrome.action.setBadgeText({ text: 'NEW' });
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'popupOpened') {
        clearBadge();
    }
});

function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
}
