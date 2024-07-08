import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import { FaCopy } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#a024b4',
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
});

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5010/generate', {
        conversationHistory: newMessages
      });

      const aiMessage = { sender: 'assistant', text: response.data.response };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { sender: 'system', text: 'Error generating response from AI.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (text) => {
    const parts = text.split(/(```\w*\n[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.replace(/```(\w*)\n|```/g, '').trim();
        return (
          <Box key={index} sx={{ position: 'relative' }}>
            <SyntaxHighlighter language="javascript" style={oneDark}>
              {codeContent}
            </SyntaxHighlighter>
            <IconButton
              onClick={() => handleCopy(codeContent)}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#3e3e3e',
                '&:hover': {
                  backgroundColor: '#4e4e4e',
                },
              }}
            >
              <FaCopy style={{ color: '#007bff' }} />
            </IconButton>
          </Box>
        );
      } else {
        return (
          <Typography key={index} sx={{ color: '#fff' }}>
            {part}
          </Typography>
        );
      }
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', backgroundColor: theme.palette.background.default }}>
        <Paper sx={{ flex: 1, padding: '10px', overflowY: 'auto', backgroundColor: theme.palette.background.default }}>
          <Box>
            {messages.map((msg, index) => (
              <Box key={index} sx={{ mb: 2, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                <Paper
                  sx={{
                    py: 1,
                    px: 2,
                    display: 'inline-block',
                    backgroundColor: msg.sender === 'user' ? '#4e4e4e' : '#3e3e3e',
                    position: 'relative',
                    maxWidth: '75%',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderMessageContent(msg.text)}
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ textAlign: 'left', display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  AI is typing...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center', padding: '5px', backgroundColor: '#1e1e1e' }}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            variant="outlined"
            fullWidth
            multiline
            onKeyDown={handleKeyPress}
            sx={{ mr: 1, flex: 1, backgroundColor: '#2e2e2e', borderRadius: '4px', height: '45px' }}
            InputProps={{
              style: {
                height: '45px'
              }
            }}
          />
          <Button type="submit" variant="contained" color="primary" onClick={handleSendMessage} sx={{ height: '45px', width: '70px' }}>
            Send
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default ChatPage;
