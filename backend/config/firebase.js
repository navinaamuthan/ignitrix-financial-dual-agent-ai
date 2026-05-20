const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.apps[0];
    }

    // Try to initialize with service account
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    
    try {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      });

      console.log('Firebase Admin SDK initialized successfully with service account');
      return app;
    } catch (serviceAccountError) {
      console.warn('Service account file not found, initializing with default credentials...');
      
      // Fallback to default credentials (for development)
      const app = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'dev-project'
      });

      console.log('Firebase Admin SDK initialized with default credentials');
      return app;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Get Firestore instance
const getFirestore = () => {
  return admin.firestore();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  admin
}; 