/*****************************************************
 * src/ChatHeader.js
 *
 * Renders the header with the title and control buttons.
 * In popup mode (isPopup=true), the header omits the Dock/Undock,
 * Capture Area (camera), and Close (X) icons – showing only the
 * title, theme toggle, and voice input controls.
 *
 * Updated: Added a voice icon button for mic input.
 * In docked mode, if the container is wide enough the original
 * single-row layout is used; otherwise a condensed version with
 * reduced padding and font sizes is rendered so as not to take up
 * too much vertical space.
 *****************************************************/
import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from '@mui/material';
import { FaTimes, FaCamera, FaMoon, FaSun, FaMicrophone, FaStop } from 'react-icons/fa';

const ChatHeader = ({
  theme,
  isDocked,
  dockedWidth,
  toggleDock,
  toggleTheme,
  handleSnip,
  handleClose,
  handleVoiceToggle,
  isRecording,
  isPopup = false,
}) => {
  // If in popup mode or not docked, use the original single-row layout.
  if (!isDocked || isPopup) {
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
                    sx={{ color: '#fff' }}
                    title="Toggle Dark/Light Mode"
                  >
                    {theme === 'light' ? <FaMoon /> : <FaSun />}
                  </IconButton>
                  <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
                    <FaTimes />
                  </IconButton>
                </>
              )}
              {isPopup && (
                <IconButton
                  onClick={toggleTheme}
                  sx={{ color: '#fff' }}
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
  }

  // In docked mode, decide which layout to use.
  // If the container (dockedWidth) is narrow (<500px), use a condensed layout.
  const isCondensed = dockedWidth && dockedWidth < 500;

  if (isCondensed) {
    // Condensed header: single toolbar, smaller font and icon sizes, reduced padding.
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
            px: 1,
            py: 0.5,
            borderBottom: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Toolbar disableGutters sx={{ minHeight: 40, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                color: '#fff',
                flexGrow: 1,
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              ClickAI
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Button
                variant="outlined"
                onClick={toggleDock}
                sx={{
                  borderColor: '#fff',
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  px: 1,
                }}
              >
                {isDocked ? 'Undock' : 'Dock'}
              </Button>
              <IconButton onClick={handleSnip} sx={{ color: '#fff', p: 0.5 }} title="Capture Area">
                <FaCamera size={16} />
              </IconButton>
              <IconButton onClick={handleVoiceToggle} sx={{ color: '#fff', p: 0.5, position: 'relative' }} title="Voice Input">
                {isRecording ? <FaStop size={16} /> : <FaMicrophone size={16} />}
                {isRecording && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    backgroundColor: 'red',
                    borderRadius: '50%',
                    animation: 'pulse 1s infinite'
                  }}></span>
                )}
              </IconButton>
              <IconButton onClick={toggleTheme} sx={{ color: '#fff', p: 0.5 }} title="Toggle Dark/Light Mode">
                {theme === 'light' ? <FaMoon size={16} /> : <FaSun size={16} />}
              </IconButton>
              <IconButton onClick={handleClose} sx={{ color: '#fff', p: 0.5 }} title="Close Chat">
                <FaTimes size={16} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </>
    );
  } else {
    // Original docked header layout (single row) when there's enough width.
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
            cursor: 'move',
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
                sx={{ color: '#fff' }}
                title="Toggle Dark/Light Mode"
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </IconButton>
              <IconButton onClick={handleClose} sx={{ color: '#fff' }} title="Close Chat">
                <FaTimes />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </>
    );
  }
};

export default ChatHeader;
