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

// Create a custom style object that merges oneDark but overrides token backgrounds.
const customOneDark = {
  ...oneDark,

  // Force the overall <pre> background to #2e3440.
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#2e3440 !important',
  },
  // Force the <code> background to be transparent so we don't stack extra highlights.
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent !important',
  },

  // Ensure that any nested tokens also have a transparent background.
  'hljs *': {
    background: 'transparent !important',
  },
};

const CodeBlock = ({ content, theme, onCopy }) => {
  const lang = getLanguageFromFence(content);
  const pureCode = getCodeContent(content);

  return (
    <Box
      sx={{
        position: 'relative',
        my: 1,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#2e3440', // Keep the block's overall dark background
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
        style={customOneDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          borderRadius: 4,
          backgroundColor: 'transparent', // We rely on the <pre> style for the overall bg
        }}
      >
        {pureCode}
      </SyntaxHighlighter>
    </Box>
  );
};

export default CodeBlock;
