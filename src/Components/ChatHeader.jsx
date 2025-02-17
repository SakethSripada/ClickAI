/*****************************************************
 * src/ChatHeader.js
 *
 * Renders the header with the title and control buttons.
 * The controls arrange responsively (2×2 grid on extra‑small screens)
 * and extra top spacing is added when needed.
 *
 * Updated: Added a voice icon button for mic input.
 *****************************************************/
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from '@mui/material';
import { FaTimes, FaCamera, FaMoon, FaSun, FaMicrophone, FaStop } from 'react-icons/fa';

const ChatHeader = ({ theme, isDocked, toggleDock, toggleTheme, handleSnip, handleClose, handleVoiceToggle, isRecording }) => {
  return (
    <>
      {/* Define keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <AppBar
        position="static" 
        className="chat-header-drag-handle"
        sx={{
          background: theme === 'light'
            ? 'linear-gradient(135deg, #7f72f0, #3aa0ff)'
            : 'linear-gradient(135deg, #333, #555)',
          boxShadow: 3,
          cursor: 'move',
          px: 1,
          pt: { xs: 2, sm: 1 },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            transition: 'all 0.3s ease',
          }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ textAlign: 'center', mt: { xs: 1, sm: 0 } }}
          >
            ClickAI
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, auto)' },
              gap: 1,
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <Button
              variant="outlined"
              onClick={toggleDock}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {isDocked ? 'Undock' : 'Dock'}
            </Button>
            <Button
              variant="outlined"
              onClick={toggleTheme}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </Button>
            <IconButton onClick={handleVoiceToggle} sx={{ color: '#fff', position: 'relative' }} title="Voice Input">
              {isRecording ? <FaStop /> : <FaMicrophone />}
              {isRecording && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite'
                }}></span>
              )}
            </IconButton>
            <IconButton onClick={handleSnip} sx={{ color: '#fff' }} title="Capture Area">
              <FaCamera />
            </IconButton>
            <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
              <FaTimes />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default ChatHeader;
