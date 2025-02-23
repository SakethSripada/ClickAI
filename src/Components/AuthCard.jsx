import React from 'react';
import { Card, CardContent, Typography, Button, Box, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e, #3949ab)',
  borderRadius: 16,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  padding: theme.spacing(3),
  color: '#fff',
  maxWidth: 400,
  margin: 'auto',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(1, 3),
  marginTop: theme.spacing(2),
  backgroundColor: '#ff4081',
  color: '#fff',
  fontWeight: 'bold',
  transition: 'background-color 0.3s ease',
  '&:hover': {
    backgroundColor: '#f50057',
  },
}));

const AuthCard = ({ userInfo, loading, error, signIn, signOut }) => {
  return (
    <StyledCard>
      <CardContent>
        <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Montserrat, sans-serif' }}>
          ClickAI Authentication
        </Typography>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress color="inherit" />
          </Box>
        )}
        {error && (
          <Typography variant="body1" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {userInfo ? (
          <>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Signed in as:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {userInfo.email}
            </Typography>
            <StyledButton variant="contained" onClick={signOut}>
              Sign Out
            </StyledButton>
          </>
        ) : (
          <StyledButton variant="contained" onClick={signIn}>
            Sign In / Sign Up
          </StyledButton>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default AuthCard;
