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
 *****************************************************/
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createRoot } from 'react-dom/client';
import { Rnd } from 'react-rnd';
import { Box, Paper } from '@mui/material';
import ChatHeader from './ChatHeader';
import ChatContent from './ChatContent'; // Updated to auto-scroll on new messages
import ChatFooter from './ChatFooter';

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
  
  // New state for voice recording
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const iframeRef = useRef(null);

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

  // On mount, if an initialQuery is provided
  useEffect(() => {
    if (initialQuery) {
      setConversation([{ sender: 'user', text: initialQuery }]);
      setIsLoading(true);
    }
  }, [initialQuery]);

  useEffect(() => {
    const mathRegex = /(\$.*?\$|\\\(.*?\)|\\\[.*?\]|\\begin\{.*?\}[\s\S]*?\\end\{.*?\})/g;
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
      alert("Speech Recognition not supported in this browser.");
      return;
    }
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
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
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

  // Close handler: gracefully unmount the React root from the DOM
  // and restore the page's width to its original state.
  const handleClose = () => {
    // Remove docking modifications to restore page layout
    document.body.classList.remove('ai-docked-mode');
    document.body.style.marginRight = '';
    document.documentElement.style.setProperty('--docked-width', '0px');

    const existingAlert = document.querySelector('#react-root');
    if (existingAlert) {
      setTimeout(() => {
        const root = createRoot(existingAlert);
        root.unmount();
        document.body.removeChild(existingAlert);
        // Show the floating button when chat window is closed
        const floatBtn = document.getElementById('ai-float-btn');
        if (floatBtn) {
          floatBtn.style.display = 'block';
        }
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('Code copied to clipboard!');
    });
  };

  // When the camera icon is clicked, call window.launchSnippingTool (defined in content.js)
  const handleSnip = () => {
    if (window.launchSnippingTool) {
      window.launchSnippingTool();
    }
  };

  const toggleDock = () => {
    setIsDocked((prev) => {
      const newDockState = !prev;
      if (newDockState) {
        document.body.classList.add('ai-docked-mode');
        document.body.style.marginRight = `${dockedWidth}px`;
        document.documentElement.style.setProperty('--docked-width', `${dockedWidth}px`);
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

  const handleSnipFromHeader = () => {
    // Optional: additional logging or UI changes can be added here
    handleSnip();
  };

  // Render the chat window using react-rnd.
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
              document.documentElement.style.setProperty('--docked-width', `${newWidth}px`);
            }
          }}
          style={{ pointerEvents: 'all', zIndex: 1500 }}
        >
          <Paper sx={commonPaperStyles} elevation={6}>
            <ChatHeader
              theme={theme}
              isDocked={isDocked}
              toggleDock={toggleDock}
              toggleTheme={toggleTheme}
              handleSnip={handleSnip}
              handleClose={handleClose}
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
        style={{ pointerEvents: 'all', zIndex: 1500 }}
      >
        <Paper sx={commonPaperStyles} elevation={6}>
          <ChatHeader
            theme={theme}
            isDocked={isDocked}
            toggleDock={toggleDock}
            toggleTheme={toggleTheme}
            handleSnip={handleSnip}
            handleClose={handleClose}
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
        pointerEvents: 'none',
      }}
      data-theme={theme}
    >
      {renderWindow()}
    </Box>
  );
});

export default AIResponseAlert;
