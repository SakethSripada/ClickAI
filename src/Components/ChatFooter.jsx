/*****************************************************
 * src/ChatFooter.js
 *
 * Renders the footer with a text input for the user
 * and a send button.
 *****************************************************/
import React from 'react';
import { Box, TextField, Button } from '@mui/material';

const ChatFooter = ({ userInput, setUserInput, handleSendMessage, theme }) => {
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
        placeholder="Ask a question..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
        onClick={handleSendMessage}
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
