/*****************************************************
 * src/AIResponseAlert.js
 *
 * This React component renders the main chat UI window.
 * It supports message rendering, code syntax highlighting,
 * math rendering via an iframe sandbox, docking/resizing,
 * theme switching, and continuous chat.
 *
 * Now using Material UI as the base for a gorgeous, fully
 * responsive, animated UI – while keeping all the same logic.
 *****************************************************/
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createRoot } from 'react-dom/client';
import { Rnd } from 'react-rnd';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { marked } from 'marked';
import {
  Box,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Slide,
} from '@mui/material';
import { FaTimes, FaCamera, FaCopy } from 'react-icons/fa';

// Utility function to split message into blocks using triple backticks
function parseMessageToBlocks(message) {
  const parts = [];
  let currentIndex = 0;
  while (currentIndex < message.length) {
    const startFence = message.indexOf('```', currentIndex);
    if (startFence === -1) {
      parts.push({ type: 'text', content: message.slice(currentIndex) });
      break;
    }
    if (startFence > currentIndex) {
      parts.push({
        type: 'text',
        content: message.slice(currentIndex, startFence),
      });
    }
    const endFence = message.indexOf('```', startFence + 3);
    if (endFence === -1) {
      parts.push({ type: 'code', content: message.slice(startFence) });
      break;
    } else {
      parts.push({
        type: 'code',
        content: message.slice(startFence, endFence + 3),
      });
      currentIndex = endFence + 3;
    }
  }
  return parts;
}

