/*****************************************************
 * src/ChatHeader.js
 *
 * Renders the header with the title and control buttons.
 * In popup mode (isPopup=true), the header omits the Dock/Undock,
 * Capture Area (camera), and Close (X) icons – showing only the
 * title, theme toggle, and voice input controls.
 *
 * Updated: Added a voice icon button for mic input.
 *****************************************************/
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from '@mui/material';
import { FaTimes, FaCamera, FaMoon, FaSun, FaMicrophone, FaStop } from 'react-icons/fa';

const ChatHeader = ({
  theme,
  isDocked,
  toggleDock,
  toggleTheme,
  handleSnip,
  handleClose,
  handleVoiceToggle,
  isRecording,
  isPopup = false,
}) => {
  return (
    <>
      {/* Keyframes for pulse animation */}
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
            ? 'linear-gradient(135deg, #4e54c8, #8f94fb)'
            : 'linear-gradient(135deg, #222, #444)',
          boxShadow: 4,
          cursor: isPopup ? 'default' : 'move',
          px: 2,
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#fff',
              textTransform: 'none',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: '1.5rem',
            }}
          >
            ClickAI
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {/* In non-popup mode, render Dock, Capture, Voice controls, then dark mode toggle, and finally the Close button */}
            {!isPopup && (
              <>
                <Button
                  variant="outlined"
                  onClick={toggleDock}
                  sx={{
                    borderColor: '#fff',
                    color: '#fff',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  {isDocked ? 'Undock' : 'Dock'}
                </Button>
                <IconButton onClick={handleSnip} sx={{ color: '#fff' }} title="Capture Area">
                  <FaCamera />
                </IconButton>
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
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    color: '#fff',
                  }}
                  title="Toggle Dark/Light Mode"
                >
                  {theme === 'light' ? <FaMoon /> : <FaSun />}
                </IconButton>
                <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
                  <FaTimes />
                </IconButton>
              </>
            )}
            {/* In popup mode, only render the dark mode toggle as an icon */}
            {isPopup && (
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: '#fff',
                }}
                title="Toggle Dark/Light Mode"
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default ChatHeader;
