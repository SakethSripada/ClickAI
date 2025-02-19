// src/MessageBubble.js
import React from 'react';
import { Box, Paper, IconButton } from '@mui/material';
import { Slide } from '@mui/material';
import { parseMessageToBlocks } from '../utils';
import CodeBlock from './CodeBlock';
import { marked } from 'marked';
import { renderCustomMath } from '../utils';
import { FaVolumeUp } from 'react-icons/fa';

const MessageBubble = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const blocks = parseMessageToBlocks(message.text);

  // Render each block. For assistant messages, use our custom math renderer.
  const renderedBlocks = blocks.map((block, i) => {
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
      if (!isUser) {
        return (
          <React.Fragment key={i}>
            {renderCustomMath(block.content)}
          </React.Fragment>
        );
      } else {
        const html = marked.parse(block.content || '');
        const stripped = html.replace(/^<p>/, '').replace(/<\/p>$/, '');
        return (
          <Box
            key={i}
            sx={{ mt: i === 0 ? 0 : 0.5 }}
            dangerouslySetInnerHTML={{ __html: stripped }}
          />
        );
      }
    }
  });

  const bubbleBorderRadius = isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px';

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
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
          {renderedBlocks}
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
