/*****************************************************
 * src/ChatHeader.js
 *
 * Renders the header with the title and control buttons.
 * In popup mode (isPopup=true), the header shows only the
 * title, theme toggle, and voice input controls.
 *
 * This version has been updated for improved responsiveness.
 * It adapts padding, font sizes, icon sizes, and layout based
 * on screen size to avoid cutoffs and maintain a clean look.
 * Also, the vertical height is reduced on very small screens.
 *****************************************************/
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const muiTheme = useTheme();
  // Consider screens smaller than 'sm' as small screens
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));

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
          px: { xs: 1, sm: 2 },
          py: { xs: 0.5, sm: 1 },
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          minHeight: { xs: '48px', sm: '64px' },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' }, // force row layout on all sizes
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
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
              fontSize: { xs: '1.1rem', sm: '1.5rem' },
              mr: { xs: 1, sm: 2 },
            }}
          >
            ClickAI
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 1, md: 1.5 },
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
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                    minWidth: { xs: '50px', sm: '80px' },
                    padding: { xs: '2px 6px', sm: '6px 12px' },
                  }}
                >
                  {isDocked ? 'Undock' : 'Dock'}
                </Button>
                <IconButton onClick={handleSnip} sx={{ color: '#fff' }} title="Capture Area">
                  <FaCamera size={isSmallScreen ? 16 : 20} />
                </IconButton>
                <IconButton onClick={handleVoiceToggle} sx={{ color: '#fff', position: 'relative' }} title="Voice Input">
                  {isRecording
                    ? <FaStop size={isSmallScreen ? 16 : 20} />
                    : <FaMicrophone size={isSmallScreen ? 16 : 20} />
                  }
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
                  {theme === 'light'
                    ? <FaMoon size={isSmallScreen ? 16 : 20} />
                    : <FaSun size={isSmallScreen ? 16 : 20} />
                  }
                </IconButton>
                <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
                  <FaTimes size={isSmallScreen ? 16 : 20} />
                </IconButton>
              </>
            )}
            {isPopup && (
              <IconButton onClick={toggleTheme} sx={{ color: '#fff' }} title="Toggle Dark/Light Mode">
                {theme === 'light'
                  ? <FaMoon size={isSmallScreen ? 16 : 20} />
                  : <FaSun size={isSmallScreen ? 16 : 20} />
                }
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default ChatHeader;
