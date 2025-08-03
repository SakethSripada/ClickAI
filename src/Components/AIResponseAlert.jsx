/**
 * AIResponseAlert Component
 * 
 * The main chat interface component for the ClickAI extension. This component
 * provides a fully-featured chat window with AI conversation capabilities,
 * including drag-and-drop positioning, docking functionality, theme switching,
 * voice input, and math rendering.
 * 
 * Features:
 * - Resizable and draggable chat window
 * - Docking to screen edges with responsive design
 * - Dark/Light theme support with persistence
 * - Voice input using Web Speech Recognition
 * - Math expression rendering via iframe sandbox
 * - Code syntax highlighting
 * - Continuation of incomplete AI responses
 * - Popup mode for extension popup interface
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.initialQuery - Initial message to send to AI
 * @param {boolean} props.isPopup - Whether component is rendered in popup mode
 * @param {React.Ref} ref - Forward ref for parent component access
 */

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
  // Core conversation state
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [containsMath, setContainsMath] = useState(false);
  
  // Theme management state
  const [theme, setTheme] = useState(null);
  const [themeLoaded, setThemeLoaded] = useState(false);
  
  // UI positioning and sizing state
  const [isDocked, setIsDocked] = useState(false);
  const [dockedWidth, setDockedWidth] = useState(350);
  
  // AI response continuation state
  const [continueId, setContinueId] = useState(null);
  const [isContinued, setIsContinued] = useState(false);
  
  // Loading and interaction state
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Component references
  const recognitionRef = useRef(null);
  const iframeRef = useRef(null);

  // State for managing undocked window dimensions and position
  const [undockedDimensions, setUndockedDimensions] = useState({
    x: Math.round(window.innerWidth / 2 - 300),
    y: Math.round(window.innerHeight / 2 - 200),
    width: 600,
    height: 400,
  });

  /**
   * Load user's preferred theme from Chrome storage on component mount
   */
  useEffect(() => {
    chrome.storage.sync.get('clickaiTheme', (data) => {
      setTheme(data.clickaiTheme || 'light');
      setThemeLoaded(true);
    });
  }, []);

  /**
   * Apply theme changes to document body for global styling
   */
  useEffect(() => {
    if (theme) {
      document.body.dataset.theme = theme;
    }
  }, [theme]);

  /**
   * Toggles between light and dark themes and persists the choice
   */
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      chrome.storage.sync.set({ clickaiTheme: newTheme });
      return newTheme;
    });
  };

  /**
   * Handles docking/undocking the chat window to the right edge of the screen
   */
  const handleToggleDock = () => {
    setIsDocked((prevIsDocked) => {
      const newIsDocked = !prevIsDocked;
      if (newIsDocked) {
        // Docking: adjust page layout to make room for the docked panel
        document.body.style.marginRight = `${dockedWidth}px`;
        document.documentElement.style.setProperty('--docked-width', `${dockedWidth}px`);
      } else {
        // Undocking: restore original page layout
        document.body.style.marginRight = '0px';
        document.documentElement.style.removeProperty('--docked-width');
      }
      return newIsDocked;
    });
  };

  /**
   * Sends a message to the AI backend and handles the response
   * @param {string} message - The message to send to the AI
   * @param {boolean} isInitial - Whether this is the initial message
   */
  const sendMessage = async (message, isInitial = false) => {
    if (!message.trim() && !isInitial) return;

    setIsLoading(true);

    // Add user message to conversation (skip for initial queries from external sources)
    const newConversation = isInitial 
      ? [...conversation] 
      : [...conversation, { sender: 'user', text: message }];
    
    setConversation(newConversation);

    try {
      // Prepare messages in OpenAI format
      const messages = newConversation.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the current message if this is an initial query
      if (isInitial) {
        messages.push({ role: 'user', content: message });
      }

      // Make API request to the backend server
      const response = await fetch(`https://${process.env.BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-secret': process.env.EXTENSION_SECRET,
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          continueId: continueId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle the AI response
      const finalConversation = isInitial 
        ? [
            ...newConversation,
            { sender: 'user', text: message },
            { sender: 'ai', text: data.message }
          ]
        : [
            ...newConversation,
            { sender: 'ai', text: data.message }
          ];

      setConversation(finalConversation);

      // Handle incomplete responses that can be continued
      if (data.isIncomplete && data.continueId) {
        setContinueId(data.continueId);
        setIsContinued(true);
      } else {
        setContinueId(null);
        setIsContinued(false);
      }

      // Check if the response contains mathematical expressions
      setContainsMath(containsMathContent(data.message));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to conversation
      const errorMessage = 'Sorry, I encountered an error while processing your request. Please check your connection and try again.';
      setConversation(prev => [
        ...prev,
        { sender: 'ai', text: errorMessage }
      ]);
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  /**
   * Handles sending a new message from user input
   */
  const handleSendMessage = async () => {
    if (userInput.trim()) {
      await sendMessage(userInput.trim());
    }
  };

  /**
   * Continues generating an incomplete AI response
   */
  const handleContinueGenerating = async () => {
    if (continueId) {
      setIsLoading(true);
      try {
        const messages = conversation.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        const response = await fetch(`https://${process.env.BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-secret': process.env.EXTENSION_SECRET,
          },
          body: JSON.stringify({
            messages,
            temperature: 0.7,
            continueId: continueId
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Append to the last AI message
        setConversation(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].sender === 'ai') {
            updated[lastIndex].text += data.message;
          }
          return updated;
        });

        // Update continuation state
        if (data.isIncomplete && data.continueId) {
          setContinueId(data.continueId);
        } else {
          setContinueId(null);
          setIsContinued(false);
        }

        setContainsMath(containsMathContent(data.message));

      } catch (error) {
        console.error('Error continuing generation:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  /**
   * Toggles voice recording using Web Speech Recognition
   */
  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or another supported browser.');
      return;
    }

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions and try again.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  /**
   * Exposes component methods to parent components via ref
   */
  useImperativeHandle(ref, () => ({
    sendMessage: (message) => sendMessage(message, true),
    clearConversation: () => setConversation([]),
    getConversation: () => conversation,
  }));

  /**
   * Process initial query when component mounts
   */
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      sendMessage(initialQuery, true);
    }
  }, [initialQuery]);

  /**
   * Checks if content contains mathematical expressions
   * @param {string} content - Content to check
   * @returns {boolean} Whether content contains math
   */
  const containsMathContent = (content) => {
    const mathPatterns = [
      /\\\[[\s\S]*?\\\]/,      // LaTeX display math
      /\\\([\s\S]*?\\\)/,      // LaTeX inline math
      /\$\$[\s\S]*?\$\$/,      // $$ display math
      /\$[^$\n]+\$/,           // $ inline math
    ];
    return mathPatterns.some(pattern => pattern.test(content));
  };

  // Common styling for the chat paper component
  const commonPaperStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    bgcolor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    borderRadius: isPopup ? 0 : 2,
    overflow: 'hidden',
  };

  /**
   * Renders the main chat interface
   * @returns {JSX.Element} The rendered chat interface
   */
  const renderChatInterface = () => {
    // Don't render until theme is loaded to prevent flash
    if (!themeLoaded) {
      return null;
    }

    // Popup mode rendering (for extension popup)
    if (isPopup) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          <Paper sx={commonPaperStyles} elevation={0}>
          <ChatHeader
            theme={theme}
            isPopup={true}
              isDocked={isDocked}
              toggleDock={handleToggleDock}
            toggleTheme={toggleTheme}
              handleSnip={() => {
                if (window.launchSnippingTool) window.launchSnippingTool();
              }}
              handleClose={() => window.close()}
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
        </Box>
      );
    }

    // Docked mode rendering
      if (isDocked) {
        return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: `${dockedWidth}px`,
            height: '100vh',
            zIndex: 1500,
            pointerEvents: 'auto',
            }}
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
                // Restore page layout when closing
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
        </Box>
        );
      } else {
      // Floating/draggable mode rendering
        return (
          <Rnd
            size={{ width: undockedDimensions.width, height: undockedDimensions.height }}
            position={{ x: undockedDimensions.x, y: undockedDimensions.y }}
            onDragStop={(e, d) => {
            setUndockedDimensions(prev => ({ ...prev, x: d.x, y: d.y }));
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setUndockedDimensions({
              width: ref.offsetWidth,
              height: ref.offsetHeight,
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
                // Restore page layout on close
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
  };

  return (
    <Box
      sx={{
        pointerEvents: isPopup ? 'auto' : 'none',
        position: isPopup ? 'relative' : 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1500,
      }}
    >
      {renderChatInterface()}
    </Box>
  );
});

// Set display name for better debugging
AIResponseAlert.displayName = 'AIResponseAlert';

export default AIResponseAlert;
