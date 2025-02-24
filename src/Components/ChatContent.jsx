/*****************************************************
 * src/ChatContent.js
 *
 * Renders the chat conversation (message bubbles), a plain
 * loading indicator when AI is typing, and a "Continue Generating"
 * button if the response is incomplete.
 *****************************************************/
import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { FaArrowCircleDown } from 'react-icons/fa';
import MessageBubble from './MessageBubble';

const ChatContent = ({
  conversation,
  isLoading,
  isContinued,
  containsMath,
  theme,
  iframeRef,
  handleContinueGenerating,
  isPopup,
}) => {
  const contentRef = useRef(null);

  // Auto-scroll to the bottom whenever the conversation updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation]);

  return (
    <Box
      id="ai-response-content"
      ref={contentRef}
      sx={{
        flex: 1,
        p: 1,
        overflowY: 'auto',
        backgroundColor: theme === 'light' ? '#f9f9f9' : '#2e2e2e',
        userSelect: 'text',
        // Custom Scrollbar Styles
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme === 'light' ? '#f1f1f1' : '#3e3e3e',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme === 'light' ? '#c1c1c1' : '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme === 'light' ? '#a8a8a8' : '#555',
        },
      }}
    >
      {conversation.map((msg, i) => (
        <MessageBubble key={i} message={msg} theme={theme} isPopup={isPopup} />
      ))}

      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 1,
            ml: 1,
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2" sx={{ color: theme === 'light' ? 'inherit' : '#fff' }}>
            AI is typing...
          </Typography>
        </Box>
      )}
      {isContinued && !isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 1,
            mb: 1,
          }}
        >
          <Button
            variant="contained"
            onClick={handleContinueGenerating}
            startIcon={<FaArrowCircleDown />}
            sx={{
              textTransform: 'none',
              backgroundColor: theme === 'light' ? '#7f72f0' : '#555',
              '&:hover': {
                backgroundColor: theme === 'light' ? '#6a5fd6' : '#666',
              },
            }}
          >
            Continue Generating
          </Button>
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
      <Box sx={{ height: 8 }} />
    </Box>
  );
};

export default ChatContent;
