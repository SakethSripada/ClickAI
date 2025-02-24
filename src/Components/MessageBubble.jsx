/*****************************************************
 * src/MessageBubble.js
 *
 * Renders an individual message bubble. It supports
 * both text and code blocks.
 *****************************************************/
import React from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { Slide } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { parseMessageToBlocks } from '../utils';
import CodeBlock from './CodeBlock';
import { FaVolumeUp } from 'react-icons/fa';

const MessageBubble = ({ message, theme, isPopup }) => {
  const isUser = message.sender === 'user';
  const blocks = parseMessageToBlocks(message.text);

  // Define different border radii for user vs. assistant messages.
  const bubbleBorderRadius = isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px';

  // Define conditional text style based on popup mode.
  const textStyle = {
    fontSize: isPopup ? '1rem' : '1rem', // adjust font size if needed
    lineHeight: 1.5,
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    // Cancel any ongoing speech before speaking new text.
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(message.text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={300}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            maxWidth: '70%',
            px: 2,
            py: isPopup ? 0.5 : 1, // slightly less vertical padding in popup mode
            borderRadius: bubbleBorderRadius,
            backgroundColor: isUser
              ? theme === 'light'
                ? '#e0f7e9'
                : '#356c42'
              : theme === 'light'
              ? '#e7f4ff'
              : '#3a5363',
            color: theme === 'light' ? '#333' : '#eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            wordBreak: 'break-word',
            userSelect: 'text',
            ...textStyle, // Apply the conditional text style to the paper container
          }}
        >
          {blocks.map((block, i) => {
            if (block.type === 'code') {
              return (
                <CodeBlock
                  key={i}
                  content={block.content}
                  theme={theme}
                  onCopy={(code) => {
                    navigator.clipboard.writeText(code).then(() => {
                      alert('Code copied to clipboard!');
                    });
                  }}
                />
              );
            } else {
              // Wrap each text block with the text style.
              return (
                <Box key={i} sx={{ mt: i === 0 ? 0 : 0.5, ...textStyle }}>
                  <ReactMarkdown>{block.content || ''}</ReactMarkdown>
                </Box>
              );
            }
          })}
          {message.sender === 'assistant' && (
            <IconButton
              onClick={handleSpeak}
              size="small"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                color: theme === 'light' ? '#333' : '#eee',
              }}
              title="Toggle read aloud"
            >
              <FaVolumeUp />
            </IconButton>
          )}
        </Paper>
      </Box>
    </Slide>
  );
};

export default MessageBubble;
