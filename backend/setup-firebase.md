# Firebase Setup Guide

## Step 1: Get Your Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`ignitrix-c80b5`)
3. Go to **Project Settings** (gear icon)
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Rename it to `firebase-service-account.json`
8. Place it in your project root directory

## Step 2: Update Environment Variables

Create a `.env` file in your project root:

```bash
cp env.example .env
```

Edit `.env` with your Firebase project details:

```env
PORT=3000
ADK_AGENTS_URL=http://localhost:8000
ADK_APP_NAME=final_agent
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=ignitrix-c80b5
```

## Step 3: Verify Firestore Rules

Make sure your Firestore rules allow read/write access. In Firebase Console:

1. Go to **Firestore Database**
2. Click **Rules** tab
3. Update rules to allow access (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // For development only
    }
  }
}
```

## Step 4: Test the Connection

After setting up, restart your server:

```bash
npm start
```

You should see: "Firebase Admin SDK initialized successfully with service account"

## Step 5: Test with CURL

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Create a session (will be stored in Firestore)
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "initialState": {
      "context": "general"
    }
  }'
```

## Troubleshooting

If you still see "Firestore not available" error:

1. Check that `firebase-service-account.json` is in the project root
2. Verify the file path in `.env` is correct
3. Make sure the service account has the right permissions
4. Check that your Firestore database is created and accessible 