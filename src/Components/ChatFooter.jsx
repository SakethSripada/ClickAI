import React, { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';

const ChatFooter = ({ userInput, setUserInput, handleSendMessage, theme, conversation }) => {
  // Local state to track the index in the user input history.
  const [historyIndex, setHistoryIndex] = useState(null);

  // Derive the userHistory from the conversation.
  const userHistory = conversation
    ? conversation.filter(msg => msg.sender === 'user').map(msg => msg.text)
    : [];

  // Reset history index when conversation changes.
  useEffect(() => {
    setHistoryIndex(null);
  }, [conversation]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setHistoryIndex(null); // Reset history navigation on send.
      handleSendMessage();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex === null) {
        if (userInput.trim() === '' && userHistory.length > 0) {
          const newIndex = userHistory.length - 1;
          setHistoryIndex(newIndex);
          setUserInput(userHistory[newIndex]);
        }
      } else {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setUserInput(userHistory[newIndex]);
        }
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== null) {
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
            // Force the text and placeholder colors to override any external CSS
            '& input': {
              color: theme === 'light' ? '#000' : '#fff',
              '&::placeholder': {
                color: theme === 'light' ? '#aaa' : '#ccc',
                opacity: 1,  // Ensures full visibility of the placeholder
              },
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
