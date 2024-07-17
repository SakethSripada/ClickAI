import React from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton } from '@mui/material';
import { FaRegCircle, FaCopy } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js';

const AIResponseAlert = ({ message }) => {
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
    },
    alertBox: {
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#fff',
      border: '2px solid #000',
      padding: '20px',
      zIndex: 10000,
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
      borderRadius: '10px',
      maxWidth: '80%',
      maxHeight: '60%',
      overflowY: 'auto',
      overflowX: 'hidden',
      textAlign: 'center',
      color: '#000',
      fontSize: '16px',
    },
    message: {
      margin: '0 0 10px',
      fontSize: '16px',
      color: '#000',
    },
    button: {
      padding: '10px 20px',
      fontSize: '14px',
      border: 'none',
      backgroundColor: '#007BFF',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: '5px',
      marginTop: '10px',
      margin: '5px',
    },
    buttonHover: {
      backgroundColor: '#0056b3',
    },
  };

  const handleClose = (e) => {
    e.stopPropagation();
    const existingAlert = document.querySelector('#react-root');
    if (existingAlert) {
      setTimeout(() => {
        const root = createRoot(existingAlert);
        root.unmount();
        document.body.removeChild(existingAlert);
      }, 100);
    }
  };

  const handleOpenInChat = (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({ type: 'openChat', message: message });
    handleClose(e);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard');
  };

  const detectCodeBlocks = (text) => {
    const detectedBlocks = [];
    const regex = /(```[\s\S]*?```|```[\s\S]*?$)/g;
    const parts = text.split(regex);
    if (parts.length > 1) {
      return parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*)\n```/);
          const language = match ? match[1] : 'text';
          const codeContent = match ? match[2].trim() : part.replace(/```/g, '').trim();
          return { type: 'code', content: codeContent, language };
        } else {
          return { type: 'text', content: part };
        }
      });
    }

    const lines = text.split('\n');
    let buffer = '';
    let isCode = false;

    lines.forEach((line, index) => {
      const detection = hljs.highlightAuto(line);
      if (detection.language) {
        if (!isCode) {
          if (buffer) {
            detectedBlocks.push({ type: 'text', content: buffer });
            buffer = '';
          }
          isCode = true;
        }
        buffer += line + '\n';
      } else {
        if (isCode) {
          if (buffer) {
            detectedBlocks.push({ type: 'code', content: buffer.trim(), language: detection.language });
            buffer = '';
          }
          isCode = false;
        }
        buffer += line + '\n';
      }

      if (index === lines.length - 1 && buffer) {
        detectedBlocks.push({ type: isCode ? 'code' : 'text', content: buffer.trim(), language: isCode ? detection.language : 'text' });
      }
    });

    return detectedBlocks;
  };

  const renderMessageContent = (text) => {
    const parts = detectCodeBlocks(text);

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <Box key={index} sx={{ position: 'relative', mb: 2 }}>
            <SyntaxHighlighter language={part.language} style={oneDark}>
              {part.content}
            </SyntaxHighlighter>
            <IconButton
              onClick={() => handleCopy(part.content)}
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
      } else if (part.content.match(/^-\s.*/)) {
        const listItems = part.content.split('\n').map((item, i) => (
          <ListItem key={i} sx={{ color: '#000', paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px' }}>
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <FaRegCircle style={{ color: '#007bff' }} />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: '16px' }}>{item.replace(/^- /, '')}</Typography>} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
        );
      } else if (part.content.match(/^\d+\.\s.*/)) {
        const listItems = part.content.split('\n').map((item, i) => (
          <ListItem key={i} sx={{ color: '#000', paddingLeft: '0px', paddingTop: '0px', paddingBottom: '0px' }}>
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '16px' }}>{item.match(/^\d+/)[0]}</Typography>
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontSize: '16px' }}>{item.replace(/^\d+\.\s/, '')}</Typography>} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
        );
      } else {
        const paragraphs = part.content.split('\n').map((line, i) => (
          <Typography key={i} sx={{ color: '#000', display: 'block', marginBottom: '4px', fontSize: '16px' }}>
            {line}
          </Typography>
        ));
        return <Box key={index} sx={{ mb: 2 }}>{paragraphs}</Box>;
      }
    });
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <Box style={styles.message}>{renderMessageContent(message)}</Box>
        <button
          style={styles.button}
          onClick={handleClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
        >
          Close
        </button>
        <button
          style={styles.button}
          onClick={handleOpenInChat}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = styles.button.backgroundColor)}
        >
          Open In Chat
        </button>
      </div>
    </div>
  );
};

export default AIResponseAlert;
