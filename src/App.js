import React, { useState, useEffect } from 'react';
import { Box, Fade } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AuthCard from './Components/AuthCard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4081',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
  },
});

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to initiate the OAuth flow with account selector
  const initiateAuthFlow = () => {
    const clientId = '192655607759-oumqfd1t3d7qm4tvqc5j5shld5elfb1f';
    const scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    const redirectUri = chrome.identity.getRedirectURL();
    // Build the OAuth URL with prompt=select_account
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}` +
                    `&response_type=token` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&scope=${encodeURIComponent(scopes)}` +
                    `&prompt=select_account`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        setError(chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Authentication failed.');
        setLoading(false);
        return;
      }
      // Extract the token from the response URL
      const tokenMatch = responseUrl.match(/access_token=([^&]+)/);
      const token = tokenMatch && tokenMatch[1];
      if (token) {
        console.log("Got token:", token);
        // Fetch user info from Google
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(response => response.json())
          .then(data => {
            setUserInfo(data);
            chrome.storage.local.set({ authToken: token, isLoggedIn: true, user: data }, () => {
              console.log('User info stored');
            });
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching user info:', err);
            setError('Error fetching user info.');
            setLoading(false);
          });
      } else {
        setError('Token extraction failed.');
        setLoading(false);
      }
    });
  };

  // Sign in function that first removes any cached token before starting a fresh auth flow
  const signIn = () => {
    setError('');
    setLoading(true);
    chrome.identity.getAuthToken({ interactive: false }, (cachedToken) => {
      if (cachedToken) {
        // Remove the cached token to force account selection
        chrome.identity.removeCachedAuthToken({ token: cachedToken }, () => {
          initiateAuthFlow();
        });
      } else {
        initiateAuthFlow();
      }
    });
  };

  // Sign out by revoking the token and clearing the local storage
  const signOut = () => {
    setLoading(true);
    chrome.storage.local.get(['authToken'], (result) => {
      const token = result.authToken;
      if (token) {
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .finally(() => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
              chrome.storage.local.remove(['authToken', 'isLoggedIn', 'user'], () => {
                setUserInfo(null);
                setLoading(false);
                console.log('Token revoked and user signed out.');
              });
            });
          });
      } else {
        setLoading(false);
      }
    });
  };

  // On mount, check for existing login state
  useEffect(() => {
    chrome.storage.local.get(['isLoggedIn', 'user'], (result) => {
      if (result.isLoggedIn && result.user) {
        setUserInfo(result.user);
      }
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        bgcolor={theme.palette.background.default}
      >
        <Fade in={true} timeout={1000}>
          <div>
            <AuthCard
              userInfo={userInfo}
              loading={loading}
              error={error}
              signIn={signIn}
              signOut={signOut}
            />
          </div>
        </Fade>
      </Box>
    </ThemeProvider>
  );
}

export default App;
