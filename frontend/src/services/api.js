import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 30 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API service class
class ApiService {
  // Health check
  async getHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Session management
  async createSession(userId, initialState = {}) {
    try {
      const response = await api.post('/sessions', {
        userId,
        initialState,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSession(sessionId) {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserSessions(userId) {
    try {
      const response = await api.get(`/sessions/user/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateSessionState(sessionId, stateDelta) {
    try {
      const response = await api.put(`/sessions/${sessionId}/state`, {
        stateDelta,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChatHistory(sessionId) {
    try {
      const response = await api.get(`/sessions/${sessionId}/history`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Chat functionality
  async sendMessage(userId, message, sessionId = null, streaming = false) {
    try {
      const payload = {
        userId,
        message,
        streaming,
      };

      if (sessionId) {
        payload.sessionId = sessionId;
      }

      if (streaming) {
        // For streaming, return the response stream
        return api.post('/chat', payload, {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
          },
        });
      } else {
        // For regular chat
        const response = await api.post('/chat', payload);
        return response.data;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      return new Error(errorMessage);
    } else if (error.request) {
      // Network error
      return new Error('Network error - please check your connection to the backend server');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ApiService(); 