import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
} from '@mui/material';
import ChatInterface from './components/ChatInterface';
import SessionManager from './components/SessionManager';

// Create a custom theme with beautiful gradients and modern styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [userId] = useState('user123');
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const handleSessionCreated = (sessionId) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        flexGrow: 1, 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 0
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            ADK Chat Interface
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
            User: {userId}
          </Typography>
        </Paper>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ flex: 1, pb: 2, height: 'calc(100vh - 120px)' }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Left Panel - Sessions */}
            <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper sx={{ height: '100%', overflow: 'hidden', boxShadow: 3 }}>
                <SessionManager
                  userId={userId}
                  onSessionSelect={setSelectedSessionId}
                  selectedSessionId={selectedSessionId}
                />
              </Paper>
            </Grid>

            {/* Right Panel - Chat */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ height: '100%', overflow: 'hidden', boxShadow: 3 }}>
                <ChatInterface
                  userId={userId}
                  sessionId={selectedSessionId}
                  onSessionCreated={handleSessionCreated}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Footer */}
        {/* <Box sx={{ 
          p: 2, 
          textAlign: 'center', 
          backgroundColor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Typography variant="body2" color="text.secondary">
            ADK Chat Interface - Connected to backend on port 3000
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            AI-powered conversation platform with session management
          </Typography>
        </Box> */}
      </Box>
    </ThemeProvider>
  );
}

export default App;
