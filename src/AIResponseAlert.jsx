import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Rnd } from 'react-rnd'; // For drag + resize
import { FaTimes } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { marked } from 'marked';
import './AIResponseAlert.css';

/**
 * Splits a message into code and text blocks using triple backticks.
 */
function parseMessageToBlocks(message) {
  const regex = /```([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: message.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      content: match[0],
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < message.length) {
    parts.push({
      type: 'text',
      content: message.slice(lastIndex),
    });
  }
  return parts;
}

/**
 * Extracts the language from the code fence.
 */
function getLanguageFromFence(content) {
  const lines = content.split('\n');
  const firstLine = lines[0].replace(/```/, '').trim();
  return firstLine || 'javascript';
}

/**
 * Extracts the inner code from the code fence.
 */
function getCodeContent(content) {
  return content.replace(/```[\s\S]*?\n/, '').replace(/```/, '');
}

// Configure marked for non‐code text (with breaks)
marked.setOptions({
  breaks: true,
});

const AIResponseAlert = ({ message }) => {
  // Conversation state holds both assistant and user messages.
  const [conversation, setConversation] = useState([
    { sender: 'assistant', text: message }
  ]);
  const [userInput, setUserInput] = useState('');
  const [containsMath, setContainsMath] = useState(false);

  // Theme state: "light" or "dark"
  const [theme, setTheme] = useState('light');

  // Dock mode state and dock width (min 300, max 600)
  const [isDocked, setIsDocked] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(350);

  // “Continue generating” state: if the answer was cut off
  const [continueId, setContinueId] = useState(null);
  const [isContinued, setIsContinued] = useState(false);

  const iframeRef = useRef(null);

  // Check for math content in any assistant message.
  useEffect(() => {
    const mathRegex = /(\$.*?\$|\\\(.*?\)|\\\[.*?\]|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/g;
    const hasMath = conversation.some((msg) => mathRegex.test(msg.text));
    setContainsMath(hasMath);
  }, [conversation]);

  // When math is present, post the text to the iframe (math rendering handled later)
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

  /** Sends a new user message to the server. */
  const handleSendMessage = () => {
    const followUp = userInput.trim();
    if (!followUp) return;

    const updated = [...conversation, { sender: 'user', text: followUp }];
    setConversation(updated);
    setUserInput('');

    chrome.runtime.sendMessage(
      {
        type: 'continueChat',
        conversationHistory: updated,
        continueId: null, // initial generation
      },
      (response) => {
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

  /** Continues a previously truncated response. */
  const handleContinueGenerating = () => {
    chrome.runtime.sendMessage(
      {
        type: 'continueChat',
        conversationHistory: conversation,
        continueId: continueId,
      },
      (response) => {
        if (response && response.response) {
          setConversation((prev) => {
            const lastIndex = prev.length - 1;
            const lastMsg = prev[lastIndex];
            if (lastMsg.sender === 'assistant') {
              // Append new text to the previous assistant message.
              const updatedMsg = { ...lastMsg, text: lastMsg.text + response.response };
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
   * Renders a single conversation message,
   * splitting out code blocks and wrapping them in a SyntaxHighlighter.
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

  /**
   * Renders the alert window.
   * When docked, the panel is wrapped in an Rnd that only allows horizontal resizing.
   */
  const renderWindow = () => {
    if (isDocked) {
      return (
        <Rnd
          size={{ width: dockedWidth, height: window.innerHeight }}
          position={{ x: window.innerWidth - dockedWidth, y: 0 }}
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
          x: window.innerWidth / 2 - 300,
          y: window.innerHeight / 2 - 200,
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

  /** Renders the header with the title, dock toggle, theme toggle, and close button. */
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

  /** Renders the conversation content area along with the “Continue Generating” button if needed. */
  const renderContent = () => {
    return (
      <div className="alert-content" id="ai-response-content">
        {conversation.map((msg, i) => renderMessage(msg, i))}
        {isContinued && (
          <div className="continue-container">
            <button className="continue-btn" onClick={handleContinueGenerating}>
              Continue Generating
            </button>
          </div>
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

  return (
    <div className="airesponse-container" data-theme={theme}>
      {renderWindow()}
    </div>
  );
};

export default AIResponseAlert;
