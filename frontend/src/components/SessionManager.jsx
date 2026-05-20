import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import apiService from '../services/api';

const SessionManager = ({ userId, onSessionSelect, selectedSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    userId: '',
    initialState: '',
  });

  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSessions = await apiService.getUserSessions(userId);
      setSessions(userSessions);
    } catch (error) {
      setError('Failed to load sessions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      let initialState = {};
      if (newSessionData.initialState.trim()) {
        try {
          initialState = JSON.parse(newSessionData.initialState);
        } catch {
          throw new Error('Invalid JSON in initial state');
        }
      }

      const session = await apiService.createSession(
        newSessionData.userId || userId,
        initialState
      );

      setSessions(prev => [session, ...prev]);
      setCreateDialogOpen(false);
      setNewSessionData({ userId: '', initialState: '' });
      
      // Auto-select the new session
      if (onSessionSelect) {
        onSessionSelect(session.sessionId);
      }
    } catch (error) {
      setError('Failed to create session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
      
      // If the deleted session was selected, clear selection
      if (selectedSessionId === sessionId && onSessionSelect) {
        onSessionSelect(null);
      }
    } catch (error) {
      setError('Failed to delete session: ' + error.message);
    }
  };

  const formatDate = (dateInput) => {
    let date;
    
    // Handle Firestore timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput._seconds) {
      date = new Date(dateInput._seconds * 1000);
    } else if (dateInput) {
      date = new Date(dateInput);
    } else {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ' at ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getSessionStatus = (session) => {
    if (!session.isActive) return { label: 'Deleted', color: 'error' };
    
    let lastActivity;
    // Handle Firestore timestamp objects
    if (session.updatedAt && typeof session.updatedAt === 'object' && session.updatedAt._seconds) {
      lastActivity = new Date(session.updatedAt._seconds * 1000);
    } else {
      lastActivity = new Date(session.updatedAt);
    }
    
    const now = new Date();
    const diffHours = (now - lastActivity) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { label: 'Active', color: 'success' };
    if (diffHours < 24) return { label: 'Recent', color: 'warning' };
    return { label: 'Old', color: 'default' };
  };

  const getSessionTitle = (session) => {
    const shortId = session.sessionId.slice(0, 8);
    const status = getSessionStatus(session);
    
    if (status.label === 'Active') {
      return `Active Session (${shortId}...)`;
    }
    return `Session ${shortId}...`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <ChatIcon sx={{ color: 'white' }} />
        <Typography variant="h6" sx={{ color: 'white' }}>Sessions</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh sessions">
          <IconButton 
            onClick={loadSessions} 
            disabled={loading}
            sx={{ color: 'white' }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={loading}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
            }
          }}
        >
          New Session
        </Button>
      </Paper>

      {/* Sessions List */}
      <Paper sx={{ flex: 1, overflow: 'auto', borderRadius: 2 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              color: 'text.secondary',
            }}
          >
            <ChatIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No sessions yet
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              Create your first session to start chatting with the AI
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Session
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sessions.map((session) => {
              const status = getSessionStatus(session);
              const isSelected = selectedSessionId === session.sessionId;
              
              return (
                <React.Fragment key={session.sessionId}>
                    <ListItem
                      button
                      selected={isSelected}
                      onClick={() => onSessionSelect && onSessionSelect(session.sessionId)}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                              {getSessionTitle(session)}
                            </Typography>
                            <Chip
                              label={status.label}
                              size="small"
                              color={status.color}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Created: {formatDate(session.createdAt)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Updated: {formatDate(session.updatedAt)}
                              </Typography>
                            </Box>
                            {session.state && Object.keys(session.state).length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <SettingsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  State: {Object.keys(session.state).length} properties
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Delete session">
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.sessionId);
                            }}
                            disabled={!session.isActive}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                                         <Divider />
                   </React.Fragment>
               );
             })}
          </List>
        )}
      </Paper>

      {/* Create Session Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            Create New Session
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User ID"
            fullWidth
            variant="outlined"
            value={newSessionData.userId}
            onChange={(e) => setNewSessionData(prev => ({ ...prev, userId: e.target.value }))}
            placeholder={userId || 'Enter user ID'}
            sx={{ mb: 2 }}
            helperText="Leave empty to use current user ID"
          />
          <TextField
            margin="dense"
            label="Initial State (JSON)"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newSessionData.initialState}
            onChange={(e) => setNewSessionData(prev => ({ ...prev, initialState: e.target.value }))}
            placeholder='{"context": "general", "language": "en"}'
            helperText="Optional: JSON object for initial session state"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManager; 