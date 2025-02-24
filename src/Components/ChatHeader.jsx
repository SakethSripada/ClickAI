/*****************************************************
 * src/ChatHeader.js
 *
 * Renders the header with the title and control buttons.
 * In popup mode (isPopup=true), the header shows only the
 * title, theme toggle, and voice input controls.
 *
 * This version maintains professional proportions. It adds
 * extra spacing between the header title and the icon group
 * and ensures that icons remain visible on narrow screens by
 * enabling horizontal scrolling if necessary.
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
          px: 2,
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          minHeight: '64px', // maintain a fixed vertical height
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            // Allow horizontal scrolling if there isn’t enough space
            overflowX: 'auto',
            whiteSpace: 'nowrap',
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
              flexShrink: 0,
              mr: 2, // extra margin to separate from icons
            }}
          >
            ClickAI
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
            }}
          >
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
                    minWidth: '80px',
                  }}
                >
                  {isDocked ? 'Undock' : 'Dock'}
                </Button>
                <IconButton onClick={handleSnip} sx={{ color: '#fff' }} title="Capture Area">
                  <FaCamera size={20} />
                </IconButton>
                <IconButton onClick={handleVoiceToggle} sx={{ color: '#fff', position: 'relative' }} title="Voice Input">
                  {isRecording ? <FaStop size={20} /> : <FaMicrophone size={20} />}
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
                <IconButton onClick={toggleTheme} sx={{ color: '#fff' }} title="Toggle Dark/Light Mode">
                  {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
                </IconButton>
                <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
                  <FaTimes size={20} />
                </IconButton>
              </>
            )}
            {isPopup && (
              <IconButton onClick={toggleTheme} sx={{ color: '#fff' }} title="Toggle Dark/Light Mode">
                {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default ChatHeader;
