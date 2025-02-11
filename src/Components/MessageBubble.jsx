/*****************************************************
 * src/MessageBubble.js
 *
 * Renders an individual message bubble. It supports
 * both text and code blocks.
 *****************************************************/
import React from 'react';
import { Box, Paper } from '@mui/material';
import { Slide } from '@mui/material';
import { parseMessageToBlocks } from '../utils';
import CodeBlock from './CodeBlock';
import { marked } from 'marked';

const MessageBubble = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const blocks = parseMessageToBlocks(message.text);

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
            maxWidth: '70%',
            px: 2,
            py: 1,
            borderRadius: 12,
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
            userSelect: 'text'
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
        </Paper>
      </Box>
    </Slide>
  );
};

export default MessageBubble;
