import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import apiService from '../services/api';

const ChatInterface = ({ userId, sessionId, onSessionCreated }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedDebates, setExpandedDebates] = useState(new Set());
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    try {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.warn('Failed to scroll to bottom:', error);
    }
  };

  const scrollToBottomImmediate = () => {
    try {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.warn('Failed to scroll to bottom:', error);
    }
  };

  // Scroll to bottom when messages change (new message sent/received)
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [messages]);

  // Scroll to bottom when typing indicator appears/disappears
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [isTyping]);

  // Scroll to bottom when loading state changes (history loaded)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        scrollToBottomImmediate();
      }, 200);
    }
  }, [isLoading, messages.length]);

  // Update currentSessionId when sessionId prop changes
  useEffect(() => {
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      // Clear messages when switching sessions
      setMessages([]);
      setError(null);
    }
  }, [sessionId, currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory();
    }
  }, [currentSessionId]);

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await apiService.getChatHistory(currentSessionId);
      
      // Parse debate responses in loaded messages
      const parsedMessages = (history.messages || []).map(message => {
        if (message.role === 'assistant') {
          // Check if this is a debate response and ensure it's properly formatted
          const parsedResponse = parseDebateResponse(message.content);
          if (parsedResponse.isDebate) {
            // Keep the original content format to ensure proper parsing
            return {
              ...message,
              content: message.content
            };
          }
        }
        return message;
      });
      
      setMessages(parsedMessages);
      
      // Scroll to bottom after loading history
      setTimeout(() => {
        scrollToBottomImmediate();
      }, 300);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setError(null);
    setIsTyping(true);
    
    // Scroll to bottom immediately after adding user message
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    try {
      let response;
      
      if (!currentSessionId) {
        // Create new session and send message
        response = await apiService.sendMessage(userId, messageToSend);
        setCurrentSessionId(response.sessionId);
        if (onSessionCreated) {
          onSessionCreated(response.sessionId);
        }
      } else {
        // Send message to existing session
        response = await apiService.sendMessage(userId, messageToSend, currentSessionId);
      }

      // Add assistant response
      if (response.response) {
        let content = response.response.content;
        
        // If the response content is "No response content", try to get it from adkResponse
        if (content === "No response content" && response.adkResponse && response.adkResponse.length > 0) {
          const adkResponse = response.adkResponse[0];
          if (adkResponse.content && adkResponse.content.parts && adkResponse.content.parts.length > 0) {
            content = adkResponse.content.parts[0].text;
          }
        }
        
        // Check if this is a debate response and format it properly
        const parsedResponse = parseDebateResponse(content);
        let finalContent = content;
        
        if (parsedResponse.isDebate) {
          // Keep the original content format (markdown code block or JSON)
          // This ensures that when we load from history, it's parsed correctly
          finalContent = content;
        }
        
        const assistantMessage = {
          role: 'assistant',
          content: finalContent,
          timestamp: new Date(),
          id: Date.now().toString() + '_assistant',
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Scroll to bottom after adding assistant message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      setError('Failed to send message: ' + error.message);
      // Remove the user message if it failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    let date;
    
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp) {
      date = new Date(timestamp);
    } else {
      return 'Unknown';
    }
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Parse debate response
  const parseDebateResponse = (content) => {
    // First, try to extract JSON from markdown code blocks
    if (typeof content === 'string') {
      // Check for markdown code block with json
      const jsonCodeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonCodeBlockMatch) {
        try {
          const jsonContent = jsonCodeBlockMatch[1].trim();
          const parsed = JSON.parse(jsonContent);
          
          if (parsed.debate && Array.isArray(parsed.debate) && parsed.final_summary) {
            return {
              isDebate: true,
              debate: parsed.debate,
              finalSummary: parsed.final_summary
            };
          }
        } catch {
          // Invalid JSON in code block
        }
      }
      
      // Check for regular code block (without json language specifier)
      const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        try {
          const codeContent = codeBlockMatch[1].trim();
          const parsed = JSON.parse(codeContent);
          
          if (parsed.debate && Array.isArray(parsed.debate) && parsed.final_summary) {
            return {
              isDebate: true,
              debate: parsed.debate,
              finalSummary: parsed.final_summary
            };
          }
        } catch {
          // Invalid JSON in code block
        }
      }
    }
    
    // Try parsing the entire content as JSON
    try {
      const parsed = JSON.parse(content);
      
      if (parsed.debate && Array.isArray(parsed.debate) && parsed.final_summary) {
        return {
          isDebate: true,
          debate: parsed.debate,
          finalSummary: parsed.final_summary
        };
      }
    } catch {
      // Not a JSON response, treat as regular message
    }
    
    // Also check if content contains debate-like structure as a string
    if (typeof content === 'string' && content.includes('"debate"') && content.includes('"final_summary"')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.debate && Array.isArray(parsed.debate) && parsed.final_summary) {
          return {
            isDebate: true,
            debate: parsed.debate,
            finalSummary: parsed.final_summary
          };
        }
      } catch {
        // Still not valid JSON
      }
    }
    
    return { isDebate: false, content };
  };

  // Toggle debate expansion
  const toggleDebate = (messageId) => {
    setExpandedDebates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Debate Component
  const DebateComponent = ({ debate, finalSummary, messageId }) => {
    const isExpanded = expandedDebates.has(messageId);
    
    return (
      <Box sx={{ width: '100%', maxWidth: '600px', mx: 'auto' }}>
        {/* Debate Header */}
        <Paper
          sx={{
            p: 2,
            mb: 1,
            background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
            border: '1px solid #d0e7ff',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, #e6f3ff 0%, #d0e7ff 100%)',
            }
          }}
          onClick={() => toggleDebate(messageId)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              🤖 AI Debate: Maya vs Nash
            </Typography>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Click to {isExpanded ? 'collapse' : 'expand'} the debate
          </Typography>
        </Paper>

        {/* Debate Messages */}
        <Collapse in={isExpanded}>
          <Box sx={{ mb: 2 }}>
            {debate.map((debateMessage, index) => {
              const isMaya = debateMessage.startsWith('Maya:');
              const isNash = debateMessage.startsWith('Nash:');
              const character = isMaya ? 'Maya' : isNash ? 'Nash' : 'Unknown';
              const message = debateMessage.replace(/^(Maya|Nash):\s*/, '');
              
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: isMaya ? 'flex-start' : 'flex-end',
                    mb: 1,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      background: isMaya 
                        ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' 
                        : 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
                      border: `1px solid ${isMaya ? '#90caf9' : '#ffb74d'}`,
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          bgcolor: isMaya ? 'primary.main' : 'warning.main',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {character.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isMaya ? 'primary.main' : 'warning.dark' }}>
                        {character}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {message}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
          </Box>
        </Collapse>

        {/* Final Summary */}
        <Paper
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #f1f8e9 0%, #c8e6c9 100%)',
            border: '1px solid #81c784',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BotIcon sx={{ color: 'success.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
              Final Summary
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {finalSummary}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      maxHeight: '100vh',
      overflow: 'hidden'
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
          color: 'white'
        }}
      >
        <BotIcon sx={{ color: 'white' }} />
        <Typography variant="h6" sx={{ color: 'white' }}>ADK Chat</Typography>
        {currentSessionId && (
          <>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Chip
              label={`Session: ${currentSessionId.slice(0, 8)}...`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '& .MuiChip-label': { color: 'white' }
              }}
            />
            <IconButton 
              onClick={loadChatHistory} 
              size="small"
              sx={{ color: 'white' }}
            >
              <RefreshIcon />
            </IconButton>
          </>
        )}
      </Paper>

      {/* Messages */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'hidden',
          p: 2,
          mb: 2,
          backgroundColor: '#fafafa',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Important for flex child to shrink
        }}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                <ErrorIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {messages.length === 0 && !isLoading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'text.secondary',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <BotIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
              <Typography variant="h5" sx={{ mb: 1 }}>
                Welcome to ADK Chat!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Start a conversation by typing a message below.
              </Typography>
              <Chip 
                label="AI-powered conversations" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </Box>
        )}

                <Box ref={messagesContainerRef} sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <List sx={{ p: 0 }}>
            {messages.map((message) => {
              // Parse debate response for assistant messages
              const parsedResponse = message.role === 'assistant' ? parseDebateResponse(message.content) : null;
              
              return (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                    p: 0,
                  }}
                >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    maxWidth: '75%',
                  }}
                >
                                    {message.role === 'assistant' && !parsedResponse?.isDebate && (
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 36, 
                        height: 36,
                        boxShadow: 2
                      }}
                    >
                      <BotIcon />
                    </Avatar>
                  )}
                  
                  {/* Render debate component or regular message */}
                  {parsedResponse?.isDebate ? (
                    <DebateComponent 
                      debate={parsedResponse.debate}
                      finalSummary={parsedResponse.finalSummary}
                      messageId={message.id}
                    />
                  ) : (
                    <Paper
                      sx={{
                        p: 2,
                        background: message.role === 'user' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : 'white',
                        color: message.role === 'user' ? 'white' : 'text.primary',
                        borderRadius: 3,
                        boxShadow: 2,
                        position: 'relative',
                        '&::before': message.role === 'user' ? {
                          content: '""',
                          position: 'absolute',
                          right: -8,
                          top: 12,
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid #667eea',
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                        } : {
                          content: '""',
                          position: 'absolute',
                          left: -8,
                          top: 12,
                          width: 0,
                          height: 0,
                          borderRight: '8px solid white',
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                        }
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          color: message.role === 'user' ? 'white' : 'text.primary'
                        }}
                      >
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            fontSize: '0.75rem',
                            color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                          }}
                        >
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                        {message.role === 'user' && (
                          <CheckCircleIcon sx={{ fontSize: 16, opacity: 0.7, color: 'white' }} />
                        )}
                      </Box>
                    </Paper>
                  )}
                  
                  {message.role === 'user' && (
                    <Avatar 
                      sx={{ 
                        bgcolor: 'secondary.main', 
                        width: 36, 
                        height: 36,
                        boxShadow: 2
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
        </Box>

        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <BotIcon />
            </Avatar>
            <Paper
              sx={{
                p: 1.5,
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  AI is typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Input */}
      <Paper 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          boxShadow: 3,
          background: 'white'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{ 
              minWidth: 'auto', 
              px: 3, 
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:disabled': {
                background: '#e0e0e0',
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface; 