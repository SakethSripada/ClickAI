import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Rnd } from 'react-rnd';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { marked } from 'marked';
import './AIResponseAlert.css';

/**
 * Improved parser for message blocks.
 * It now handles unclosed code fences by treating any content after an opening "```"
 * (without a corresponding closing "```") as code.
 */
function parseMessageToBlocks(message) {
  const parts = [];
  let currentIndex = 0;
  while (currentIndex < message.length) {
    const startFence = message.indexOf("```", currentIndex);
    if (startFence === -1) {
      // No more fences – add the rest as text.
      parts.push({ type: 'text', content: message.slice(currentIndex) });
      break;
    }
    if (startFence > currentIndex) {
      parts.push({
        type: 'text',
        content: message.slice(currentIndex, startFence)
      });
    }
    // Look for the closing fence.
    const endFence = message.indexOf("```", startFence + 3);
    if (endFence === -1) {
      // Unclosed code block – take the rest as code.
      parts.push({ type: 'code', content: message.slice(startFence) });
      break;
    } else {
      parts.push({
        type: 'code',
        content: message.slice(startFence, endFence + 3)
      });
      currentIndex = endFence + 3;
    }
  }
  return parts;
}

/**
 * Extracts the language from a code fence.
 */
function getLanguageFromFence(content) {
  const lines = content.split('\n');
  const firstLine = lines[0].replace(/```/, '').trim();
  return firstLine || 'javascript';
}

/**
 * Extracts the inner code (removing the fences) from the code block.
 */
function getCodeContent(content) {
  return content.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
}

// Configure marked to render non‐code text with breaks.
marked.setOptions({
  breaks: true,
});

const AIResponseAlert = ({ message }) => {
  const [conversation, setConversation] = useState([
    { sender: 'assistant', text: message }
  ]);
  const [userInput, setUserInput] = useState('');
  const [containsMath, setContainsMath] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isDocked, setIsDocked] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(350);
  const [continueId, setContinueId] = useState(null);
  const [isContinued, setIsContinued] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const iframeRef = useRef(null);

  // Check for math content in any assistant message.
  useEffect(() => {
    const mathRegex = /(\$.*?\$|\\\(.*?\)|\\\[.*?\]|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/g;
    const hasMath = conversation.some((msg) => mathRegex.test(msg.text));
    setContainsMath(hasMath);
  }, [conversation]);

  // When math is present, post the text to the iframe for rendering.
  useEffect(() => {
    if (containsMath && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.onload = () => {
        const allAssistantTexts = conversation
          .filter((msg) => msg.sender === 'assistant')
          .map((msg) => msg.text)
          .join('\n\n');
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'render-math',
            content: allAssistantTexts,
          },
          '*'
        );
      };
    }
  }, [containsMath, conversation]);

  /** Closes the alert window. */
  const handleClose = () => {
    const existingAlert = document.querySelector('#react-root');
    if (existingAlert) {
      setTimeout(() => {
        const root = createRoot(existingAlert);
        root.unmount();
        document.body.removeChild(existingAlert);
      }, 100);
    }
  };

  /** Opens the full chat in an extension popup. */
  const handleOpenInChat = () => {
    chrome.runtime.sendMessage({ type: 'openChat', message: message });
    handleClose();
  };

  /** Sends a new user message (follow-up) to the server. */
  const handleSendMessage = () => {
    const followUp = userInput.trim();
    if (!followUp) return;
    setIsLoading(true);
    const updated = [...conversation, { sender: 'user', text: followUp }];
    setConversation(updated);
    setUserInput('');
    chrome.runtime.sendMessage(
      {
        type: 'continueChat',
        conversationHistory: updated,
        continueId: null, // initial generation for follow-up
      },
      (response) => {
        setIsLoading(false);
        if (response && response.response) {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: response.response }
          ]);
          setContinueId(response.id || null);
          setIsContinued(response.isContinued || false);
        } else {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: 'Error: No response from AI.' }
          ]);
        }
      }
    );
  };

  /**
   * Merges the appended response into the last assistant message.
   * If the message ends with an open code block (i.e. odd number of "```"),
   * then the new text is appended directly (after removing any redundant fence).
   * Otherwise, a newline is added.
   */
  const mergeAssistantResponse = (existingText, appendedText) => {
    const fenceRegex = /```/g;
    const fenceMatches = existingText.match(fenceRegex);
    const fenceCount = fenceMatches ? fenceMatches.length : 0;
    if (fenceCount % 2 === 1) {
      // We are inside an open code block.
      if (appendedText.trim().startsWith('```')) {
        appendedText = appendedText.trim().replace(/^```/, '');
      }
      return existingText + appendedText;
    } else {
      return existingText + "\n" + appendedText;
    }
  };

  /** Continues a previously truncated response. */
  const handleContinueGenerating = () => {
    setIsLoading(true);
    chrome.runtime.sendMessage(
      {
        type: 'continueChat',
        conversationHistory: conversation,
        continueId: continueId,
      },
      (response) => {
        setIsLoading(false);
        if (response && response.response) {
          setConversation((prev) => {
            const lastIndex = prev.length - 1;
            const lastMsg = prev[lastIndex];
            if (lastMsg.sender === 'assistant') {
              const mergedText = mergeAssistantResponse(lastMsg.text, response.response);
              const updatedMsg = { ...lastMsg, text: mergedText };
              return [...prev.slice(0, lastIndex), updatedMsg];
            } else {
              return [...prev, { sender: 'assistant', text: response.response }];
            }
          });
          setContinueId(response.id || null);
          setIsContinued(response.isContinued || false);
        } else {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: 'Error: No response from AI.' }
          ]);
          setContinueId(null);
          setIsContinued(false);
        }
      }
    );
  };

  /** Copies code to clipboard. */
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  /** Toggles dock mode. */
  const toggleDock = () => {
    setIsDocked(!isDocked);
  };

  /** Toggles between light and dark themes. */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  /**
   * Renders a single conversation message.
   * Splits out code blocks and wraps them in a SyntaxHighlighter.
   */
  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';
    const blocks = parseMessageToBlocks(msg.text);
    return (
      <div
        key={index}
        className={`message-row ${isUser ? 'message-user' : 'message-assistant'}`}
      >
        <div className="message-bubble">
          {blocks.map((block, i) => {
            if (block.type === 'code') {
              const lang = getLanguageFromFence(block.content);
              const pureCode = getCodeContent(block.content);
              return (
                <div key={i} className="code-block-container">
                  <button
                    className="copy-button"
                    onClick={() => handleCopyCode(pureCode)}
                  >
                    Copy
                  </button>
                  <SyntaxHighlighter language={lang} style={oneDark}>
                    {pureCode}
                  </SyntaxHighlighter>
                </div>
              );
            } else {
              const html = marked.parse(block.content || '');
              return (
                <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
              );
            }
          })}
        </div>
      </div>
    );
  };

  /** Renders the header with title, dock toggle, theme toggle, and close button. */
  const renderHeader = () => {
    return (
      <div className="alert-header drag-handle">
        <span className="alert-title">ClickAI Response</span>
        <div className="header-buttons">
          <button className="dock-btn" onClick={toggleDock}>
            {isDocked ? 'Undock' : 'Dock'}
          </button>
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="alert-close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the conversation content.
   * If a response is pending, displays the “AI is typing…” spinner.
   * Otherwise, if a truncated answer remains, shows the continue button.
   */
  const renderContent = () => {
    return (
      <div className="alert-content" id="ai-response-content">
        {conversation.map((msg, i) => renderMessage(msg, i))}
        {isLoading ? (
          <div className="typing-indicator">
            <FaSpinner className="spinner" /> AI is typing...
          </div>
        ) : (
          isContinued && (
            <div className="continue-container">
              <button
                className="continue-btn"
                onClick={handleContinueGenerating}
                disabled={isLoading}
              >
                Continue Generating
              </button>
            </div>
          )
        )}
        {containsMath && (
          <iframe
            ref={iframeRef}
            title="MathJax Sandbox"
            src={chrome.runtime.getURL('sandbox.html')}
            className="math-iframe"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    );
  };

  /** Renders the footer with the input field and buttons. */
  const renderFooter = () => {
    return (
      <div className="alert-footer">
        <input
          type="text"
          placeholder="Ask a follow-up..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="alert-input"
        />
        <button className="alert-btn primary-btn" onClick={handleSendMessage}>
          Send
        </button>
        <button className="alert-btn outline-btn" onClick={handleOpenInChat}>
          Open In Chat
        </button>
      </div>
    );
  };

  /**
   * Renders the alert window.
   * In docked mode, the panel is wrapped in an Rnd that only allows horizontal resizing.
   */
  const renderWindow = () => {
    if (isDocked) {
      return (
        <Rnd
          size={{ width: dockedWidth, height: window.innerHeight }}
          position={{ x: Math.round(window.innerWidth - dockedWidth), y: 0 }}
          minWidth={300}
          maxWidth={600}
          disableDragging={true}
          enableResizing={{ left: true }}
          bounds="window"
          onResizeStop={(e, direction, ref) => {
            setDockedWidth(parseInt(ref.style.width, 10));
          }}
          className="docked-rnd"
        >
          <div className="alert-window docked">
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
          </div>
        </Rnd>
      );
    }
    return (
      <Rnd
        default={{
          x: Math.round(window.innerWidth / 2 - 300),
          y: Math.round(window.innerHeight / 2 - 200),
          width: 600,
          height: 400,
        }}
        minWidth={300}
        minHeight={200}
        bounds="window"
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
        className="alert-rnd-container"
      >
        <div className="alert-window">
          {renderHeader()}
          {renderContent()}
          {renderFooter()}
        </div>
      </Rnd>
    );
  };

  return (
    <div className="airesponse-container" data-theme={theme}>
      {renderWindow()}
    </div>
  );
};

export default AIResponseAlert;
