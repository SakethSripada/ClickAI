/*****************************************************
 * src/MessageBubble.js
 *
 * Renders an individual message bubble with enhanced styling.
 * Supports both text and code blocks.
 *****************************************************/
import React from 'react';
import { Box, Paper } from '@mui/material';
import { Slide } from '@mui/material';
import { parseMessageToBlocks } from './utils';
import CodeBlock from './CodeBlock';
import { marked } from 'marked';

const MessageBubble = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const blocks = parseMessageToBlocks(message.text);

  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={250}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 1.5,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            maxWidth: '75%',
            px: 2.5,
            py: 0.75,
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isUser
              ? theme === 'light'
                ? 'linear-gradient(135deg, #daf5df, #c3e6cb)'
                : 'linear-gradient(135deg, #295f3a, #214d2d)'
              : theme === 'light'
              ? 'linear-gradient(135deg, #d9ebff, #b6daff)'
              : 'linear-gradient(135deg, #2b4358, #1f3447)',
            color: theme === 'light' ? '#222' : '#f0f0f0',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)',
            wordBreak: 'break-word',
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
                  sx={{ mt: i === 0 ? 0 : 0.75 }}
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
