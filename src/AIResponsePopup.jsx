import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, Box } from '@mui/material';
import { FaCopy } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AIResponsePopup = ({ open, handleClose, aiResponse }) => {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard');
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>AI Response</DialogTitle>
      <DialogContent dividers>
        {renderMessageContent(aiResponse)}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIResponsePopup;
