import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton } from '@mui/material';
import { FaRegCircle, FaCopy } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { marked } from 'marked';

const AIResponseAlert = ({ message }) => {
  const [containsMath, setContainsMath] = useState(false);
  const iframeRef = useRef(null);

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
      border: '2px solid #ccc',
      padding: '20px',
      zIndex: 10000,
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.3)',
      borderRadius: '10px',
      maxWidth: '80%',
      maxHeight: '60%',
      overflowY: 'auto',
      overflowX: 'hidden',
      textAlign: 'left',
      color: '#000',
      fontSize: '16px',
    },
    message: {
      margin: '0 0 10px',
      fontSize: '16px',
      color: '#000',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '10px',
    },
    button: {
      padding: '10px 20px',
      fontSize: '14px',
      border: 'none',
      backgroundColor: '#007BFF',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: '5px',
      margin: '5px',
    },
    buttonHover: {
      backgroundColor: '#0056b3',
    },
    listItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '5px 0',
    },
    listItemIcon: {
      minWidth: '25px',
      color: '#007bff',
    },
    listItemText: {
      fontSize: '16px',
    },
    number: {
      fontWeight: 'bold',
      marginRight: '5px',
    },
    iframe: {
      width: '100%',
      height: '300px',
      border: 'none',
    },
  };

  useEffect(() => {
    const mathRegex = /(\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|\\begin\{.*?\}.*?\\end\{.*?\})/g;
    setContainsMath(mathRegex.test(message));
  }, [message]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (containsMath && iframe && iframe.contentWindow) {
      iframe.onload = () => {
        iframe.contentWindow.postMessage(
          { type: 'render-math', content: renderMessageContentForMathJax(message) },
          '*'
        );
      };
    }
  }, [containsMath, message]);

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

  const renderMessageContent = (text) => {
    const parts = text.split(/(```[\s\S]*?```|```[\s\S]*?$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeContent = part.replace(/```(\w*)\n|```/g, '').trim();
        return (
          <Box key={index} sx={{ position: 'relative', mb: 2 }}>
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
        const listItems = part.split('\n').filter(item => item.trim()).map((item, i) => (
          <ListItem key={i} sx={styles.listItem}>
            <ListItemIcon sx={styles.listItemIcon}>
              <FaRegCircle />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={styles.listItemText}>{item.replace(/^- /, '')}</Typography>} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
        );
      } else if (part.match(/^\d+\.\s.*/)) {
        const listItems = part.split('\n').filter(item => item.trim()).map((item, i) => (
          <ListItem key={i} sx={styles.listItem}>
            <Typography sx={styles.number}>{item.match(/^\d+/)[0]}.</Typography>
            <ListItemText primary={<Typography sx={styles.listItemText}>{item.replace(/^\d+\.\s/, '')}</Typography>} />
          </ListItem>
        ));
        return (
          <List key={index} sx={{ padding: 0 }}>
            {listItems}
          </List>
        );
      } else {
        const rawMarkup = marked(part);
        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: rawMarkup }} />
        );
      }
    });
  };

  const renderMessageContentForMathJax = (text) => {
    const parts = text.split(/(```[\s\S]*?```|```[\s\S]*?$)/g);

    return parts.map((part) => {
      if (part.startsWith('```')) {
        return `<pre><code>${part.replace(/```(\w*)\n|```/g, '').trim()}</code></pre>`;
      } else if (part.match(/^-\s.*/)) {
        const listItems = part.split('\n').filter(item => item.trim()).map((item) => `<li>${item.replace(/^- /, '')}</li>`).join('');
        return `<ul>${listItems}</ul>`;
      } else if (part.match(/^\d+\.\s.*/)) {
        const listItems = part.split('\n').filter(item => item.trim()).map((item) => `<li>${item.replace(/^\d+\.\s/, '')}</li>`).join('');
        return `<ol>${listItems}</ol>`;
      } else {
        const escapedText = part.replace(/\\\((.*?)\\\)/g, '\\($1\\)').replace(/\\\[(.*?)\\\]/g, '\\[$1\\]');
        return `<p>${escapedText}</p>`;
      }
    }).join('');
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.alertBox} onClick={(e) => e.stopPropagation()}>
        <Box style={styles.message}>
          {containsMath ? (
            <iframe
              ref={iframeRef}
              title="MathJax Sandbox"
              src={chrome.runtime.getURL('sandbox.html')}
              style={styles.iframe}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            renderMessageContent(message)
          )}
        </Box>
        <div style={styles.buttonContainer}>
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
    </div>
  );
};

export default AIResponseAlert;
