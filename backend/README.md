# ADK Chat Backend

A Node.js/Express backend that integrates with ADK agents to provide chat functionality with session management and Firestore storage.

## Features

- 🤖 Integration with ADK agents running on port 8000
- 💬 Chat endpoint with streaming and non-streaming responses
- 📝 Session management with Firestore
- 💾 Persistent chat history
- 🔄 State management for sessions
- 🏥 Health check endpoints
- 🚀 RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- Firebase project with Firestore enabled
- ADK agents running on port 8000

## Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Create a Firebase project
   - Enable Firestore
   - Download your service account key JSON file
   - Place it in the project root as `firebase-service-account.json`

3. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   ADK_AGENTS_URL=http://localhost:8000
   ADK_APP_NAME=agent
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   FIREBASE_PROJECT_ID=your-project-id
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Chat Endpoint

**POST** `/api/chat`

Send a message to ADK agents and get a response.

**Request Body:**
```json
{
  "userId": "user123",
  "sessionId": "optional-session-id",
  "message": "Hello, how are you?",
  "streaming": false
}
```

**Response:**
```json
{
  "sessionId": "generated-session-id",
  "response": {
    "role": "assistant",
    "content": "I'm doing well, thank you!",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "adkResponse": {
    // Raw response from ADK agents
  }
}
```

### Session Management

**POST** `/api/sessions` - Create a new session
**GET** `/api/sessions/:sessionId` - Get session details
**GET** `/api/sessions/user/:userId` - Get all sessions for a user
**GET** `/api/sessions/:sessionId/history` - Get chat history
**PUT** `/api/sessions/:sessionId/state` - Update session state
**DELETE** `/api/sessions/:sessionId` - Delete session

### Health Check

**GET** `/api/health` - Check system health and ADK agents connectivity

## Usage Examples

### Basic Chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Hello, what can you help me with?"
  }'
```

### Chat with Existing Session

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "sessionId": "existing-session-id",
    "message": "Continue from where we left off"
  }'
```

### Create Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "initialState": {
      "context": "customer_support",
      "language": "en"
    }
  }'
```

### Get Chat History

```bash
curl http://localhost:3000/api/sessions/session-id-here/history
```

### Streaming Chat (Server-Sent Events)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "userId": "user123",
    "message": "Tell me a long story",
    "streaming": true
  }'
```

## Project Structure

```
├── config/
│   └── firebase.js          # Firebase configuration
├── services/
│   ├── sessionService.js    # Session and chat history management
│   └── adkService.js        # ADK agents integration
├── routes/
│   └── chat.js             # API routes
├── server.js               # Main server file
├── package.json            # Dependencies
├── env.example            # Environment variables template
└── README.md              # This file
```

## Firestore Collections

The backend uses two main Firestore collections:

- **`sessions`** - Stores session metadata and state
- **`chat_history`** - Stores chat messages for each session

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400` - Bad Request (missing required fields)
- `404` - Not Found (session not found)
- `500` - Internal Server Error

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Production Deployment

1. Set up environment variables for production
2. Ensure Firebase service account is properly configured
3. Run with PM2 or similar process manager:

```bash
npm start
```

## Troubleshooting

1. **Firebase connection issues:** Verify your service account key and project ID
2. **ADK agents not responding:** Check if agents are running on port 8000
3. **CORS issues:** The backend includes CORS middleware, but you may need to configure it for your frontend domain

## License

MIT 