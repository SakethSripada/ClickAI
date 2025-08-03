/**
 * ChatHeader Component
 * 
 * The header section of the AI chat interface containing all primary controls
 * and navigation elements. Provides theme switching, window management,
 * voice input controls, and utility functions like screen capture.
 * 
 * Features:
 * - Theme toggle (light/dark mode)
 * - Window docking/undocking controls
 * - Voice input activation
 * - Screen capture (snipping tool) launcher
 * - Close button for window management
 * - Responsive design for different screen sizes
 * 
 * @author Saketh Sripada
 * @version 1.0.0
 */

import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FaTimes, FaCamera, FaMoon, FaSun, FaMicrophone, FaStop } from 'react-icons/fa';

/**
 * ChatHeader Component
 * 
 * Renders the header bar for the AI chat interface with all control buttons
 * and responsive behavior based on screen size and popup mode.
 * 
 * @param {Object} props - Component props
 * @param {string} props.theme - Current theme ('light' or 'dark')
 * @param {boolean} props.isDocked - Whether the chat window is docked
 * @param {Function} props.toggleDock - Function to toggle docking state
 * @param {Function} props.toggleTheme - Function to toggle theme
 * @param {Function} props.handleSnip - Function to launch screen capture
 * @param {Function} props.handleClose - Function to close the chat window
 * @param {Function} props.handleVoiceToggle - Function to toggle voice recording
 * @param {boolean} props.isRecording - Whether voice recording is active
 * @param {boolean} props.isPopup - Whether component is in popup mode
 * @returns {JSX.Element} The rendered ChatHeader component
 */
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
  // Determine if we're on a small screen for responsive behavior
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));

  return (
    <>
      {/* CSS-in-JS styles for drag handle and responsive behavior */}
      <style>{`
        .chat-header-drag-handle {
          cursor: move;
          user-select: none;
          -webkit-user-select: none;
          -webkit-user-drag: none;
        }
        .chat-header-drag-handle:active {
          cursor: grabbing;
        }
        
        /* Responsive button styles */
        @media (max-width: 600px) {
          .header-button-text {
            display: none;
          }
          .header-button {
            min-width: 40px;
            padding: 8px;
          }
        }
      `}</style>

      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
          color: theme === 'dark' ? '#ffffff' : '#333333',
          borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e0e0e0'}`,
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: '48px !important',
            paddingX: 1,
            justifyContent: 'space-between'
          }}
          // Add drag handle class for floating windows (not in popup mode)
          className={!isPopup ? 'chat-header-drag-handle' : ''}
        >
          {/* Left side - Logo and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: isSmallScreen ? '1rem' : '1.1rem',
                color: theme === 'dark' ? '#ffffff' : '#333333',
              }}
            >
              💬 ClickAI
            </Typography>
            
            {/* Status indicator for docked/floating mode */}
            {!isPopup && (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.7,
                  fontSize: '0.75rem',
                  display: isSmallScreen ? 'none' : 'block'
                }}
              >
                {isDocked ? 'Docked' : 'Floating'}
              </Typography>
            )}
          </Box>

          {/* Right side - Control buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            
            {/* Voice input toggle button */}
            <IconButton
              onClick={handleVoiceToggle}
              size="small"
              className="header-button"
              sx={{
                color: isRecording ? '#ff4444' : (theme === 'dark' ? '#ffffff' : '#666666'),
                backgroundColor: isRecording ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: isRecording ? 'rgba(255, 68, 68, 0.2)' : 
                    (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                },
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              }}
              title={isRecording ? 'Stop voice recording' : 'Start voice recording'}
            >
              {isRecording ? <FaStop size={16} /> : <FaMicrophone size={16} />}
            </IconButton>

            {/* Screen capture button */}
            <IconButton
              onClick={handleSnip}
              size="small"
              className="header-button"
              sx={{
                color: theme === 'dark' ? '#ffffff' : '#666666',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              title="Capture screen area"
            >
              <FaCamera size={16} />
            </IconButton>

            {/* Theme toggle button */}
            <IconButton
              onClick={toggleTheme}
              size="small"
              className="header-button"
              sx={{
                color: theme === 'dark' ? '#ffffff' : '#666666',
                '&:hover': {
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <FaSun size={16} /> : <FaMoon size={16} />}
            </IconButton>

            {/* Dock/Undock button - hidden in popup mode */}
            {!isPopup && (
              <Button
                onClick={toggleDock}
                size="small"
                variant="text"
                className="header-button"
                sx={{
                  color: theme === 'dark' ? '#ffffff' : '#666666',
                  minWidth: isSmallScreen ? '40px' : 'auto',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                }}
                title={isDocked ? 'Undock window' : 'Dock to side'}
              >
                <span className="header-button-text">
                  {isDocked ? 'Undock' : 'Dock'}
                </span>
                {isSmallScreen && (isDocked ? '⤡' : '⤢')}
              </Button>
            )}

            {/* Close button */}
            <IconButton
              onClick={handleClose}
              size="small"
              className="header-button"
              sx={{
                color: theme === 'dark' ? '#ffffff' : '#666666',
                '&:hover': {
                  backgroundColor: '#ff4444',
                  color: '#ffffff',
                },
              }}
              title="Close chat"
            >
              <FaTimes size={14} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Add CSS animation for recording pulse effect */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ChatHeader;
