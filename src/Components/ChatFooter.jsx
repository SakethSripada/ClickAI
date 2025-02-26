/*****************************************************
 * src/ChatFooter.js
 *
 * Renders the footer with a text input for the user
 * and a send button. It also handles the up and down
 * arrow keys to navigate through previous user prompts,
 * similar to a terminal. If the input is empty and the
 * user presses the up arrow, the last prompt is loaded.
 * Subsequent up/down key presses navigate the history,
 * and if the user navigates beyond the most recent
 * prompt, the input is cleared.
 *****************************************************/
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';

const ChatFooter = ({ userInput, setUserInput, handleSendMessage, theme, conversation }) => {
  // Local state to track the index in the user input history.
  // We'll store an index into the userHistory array.
  const [historyIndex, setHistoryIndex] = useState(null);

  // Derive the userHistory from the conversation.
  // Only messages from the user are relevant.
  const userHistory = conversation
    ? conversation.filter(msg => msg.sender === 'user').map(msg => msg.text)
    : [];

  // Reset history index when conversation changes
  useEffect(() => {
    setHistoryIndex(null);
  }, [conversation]);

  const handleKeyDown = (e) => {
    // If Enter is pressed (without shift) send the message.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setHistoryIndex(null); // Reset history navigation on send
      handleSendMessage();
      return;
    }

    // Handle Up arrow: navigate backward in history.
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // If there's no history yet or input is not empty and we're not already navigating,
      // start from the most recent prompt.
      if (historyIndex === null) {
        if (userInput.trim() === '' && userHistory.length > 0) {
          const newIndex = userHistory.length - 1;
          setHistoryIndex(newIndex);
          setUserInput(userHistory[newIndex]);
        }
      } else {
        // Navigate further back if possible.
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setUserInput(userHistory[newIndex]);
        }
      }
    }

    // Handle Down arrow: navigate forward in history.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== null) {
        // If we're at the latest entry, clear input and reset index.
        if (historyIndex < userHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setUserInput(userHistory[newIndex]);
        } else {
          setHistoryIndex(null);
          setUserInput('');
        }
      }
    }
  };

  return (
    <Box
      sx={{
        p: 1,
        borderTop: (themeObj) =>
          themeObj.palette.mode === 'light' ? '1px solid #ddd' : '1px solid #555',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        backgroundColor: theme === 'light' ? '#fff' : '#1e1e1e',
      }}
    >
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={4} 
        placeholder="Ask a question..."
        value={userInput}
        onChange={(e) => {
          setUserInput(e.target.value);
          // If user manually types, cancel history navigation.
          if (historyIndex !== null) {
            setHistoryIndex(null);
          }
        }}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        InputProps={{
          style: { color: theme === 'light' ? '#000' : '#fff' },
        }}
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
        onClick={() => {
          setHistoryIndex(null);
          handleSendMessage();
        }}
        sx={{
          textTransform: 'none',
          backgroundColor: theme === 'light' ? '#7f72f0' : '#555',
          '&:hover': {
            backgroundColor: theme === 'light' ? '#6a5fd6' : '#666',
          },
          mr: 1,
        }}
      >
        Send
      </Button>
    </Box>
  );
};

export default ChatFooter;
