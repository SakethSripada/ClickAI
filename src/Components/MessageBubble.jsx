/*****************************************************
 * src/MessageBubble.js
 *
 * Renders an individual message bubble. It supports
 * both text and code blocks.
 *****************************************************/
import React from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { Slide } from '@mui/material';
import { parseMessageToBlocks } from '../utils';
import CodeBlock from './CodeBlock';
import { marked } from 'marked';
import { FaVolumeUp } from 'react-icons/fa';

const MessageBubble = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const blocks = parseMessageToBlocks(message.text);

  // Define different border radii for user vs. assistant messages to simulate a chat bubble tail.
  // For user messages (right-aligned): make the bottom-right corner less rounded.
  // For assistant messages (left-aligned): make the bottom-left corner less rounded.
  const bubbleBorderRadius = isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px';

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    // If something is already being spoken, cancel it.
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(message.text);
      // Optional: adjust voice, rate, or pitch as needed.
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
            py: 1,
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
              const html = marked.parse(block.content || '');
              return (
                <Box
                  key={i}
                  sx={{ mt: i === 0 ? 0 : 0.5 }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
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
