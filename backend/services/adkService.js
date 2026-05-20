const axios = require('axios');

class ADKService {
  constructor() {
    this.baseURL = process.env.ADK_AGENTS_URL || 'http://localhost:8000';
    this.appName = process.env.ADK_APP_NAME || 'final_agent';
  }

  // Call ADK agents with streaming response
  async callADKWithSSE(userId, sessionId, message, streaming = false) {
    try {
      const payload = {
        appName: this.appName,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          role: 'user',
          parts: [
            {
              text: message
            }
          ]
        },
        streaming: streaming,
        stateDelta: null
      };

      const response = await axios.post(`${this.baseURL}/run_sse`, payload, {
        headers: {
          'Accept': 'text/event-stream',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      return response;
    } catch (error) {
      console.error('Error calling ADK with SSE:', error?.message);
      throw error;
    }
  }

  // Call ADK agents with regular response
  async callADK(userId, sessionId, message) {
    try {
      const payload = {
        appName: this.appName,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          role: 'user',
          parts: [
            {
              text: message
            }
          ]
        }
      };

      const response = await axios.post(`${this.baseURL}/run`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error calling ADK:', error);
      throw error;
    }
  }

  // Create session in ADK agents
  async createADKSession(userId, sessionId, initialState = {}) {
    try {
      const payload = {
        state: initialState
      };

      const response = await axios.post(
        `${this.baseURL}/apps/${this.appName}/users/${userId}/sessions/${sessionId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating ADK session:', error);
      throw error;
    }
  }

  // Check if ADK agents are available
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('ADK agents health check failed:', error);
      return false;
    }
  }
}

module.exports = new ADKService(); 