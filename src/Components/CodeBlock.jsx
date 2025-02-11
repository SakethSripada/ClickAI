/*****************************************************
 * src/CodeBlock.js
 *
 * Renders a code block using react-syntax-highlighter.
 *****************************************************/
import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaCopy } from 'react-icons/fa';
import { getLanguageFromFence, getCodeContent } from '../utils';

const CodeBlock = ({ content, theme, onCopy }) => {
  const lang = getLanguageFromFence(content);
  const pureCode = getCodeContent(content);

  return (
    <Box
      sx={{
        position: 'relative',
        my: 1,
        backgroundColor: '#2e3440',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <IconButton
        onClick={() => onCopy(pureCode)}
        size="small"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          bgcolor: theme === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          '&:hover': {
            bgcolor: theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          },
        }}
      >
        <FaCopy style={{ fontSize: '0.9rem', color: '#fff' }} />
      </IconButton>
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#2e3440',
          borderRadius: 4,
        }}
      >
        {pureCode}
      </SyntaxHighlighter>
    </Box>
  );
};

export default CodeBlock;
