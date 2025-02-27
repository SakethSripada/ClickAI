/*****************************************************
 * src/AIResponseAlert.js
 *
 * This React component renders the main chat UI window.
 * It supports message rendering, code syntax highlighting,
 * math rendering via an iframe sandbox, docking/resizing,
 * theme switching, continuous chat, and "Continue Generating"
 * functionality for incomplete responses.
 *
 * Now using Material UI as the base for a gorgeous, fully
 * responsive, animated UI – while keeping all the same logic.
 * 
 * Added: Voice input functionality via SpeechRecognition.
 * Production improvements include detailed comments and 
 * robust error handling.
 *
 * When rendered in popup mode (isPopup=true), the draggable,
 * dock, camera, and close controls are omitted. Also, the UI is
 * made fully clickable (pointerEvents auto) and the chat window
 * border radius is removed.
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
import { Box, Paper } from '@mui/material';
import ChatHeader from './ChatHeader';
import ChatContent from './ChatContent';
import ChatFooter from './ChatFooter';

const AIResponseAlert = forwardRef(({ initialQuery, isPopup = false }, ref) => {
  // STATES
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [containsMath, setContainsMath] = useState(false);
  // Initialize theme as null until loaded
  const [theme, setTheme] = useState(null);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(350);
  const [continueId, setContinueId] = useState(null);
  const [isContinued, setIsContinued] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const iframeRef = useRef(null);

  // Add state for undocked dimensions.
  const [undockedDimensions, setUndockedDimensions] = useState({
    x: Math.round(window.innerWidth / 2 - 300),
    y: Math.round(window.innerHeight / 2 - 200),
    width: 600,
    height: 400,
  });

  // Retrieve the saved theme from chrome.storage.sync and mark as loaded
  useEffect(() => {
    chrome.storage.sync.get('clickaiTheme', (data) => {
      setTheme(data.clickaiTheme || 'light');
      setThemeLoaded(true);
    });
  }, []);

  // Update document styling when theme changes
  useEffect(() => {
    if (theme) {
      document.body.dataset.theme = theme;
    }
  }, [theme]);

  // Define toggleTheme function to flip light/dark mode and store the new value.
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      chrome.storage.sync.set({ clickaiTheme: newTheme });
      return newTheme;
    });
  };

  // Replace inline toggle with a dedicated function.
  const handleToggleDock = () => {
    if (isDocked) {
      // Reset undocked dimensions to a default, centered state when undocking.
      setUndockedDimensions({
        x: Math.round(window.innerWidth / 2 - 300),
        y: Math.round(window.innerHeight / 2 - 200),
        width: 600,
        height: 400,
      });
    }
    setIsDocked((prev) => !prev);
  };

  // Expose imperative methods to append a new query and update the AI response.
  useImperativeHandle(ref, () => ({
    appendUserQuery(query) {
      setConversation((prev) => [...prev, { sender: 'user', text: query }]);
      setIsLoading(true);
    },
    updateLastAssistantResponse(response) {
      setConversation((prev) => [...prev, { sender: 'assistant', text: response }]);
      setIsLoading(false);
    },
  }));

  // On mount, if an initialQuery is provided.
  useEffect(() => {
    if (initialQuery) {
      setConversation([{ sender: 'user', text: initialQuery }]);
      setIsLoading(true);
    }
  }, [initialQuery]);

  // Check if any conversation message contains math expressions.
  useEffect(() => {
    const mathRegex = /(\$.*?\$|\\\(.*?\)|\\\[.*?\]|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/g;
    const hasMath = conversation.some((msg) => mathRegex.test(msg.text));
    setContainsMath(hasMath);
  }, [conversation]);

  // When math is detected, send a message to the iframe to render it.
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

  // --- Voice Recognition Functions ---
  const handleSendVoiceMessage = (transcript) => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    const updated = [...conversation, { sender: 'user', text: transcript.trim() }];
    setConversation(updated);
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

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendVoiceMessage(transcript);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };
  // --- End Voice Functions ---

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
            { sender: 'assistant', text: 'Error: No response from AI.' },
          ]);
          setContinueId(null);
          setIsContinued(false);
        }
      }
    );
  };

  // Update page layout immediately when docking toggles.
  useEffect(() => {
    if (isDocked) {
      document.body.style.marginRight = `${dockedWidth}px`;
      document.documentElement.style.setProperty('--docked-width', `${dockedWidth}px`);
    } else {
      document.body.style.marginRight = '0px';
      document.documentElement.style.removeProperty('--docked-width');
    }
  }, [isDocked, dockedWidth]);

  // Cleanup margin when component unmounts.
  useEffect(() => {
    return () => {
      document.body.style.marginRight = '0px';
      document.documentElement.style.removeProperty('--docked-width');
    };
  }, []);

  // When rendering in popup mode, remove border radius.
  const commonPaperStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    borderRadius: isPopup ? 0 : (isDocked ? 0 : 8),
  };

  const renderWindow = () => {
    if (isPopup) {
      return (
        <Paper sx={commonPaperStyles} elevation={6}>
          <ChatHeader
            theme={theme}
            isPopup={true}
            toggleTheme={toggleTheme}
            handleVoiceToggle={handleVoiceToggle}
            isRecording={isRecording}
          />
          <ChatContent
            conversation={conversation}
            isLoading={isLoading}
            isContinued={isContinued}
            containsMath={containsMath}
            theme={theme}
            iframeRef={iframeRef}
            handleContinueGenerating={handleContinueGenerating}
            isPopup={true}
          />
          <ChatFooter
            userInput={userInput}
            setUserInput={setUserInput}
            handleSendMessage={handleSendMessage}
            theme={theme}
          />
        </Paper>
      );
    } else {
      if (isDocked) {
        // In docked mode we force fixed positioning so that the chat window is immediately at the right,
        // and the body margin (set in the useEffect above) ensures the page content is pushed aside.
        return (
          <Rnd
            size={{ width: dockedWidth, height: window.innerHeight }}
            position={{ x: window.innerWidth - dockedWidth, y: 0 }}
            minWidth={320}
            maxWidth={800}
            disableDragging={true}
            enableResizing={{ left: true }}
            bounds="window"
            style={{ position: 'fixed', top: 0, right: 0, zIndex: 1500, pointerEvents: 'all' }}
            // Prevent any drag or resize events from propagating when docked.
            onDragStart={(e) => e.preventDefault()}
            onResizeStart={(e) => e.stopPropagation()}
            onResizeStop={(e, direction, refElement) => {
              const newWidth = parseInt(refElement.style.width, 10);
              setDockedWidth(newWidth);
              document.body.style.marginRight = `${newWidth}px`;
              document.documentElement.style.setProperty('--docked-width', `${newWidth}px`);
            }}
          >
            <Paper sx={commonPaperStyles} elevation={6}>
              <ChatHeader
                theme={theme}
                isPopup={false}
                isDocked={isDocked}
                dockedWidth={dockedWidth}
                toggleDock={() => setIsDocked((prev) => !prev)}
                toggleTheme={toggleTheme}
                handleSnip={() => {
                  if (window.launchSnippingTool) window.launchSnippingTool();
                }}
                handleClose={() => {
                  // Restore page layout on close.
                  document.body.style.marginRight = '0px';
                  document.documentElement.style.removeProperty('--docked-width');
                  const existingAlert = document.querySelector('#react-root');
                  if (existingAlert) {
                    const root = createRoot(existingAlert);
                    root.unmount();
                    document.body.removeChild(existingAlert);
                    const floatBtn = document.getElementById('ai-float-btn');
                    if (floatBtn) floatBtn.style.display = 'block';
                  }
                }}
                handleVoiceToggle={handleVoiceToggle}
                isRecording={isRecording}
              />
              <ChatContent
                conversation={conversation}
                isLoading={isLoading}
                isContinued={isContinued}
                containsMath={containsMath}
                theme={theme}
                iframeRef={iframeRef}
                handleContinueGenerating={handleContinueGenerating}
              />
              <ChatFooter
                userInput={userInput}
                setUserInput={setUserInput}
                handleSendMessage={handleSendMessage}
                theme={theme}
              />
            </Paper>
          </Rnd>
        );
      } else {
        return (
          <Rnd
            size={{ width: undockedDimensions.width, height: undockedDimensions.height }}
            position={{ x: undockedDimensions.x, y: undockedDimensions.y }}
            minWidth={320}
            minHeight={200}
            bounds="window"
            dragHandleClassName="chat-header-drag-handle"
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
            onDragStop={(e, d) => {
              setUndockedDimensions((prev) => ({ ...prev, x: d.x, y: d.y }));
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setUndockedDimensions({
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                x: position.x,
                y: position.y,
              });
            }}
            style={{ pointerEvents: 'all', zIndex: 1500 }}
          >
            <Paper sx={commonPaperStyles} elevation={6}>
              <ChatHeader
                theme={theme}
                isPopup={false}
                isDocked={isDocked}
                toggleDock={handleToggleDock}
                toggleTheme={toggleTheme}
                handleSnip={() => {
                  if (window.launchSnippingTool) window.launchSnippingTool();
                }}
                handleClose={() => {
                  // Restore page layout on close.
                  document.body.style.marginRight = '0px';
                  document.documentElement.style.removeProperty('--docked-width');
                  const existingAlert = document.querySelector('#react-root');
                  if (existingAlert) {
                    const root = createRoot(existingAlert);
                    root.unmount();
                    document.body.removeChild(existingAlert);
                    const floatBtn = document.getElementById('ai-float-btn');
                    if (floatBtn) floatBtn.style.display = 'block';
                  }
                }}
                handleVoiceToggle={handleVoiceToggle}
                isRecording={isRecording}
              />
              <ChatContent
                conversation={conversation}
                isLoading={isLoading}
                isContinued={isContinued}
                containsMath={containsMath}
                theme={theme}
                iframeRef={iframeRef}
                handleContinueGenerating={handleContinueGenerating}
              />
              <ChatFooter
                userInput={userInput}
                setUserInput={setUserInput}
                handleSendMessage={handleSendMessage}
                theme={theme}
                conversation={conversation}
              />
            </Paper>
          </Rnd>
        );        
      }
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        pointerEvents: isPopup ? 'auto' : 'none',
      }}
      data-theme={theme}
    >
      {themeLoaded ? renderWindow() : <div />}
    </Box>
  );
});

export default AIResponseAlert;
