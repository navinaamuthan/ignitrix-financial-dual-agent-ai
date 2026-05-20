const { getFirestore, admin } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor() {
    try {
      this.db = getFirestore();
      this.sessionsCollection = this.db.collection('sessions');
      this.chatHistoryCollection = this.db.collection('chat_history');
      this.useFirestore = true;
      console.log('SessionService initialized with Firestore');
    } catch (error) {
      console.warn('Firestore not available, using in-memory storage:', error.message);
      this.useFirestore = false;
      this.sessions = new Map();
      this.chatHistory = new Map();
    }
  }

  // Create a new session
  async createSession(userId, initialState = {}) {
    try {
      const sessionId = uuidv4();
      const sessionData = {
        sessionId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        state: initialState,
        isActive: true
      };

      if (this.useFirestore) {
        await this.sessionsCollection.doc(sessionId).set(sessionData);
        
        // Initialize empty chat history
        await this.chatHistoryCollection.doc(sessionId).set({
          sessionId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // In-memory storage
        this.sessions.set(sessionId, sessionData);
        this.chatHistory.set(sessionId, {
          sessionId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Get session by ID
  async getSession(sessionId) {
    try {
      if (this.useFirestore) {
        const sessionDoc = await this.sessionsCollection.doc(sessionId).get();
        if (!sessionDoc.exists) {
          return null;
        }
        return sessionDoc.data();
      } else {
        // In-memory storage
        return this.sessions.get(sessionId) || null;
      }
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  // Get all sessions for a user
  async getUserSessions(userId) {
    try {
      if (this.useFirestore) {
        const sessionsSnapshot = await this.sessionsCollection
          .where('userId', '==', userId)
          .where('isActive', '==', true)
          .orderBy('updatedAt', 'desc')
          .get();

        return sessionsSnapshot.docs.map(doc => doc.data());
      } else {
        // In-memory storage
        const userSessions = Array.from(this.sessions.values())
          .filter(session => session.userId === userId && session.isActive)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return userSessions;
      }
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // Update session state
  async updateSessionState(sessionId, stateDelta) {
    try {
      if (this.useFirestore) {
        const sessionRef = this.sessionsCollection.doc(sessionId);
        await sessionRef.update({
          state: stateDelta,
          updatedAt: new Date()
        });
      } else {
        // In-memory storage
        const session = this.sessions.get(sessionId);
        if (session) {
          session.state = stateDelta;
          session.updatedAt = new Date();
          this.sessions.set(sessionId, session);
        }
      }
      
      return await this.getSession(sessionId);
    } catch (error) {
      console.error('Error updating session state:', error);
      throw error;
    }
  }

  // Add message to chat history
  async addMessage(sessionId, message) {
    try {
      // Add message with timestamp
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date(),
        id: uuidv4()
      };

      if (this.useFirestore) {
        const chatDocRef = this.chatHistoryCollection.doc(sessionId);
        await chatDocRef.update({
          messages: admin.firestore.FieldValue.arrayUnion(messageWithTimestamp),
          updatedAt: new Date()
        });
      } else {
        // In-memory storage
        const history = this.chatHistory.get(sessionId);
        if (history) {
          history.messages.push(messageWithTimestamp);
          history.updatedAt = new Date();
          this.chatHistory.set(sessionId, history);
        }
      }

      return messageWithTimestamp;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId) {
    try {
      if (this.useFirestore) {
        const chatDoc = await this.chatHistoryCollection.doc(sessionId).get();
        if (!chatDoc.exists) {
          return { messages: [] };
        }
        return chatDoc.data();
      } else {
        // In-memory storage
        const history = this.chatHistory.get(sessionId);
        return history || { messages: [] };
      }
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  // Delete session (soft delete)
  async deleteSession(sessionId) {
    try {
      if (this.useFirestore) {
        await this.sessionsCollection.doc(sessionId).update({
          isActive: false,
          deletedAt: new Date()
        });
      } else {
        // In-memory storage
        const session = this.sessions.get(sessionId);
        if (session) {
          session.isActive = false;
          session.deletedAt = new Date();
          this.sessions.set(sessionId, session);
        }
      }
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}

module.exports = new SessionService(); 