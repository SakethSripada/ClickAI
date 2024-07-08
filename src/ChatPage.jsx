import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { FaCopy, FaRedo, FaCircle, FaRegCircle } from 'react-icons/fa';
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
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2e2e2e',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
      },
    },
  },
});

const CustomContainer = styled(Container)`
  * {
    scrollbar-width: thin;
    scrollbar-color: #4e4e4e #2e2e2e;
  }
  *::-webkit-scrollbar {
    width: 8px;
  }
  *::-webkit-scrollbar-track {
    background: #2e2e2e;
  }
  *::-webkit-scrollbar-thumb {
    background-color: #4e4e4e;
    border-radius: 10px;
    border: 3px solid #2e2e2e;
  }
`;

const CustomTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    display: flex;
    align-items: flex-start;
    padding: 0;
    height: auto;
    max-height: 150px;
    overflow-y: auto;
    box-sizing: border-box;
    transition: max-height 0.2s, min-height 0.2s;
    min-height: 45px;
  }
  & .MuiOutlinedInput-input {
    padding: 10px;
    height: auto;
    overflow-y: auto;
    box-sizing: border-box;
  }
  & .MuiOutlinedInput-multiline {
    padding: 0;
  }
  & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #a024b4;
  }
  & .MuiOutlinedInput-root::-webkit-scrollbar {
    width: 8px;
  }
  & .MuiOutlinedInput-root::-webkit-scrollbar-track {
    background: #2e2e2e;
  }
  & .MuiOutlinedInput-root::-webkit-scrollbar-thumb {
    background-color: #4e4e4e;
    border-radius: 10px;
    border: 3px solid #2e2e2e;
  }
`;

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

      const aiMessage = { sender: 'assistant', text: response.data.response, isContinued: response.data.isContinued };
      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { sender: 'system', text: 'Error generating response from AI.' };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleContinueGeneration = async () => {
    const lastMessageIndex = messages.length - 1;
    if (lastMessageIndex < 0) return;

    const lastMessage = messages[lastMessageIndex];
    const newMessages = [...messages];

    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5010/generate', {
        conversationHistory: messages
      });

      const aiMessage = { sender: 'assistant', text: lastMessage.text + response.data.response, isContinued: response.data.isContinued };
      newMessages[lastMessageIndex] = aiMessage;
      setMessages(newMessages);
    } catch (error) {
      console.error('Error continuing generation:', error);
      const errorMessage = { sender: 'system', text: 'Error continuing response from AI.' };
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
    const parts = text.split(/(```[\s\S]*?```|```[\s\S]*?$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
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
      } else if (part.match(/^-\s.*/)) {
        const listItems = part.split('\n').map((item, i) => (
          <ListItem key={i} sx={{ color: '#fff', paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px' }}>
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <FaRegCircle style={{ color: '#007bff' }} />
            </ListItemIcon>
            <ListItemText primary={item.replace(/^- /, '')} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
        );
      } else if (part.match(/^\d+\.\s.*/)) {
        const listItems = part.split('\n').map((item, i) => (
          <ListItem key={i} sx={{ color: '#fff', paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px' }}>
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <Typography variant="body2" color="textSecondary">{item.match(/^\d+/)[0]}</Typography>
            </ListItemIcon>
            <ListItemText primary={item.replace(/^\d+\.\s/, '')} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
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
      <CustomContainer maxWidth="sm" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px', backgroundColor: theme.palette.background.default }}>
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
                {msg.sender === 'assistant' && msg.isContinued && (
                  <Button
                    onClick={handleContinueGeneration}
                    startIcon={<FaRedo />}
                    sx={{ mt: 1, color: '#007bff' }}
                  >
                    Continue generation
                  </Button>
                )}
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
          <CustomTextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            variant="outlined"
            fullWidth
            multiline
            onKeyDown={handleKeyPress}
            sx={{ mr: 1, flex: 1, backgroundColor: '#2e2e2e', borderRadius: '4px' }}
            InputProps={{
              style: {
                height: 'auto',
                maxHeight: '150px',
                minHeight: '45px',
                overflowY: 'auto'
              }
            }}
          />
          <Button type="submit" variant="contained" color="primary" onClick={handleSendMessage} sx={{ height: '45px', width: '70px' }}>
            Send
          </Button>
        </Box>
      </CustomContainer>
    </ThemeProvider>
  );
}

export default ChatPage;
