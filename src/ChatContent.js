/*****************************************************
 * src/ChatContent.js
 *
 * Renders the chat conversation (message bubbles) and
 * a plain loading indicator when AI is typing.
 *****************************************************/
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import MessageBubble from './MessageBubble';

const ChatContent = ({ conversation, isLoading, containsMath, theme, iframeRef }) => {
  return (
    <Box
      id="ai-response-content"
      sx={{
        flex: 1,
        p: 1,
        overflowY: 'auto',
        backgroundColor: theme === 'light' ? '#f9f9f9' : '#2e2e2e',
      }}
    >
      {conversation.map((msg, i) => (
        <MessageBubble key={i} message={msg} theme={theme} />
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
          <Typography variant="body2">AI is typing...</Typography>
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
