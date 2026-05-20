const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const adkService = require('../services/adkService');

// POST /chat - Main chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { userId, sessionId, message, streaming = false } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId and message are required'
      });
    }

    // If no sessionId provided, create a new session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await sessionService.createSession(userId);
      currentSessionId = newSession.sessionId;
      
      // Create session in ADK agents
      try {
        await adkService.createADKSession(userId, currentSessionId);
      } catch (error) {
        console.warn('Failed to create ADK session, continuing with local session:', error);
      }
    } else {
      // Verify session exists
      const session = await sessionService.getSession(currentSessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }
    }

    // Add user message to chat history
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    await sessionService.addMessage(currentSessionId, userMessage);

    // Call ADK agents
    let adkResponse;
    try {
      if (streaming) {
        // Handle streaming response
        const adkStream = await adkService.callADKWithSSE(userId, currentSessionId, message, true);
        
        // Set headers for SSE
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Pipe the ADK response to client
        adkStream.data.pipe(res);
        
        // Handle stream end
        adkStream.data.on('end', async () => {
          // Add assistant response to chat history
          // Note: For streaming responses, you might want to collect the full response content
          // from the stream before adding to history
          const assistantMessage = {
            role: 'assistant',
            content: 'Streaming response completed',
            timestamp: new Date()
          };
          await sessionService.addMessage(currentSessionId, assistantMessage);
        });

        return;
      } else {
        // Handle regular response
        adkResponse = await adkService.callADK(userId, currentSessionId, message);
      }
    } catch (error) {
      console.error('ADK service error:', error);
      return res.status(500).json({
        error: 'Failed to get response from ADK agents',
        details: error.message
      });
    }

    console.log('ADK response:', JSON.stringify(adkResponse));
    // Extract the actual model response from ADK response
    let modelResponse = 'No response content';
    if (adkResponse && Array.isArray(adkResponse) && adkResponse.length > 0) {
      // Find the last response with role "model" that contains text
      for (let i = adkResponse.length - 1; i >= 0; i--) {
        const response = adkResponse[i];
        if (response.content && 
            response.content.role === 'model' && 
            response.content.parts && 
            response.content.parts.length > 0) {
          
          // Look for text content in parts
          for (const part of response.content.parts) {
            if (part.text) {
              modelResponse = part.text;
              break;
            }
          }
          
          if (modelResponse !== 'No response content') {
            break;
          }
        }
      }
    }

    // Add assistant response to chat history
    const assistantMessage = {
      role: 'assistant',
      content: modelResponse,
      timestamp: new Date()
    };
    await sessionService.addMessage(currentSessionId, assistantMessage);

    // Return response
    res.json({
      sessionId: currentSessionId,
      response: assistantMessage,
      adkResponse: adkResponse
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// POST /sessions - Create a new session
router.post('/sessions', async (req, res) => {
  try {
    const { userId, initialState = {} } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const session = await sessionService.createSession(userId, initialState);
    
    // Create session in ADK agents
    try {
      await adkService.createADKSession(userId, session.sessionId, initialState);
    } catch (error) {
      console.warn('Failed to create ADK session, continuing with local session:', error);
    }

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /sessions/:sessionId - Get session details
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /sessions/user/:userId - Get all sessions for a user
router.get('/sessions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await sessionService.getUserSessions(userId);
    res.json(sessions);
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /sessions/:sessionId/history - Get chat history for a session
router.get('/sessions/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await sessionService.getChatHistory(sessionId);
    res.json(history);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// PUT /sessions/:sessionId/state - Update session state
router.put('/sessions/:sessionId/state', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { stateDelta } = req.body;

    if (!stateDelta) {
      return res.status(400).json({
        error: 'stateDelta is required'
      });
    }

    const updatedSession = await sessionService.updateSessionState(sessionId, stateDelta);
    res.json(updatedSession);
  } catch (error) {
    console.error('Update session state error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// DELETE /sessions/:sessionId - Delete a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionService.deleteSession(sessionId);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// GET /health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const adkHealth = await adkService.healthCheck();
    res.json({
      status: 'healthy',
      adkAgents: adkHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 