function getLanguageFromFence(content) {
  const lines = content.split('\n');
  const firstLine = lines[0].replace(/```/, '').trim();
  return firstLine || 'javascript';
}

function getCodeContent(content) {
  return content.replace(/^```[\s\S]*?\n/, '').replace(/```$/, '');
}

// Configure marked to render non-code text with breaks.
marked.setOptions({
  breaks: true,
});

const AIResponseAlert = forwardRef(({ initialQuery }, ref) => {
  // STATES
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [containsMath, setContainsMath] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isDocked, setIsDocked] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(350);
  const [continueId, setContinueId] = useState(null);
  const [isContinued, setIsContinued] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const iframeRef = useRef(null);

  // Expose imperative methods to append a new query and update the AI response.
  useImperativeHandle(ref, () => ({
    appendUserQuery(query) {
      setConversation((prev) => [...prev, { sender: 'user', text: query }]);
      setIsLoading(true);
    },
    updateLastAssistantResponse(response) {
      setConversation((prev) => [
        ...prev,
        { sender: 'assistant', text: response },
      ]);
      setIsLoading(false);
    },
  }));

  // On mount, if an initialQuery is provided
  useEffect(() => {
    if (initialQuery) {
      setConversation([{ sender: 'user', text: initialQuery }]);
      setIsLoading(true);
    }
  }, [initialQuery]);

  useEffect(() => {
    const mathRegex =
      /(\$.*?\$|\\\(.*?\)|\\\[.*?\]|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/g;
    const hasMath = conversation.some((msg) => mathRegex.test(msg.text));
    setContainsMath(hasMath);
  }, [conversation]);

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

  // Close handler: gracefully unmount the React root from the DOM.
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
        continueId: null,
      },
      (response) => {
        setIsLoading(false);
        if (response && response.response) {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: response.response },
          ]);
          setContinueId(response.id || null);
          setIsContinued(response.isContinued || false);
        } else {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: 'Error: No response from AI.' },
          ]);
        }
      }
    );
  };

  const mergeAssistantResponse = (existingText, appendedText) => {
    const fenceRegex = /```/g;
    const fenceMatches = existingText.match(fenceRegex);
    const fenceCount = fenceMatches ? fenceMatches.length : 0;
    if (fenceCount % 2 === 1) {
      if (appendedText.trim().startsWith('```')) {
        appendedText = appendedText.trim().replace(/^```/, '');
      }
      return existingText + appendedText;
    } else {
      return existingText + '\n' + appendedText;
    }
  };

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
              const mergedText = mergeAssistantResponse(
                lastMsg.text,
                response.response
              );
              const updatedMsg = { ...lastMsg, text: mergedText };
              return [...prev.slice(0, lastIndex), updatedMsg];
            } else {
              return [
                ...prev,
                { sender: 'assistant', text: response.response },
              ];
            }
          });
          setContinueId(response.id || null);
          setIsContinued(response.isContinued || false);
        } else {
          setConversation((prev) => [
            ...prev,
            { sender: 'assistant', text: 'Error: No response from AI.' },
          ]);
          setContinueId(null);
          setIsContinued(false);
        }
      }
    );
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  const toggleDock = () => {
    setIsDocked((prev) => {
      const newDockState = !prev;
      if (newDockState) {
        document.body.classList.add('ai-docked-mode');
        document.body.style.marginRight = `${dockedWidth}px`;
        document.documentElement.style.setProperty(
          '--docked-width',
          `${dockedWidth}px`
        );
      } else {
        document.body.classList.remove('ai-docked-mode');
        document.body.style.marginRight = '';
        document.documentElement.style.setProperty('--docked-width', '0px');
      }
      return newDockState;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSnip = () => {
    if (window.launchSnippingTool) {
      window.launchSnippingTool();
    }
  };

  // Render a single message with beautiful animations.
  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';
    const blocks = parseMessageToBlocks(msg.text);
    return (
      <Slide
        direction="up"
        in={true}
        mountOnEnter
        unmountOnExit
        key={index}
        timeout={300}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 1, // reduced bottom margin between messages
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: '70%',
              px: 1.5, // horizontal padding
              py: 0.75, // reduced vertical padding inside the bubble
              borderRadius: 2,
              backgroundColor: isUser
                ? theme === 'light'
                  ? '#dfffe2'
                  : '#2d4a2d'
                : theme === 'light'
                ? '#e7f4ff'
                : '#2a3a4a',
              color: theme === 'light' ? '#333' : '#eee',
              wordBreak: 'break-word',
            }}
          >
            {blocks.map((block, i) => {
              if (block.type === 'code') {
                const lang = getLanguageFromFence(block.content);
                const pureCode = getCodeContent(block.content);
                return (
                  <Box
                    key={i}
                    sx={{
                      position: 'relative',
                      my: 1,
                      backgroundColor: '#2e3440',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <IconButton
                      onClick={() => handleCopyCode(pureCode)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor:
                          theme === 'light'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor:
                            theme === 'light'
                              ? 'rgba(255,255,255,0.4)'
                              : 'rgba(0,0,0,0.4)',
                        },
                      }}
                    >
                      <FaCopy style={{ fontSize: '0.9rem', color: '#fff' }} />
                    </IconButton>
                    <SyntaxHighlighter
                      language={lang}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '16px',
                        backgroundColor: '#2e3440',
                        borderRadius: 4,
                      }}
                    >
                      {pureCode}
                    </SyntaxHighlighter>
                  </Box>
                );
              } else {
                const html = marked.parse(block.content || '');
                return (
                  <Box
                    key={i}
                    sx={{ mt: i === 0 ? 0 : 0.5 }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              }
            })}
          </Paper>
        </Box>
      </Slide>
    );
  };

  // Render header using a Material UI AppBar with custom styling and smooth transitions.
  const renderHeader = () => {
    return (
      <AppBar
        position="static"
        sx={{
          background:
            theme === 'light'
              ? 'linear-gradient(135deg, #7f72f0, #3aa0ff)'
              : 'linear-gradient(135deg, #333, #555)',
          boxShadow: 3,
          cursor: 'move',
          px: 1,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            transition: 'all 0.3s ease',
          }}
        >
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ClickAI
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={toggleDock}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {isDocked ? 'Undock' : 'Dock'}
            </Button>
            <Button
              variant="outlined"
              onClick={toggleTheme}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
            <IconButton
              onClick={handleSnip}
              sx={{ color: '#fff' }}
              title="Capture Area"
            >
              <FaCamera />
            </IconButton>
            <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
              <FaTimes />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    );
  };

  // Render content with chat messages, loading indicator, continue button and math iframe.
  const renderContent = () => {
    return (
      <Box
        id="ai-response-content"
        sx={{
          flex: 1,
          p: 1,
          overflowY: 'auto',
          backgroundColor:
            theme === 'light' ? '#f9f9f9' : theme === 'dark' ? '#2e2e2e' : '#f9f9f9',
        }}
      >
        {conversation.map((msg, i) => renderMessage(msg, i))}
        {/* Show the loading indicator as if it were a message at the end */}
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                maxWidth: '70%',
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                backgroundColor: theme === 'light' ? '#e7f4ff' : '#2a3a4a',
                color: theme === 'light' ? '#333' : '#eee',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">AI is typing...</Typography>
              </Box>
            </Paper>
          </Box>
        )}
        {containsMath && (
          <iframe
            ref={iframeRef}
            title="MathJax Sandbox"
            src={chrome.runtime.getURL('sandbox.html')}
            style={{ display: 'none' }}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
        {/* Extra bottom padding so last message isn't flush to the bottom */}
        <Box sx={{ height: 8 }} />
      </Box>
    );
  };

  // Render footer with a TextField for user input and a Send button.
  const renderFooter = () => {
    return (
      <Box
        sx={{
          p: 1,
          borderTop: (themeObj) =>
            themeObj.palette.mode === 'light'
              ? '1px solid #ddd'
              : '1px solid #555',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e',
        }}
      >
        <TextField
          fullWidth
          placeholder="Ask a question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: theme === 'light' ? '#fff' : '#2e2e2e',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: theme === 'light' ? '#ccc' : '#555',
              },
              '&:hover fieldset': {
                borderColor: theme === 'light' ? '#7f72f0' : '#888',
              },
              '&.Mui-focused fieldset': {
                borderColor: theme === 'light' ? '#7f72f0' : '#888',
              },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          sx={{
            textTransform: 'none',
            backgroundColor: theme === 'light' ? '#7f72f0' : '#555',
            '&:hover': {
              backgroundColor: theme === 'light' ? '#6a5fd6' : '#666',
            },
            mr: 1, // extra space to the right of the send button
          }}
        >
          Send
        </Button>
      </Box>
    );
  };

  // Render the full window using react-rnd.
  const renderWindow = () => {
    const commonPaperStyles = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      borderRadius: isDocked ? 0 : 8,
    };

    if (isDocked) {
      return (
        <Rnd
          size={{ width: dockedWidth, height: window.innerHeight }}
          position={{
            x: Math.round(window.innerWidth - dockedWidth),
            y: 0,
          }}
          minWidth={300}
          maxWidth={800}
          disableDragging={true}
          enableResizing={{ left: true }}
          bounds="window"
          onResizeStop={(e, direction, refElement) => {
            const newWidth = parseInt(refElement.style.width, 10);
            setDockedWidth(newWidth);
            if (isDocked) {
              document.body.style.marginRight = `${newWidth}px`;
              document.documentElement.style.setProperty(
                '--docked-width',
                `${newWidth}px`
              );
            }
          }}
          style={{ pointerEvents: 'all', zIndex: 1500 }}
        >
          <Paper sx={commonPaperStyles} elevation={6}>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
          </Paper>
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
        style={{ pointerEvents: 'all', zIndex: 1500 }}
      >
        <Paper sx={commonPaperStyles} elevation={6}>
          {renderHeader()}
          {renderContent()}
          {renderFooter()}
        </Paper>
      </Rnd>
    );
  };

  // Main container styling (using a Box as the outer container)
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
      data-theme={theme}
    >
      {renderWindow()}
    </Box>
  );
});

export default AIResponseAlert;

/* 
Additional global CSS (for docking page shifts) – include this in your main CSS file or inject it via a style tag:

.ai-docked-mode {
  margin-right: var(--docked-width, 350px);
  transition: margin-right 0.3s ease-in-out;
  overflow-x: hidden;
}
body.ai-docked-mode {
  width: calc(100% - var(--docked-width, 350px));
}

This ensures the rest of your webpage smoothly shifts when the chat window is docked.
*/
