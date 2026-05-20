# Ignitrix Agentic AI - Frontend

A modern React-based chat interface that connects to AI agents through the backend, enabling intelligent financial conversations powered by FI Money MCP (Model Context Protocol).

## Features

- 🤖 **AI Agent Chat Interface**: Interact with specialized AI agents for financial analysis and insights
- 💬 **Real-time Messaging**: Stream conversations with AI agents in real-time
- 📊 **Session Management**: Save and manage chat sessions with persistent state
- 🔄 **Streaming Responses**: Experience fluid, real-time AI responses
- 🎨 **Modern UI**: Clean, responsive interface built with React and Vite
- 🔗 **MCP Integration**: Powered by FI Money MCP for comprehensive financial data access

## Prerequisites

- **Node.js** (v16 or higher)
- **Backend Server**: The backend must be running and accessible
- **FI Money MCP**: Configured and running for financial data access

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your backend URL:

```bash
cp env.example .env
```

Edit `.env` with your backend configuration:

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:3000/api


### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |
| `VITE_DEV_MODE` | Enable development mode | `false` |
| `VITE_DEBUG_LEVEL` | Debug logging level | `info` |

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatInterface.jsx    # Main chat component
│   │   └── SessionManager.jsx   # Session management
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.jsx                 # Main application component
│   └── main.jsx                # Application entry point
├── public/                     # Static assets
├── .env.example               # Environment variables template
└── package.json               # Dependencies and scripts
```

## API Integration

The frontend communicates with the backend through the `ApiService` class, which provides:

- **Session Management**: Create, retrieve, and manage chat sessions
- **Message Handling**: Send messages to AI agents with streaming support
- **Error Handling**: Comprehensive error handling and user feedback
- **Health Checks**: Backend connectivity verification

### Key API Endpoints

- `POST /api/chat` - Send messages to AI agents
- `GET /api/sessions` - Retrieve user sessions
- `POST /api/sessions` - Create new chat sessions
- `PUT /api/sessions/:id/state` - Update session state

## AI Agents

The system connects to specialized AI agents through the backend:

- **Health Diagnostic Agent (Maya)**: Analyzes financial data and discovers insights
- **Strategy Planning Agent (Nash)**: Models scenarios and finds optimal strategies
- **Collaboration Engine**: Orchestrates agent interactions for comprehensive analysis

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

This project is part of the Ignitrix Agentic AI system.

