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
      });
    }
  });
  
  function captureHighlightedText() {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      console.log("Captured text:", selectedText);
      alert(`Captured text: ${selectedText}`);
    } else {
      alert("No text selected");
    }
  }
  