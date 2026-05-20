# Ignitrix Agentic AI

A comprehensive AI-powered financial analysis system featuring specialized agents, backend services, and a modern chat interface. The system leverages FI Money MCP (Model Context Protocol) for real-time financial data access and analysis.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Agent       │
│   (Port 5173)   │◄──►│   (Port 3000)   │◄──►│   (Port 8000)   │
│   React + Vite  │    │   Node.js       │    │   ADK Web       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Services Overview

### 🤖 Agent Service (Port 8000)
- **Technology**: Google ADK Web
- **Purpose**: AI agents for financial analysis and strategy planning
- **Agents**: Maya (Health Diagnostic), Nash (Strategy Planning), Collaboration Engine
- **Integration**: FI Money MCP for financial data access

### 🔧 Backend Service (Port 3000)
- **Technology**: Node.js + Express
- **Purpose**: API gateway, session management, chat orchestration
- **Features**: Firebase integration, session persistence, real-time chat

### 🎨 Frontend Service (Port 5173)
- **Technology**: React + Vite
- **Purpose**: Modern chat interface for user interaction
- **Features**: Real-time messaging, session management, responsive UI

## Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher) - for agent service
- **Google Cloud Project** with Vertex AI enabled
- **Firebase Project** - for backend data storage
- **FI Money MCP** - for financial data access

## Quick Start

### 1. Agent Service Setup

Navigate to the agent directory and set up the environment:

```bash
cd agent
```

Create environment file:
```bash
cp env.example .env
```

Configure the `.env` file with your Google Cloud settings:
```env
# Google ADK Configuration
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Financial News API Configuration
FINANCIAL_NEWS_API_KEY=your_eventregistry_api_key
```

Install dependencies and start the agent:
```bash
pip install -r requirements.txt
adk web start
```

**Verify Agent Service**: Check that the agent is running at `http://localhost:8000`

### 2. Backend Service Setup

Navigate to the backend directory:

```bash
cd backend
```

Create environment file:
```bash
cp env.example .env
```

Configure the `.env` file:
```env
# Server Configuration
PORT=3000

# ADK Agents Configuration
ADK_AGENTS_URL=http://localhost:8000
ADK_APP_NAME=final_agent

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./config/ignitrix-c80b5-firebase-adminsdk-fbsvc-fec1dd3802.json
FIREBASE_PROJECT_ID=ignitrix-c80b5
```

Install dependencies and start the backend:
```bash
npm install
npm start
```

**Verify Backend Service**: Check that the backend is running at `http://localhost:3000/api/health`

### 3. Frontend Service Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Create environment file:
```bash
cp env.example .env
```

Configure the `.env` file:
```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:3000/api
```

Install dependencies and start the frontend:
```bash
npm install
npm run dev
```

**Verify Frontend Service**: Check that the frontend is running at `http://localhost:5173`

## Service Verification

After starting each service, verify they are running correctly:

### Agent Service (Port 8000)
```bash
curl http://localhost:8000/health
# Should return agent status
```

### Backend Service (Port 3000)
```bash
curl http://localhost:3000/api/health
# Should return backend status
```

### Frontend Service (Port 5173)
```bash
# Open browser to http://localhost:5173
# Should display the chat interface
```

## Environment Variables Reference

### Agent Service
| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_GENAI_USE_VERTEXAI` | Enable Vertex AI | Yes |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud Project ID | Yes |
| `GOOGLE_CLOUD_LOCATION` | Google Cloud Location | Yes |
| `FINANCIAL_NEWS_API_KEY` | EventRegistry API Key | Yes |

### Backend Service
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `ADK_AGENTS_URL` | Agent service URL | Yes |
| `ADK_APP_NAME` | ADK application name | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Firebase service account path | Yes |

### Frontend Service
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |

## AI Agents

The system features three specialized AI agents:

### Maya - Health Diagnostic Agent
- **Role**: Financial data analysis and health assessment
- **Capabilities**: Discovers insights from financial data
- **Tools**: FI Money MCP integration

### Nash - Strategy Planning Agent
- **Role**: Scenario modeling and strategy development
- **Capabilities**: Finds optimal strategies and models scenarios
- **Tools**: FI Money MCP integration

### Collaboration Engine
- **Role**: Orchestrates agent interactions
- **Capabilities**: Coordinates between Maya and Nash for comprehensive analysis
- **Output**: Final summary and recommendations

## Development Workflow

1. **Start Agent First**: Ensure ADK web service is running on port 8000
2. **Start Backend**: Verify backend connects to agent service
3. **Start Frontend**: Confirm frontend can communicate with backend
4. **Test Integration**: Send a message through the chat interface

## Troubleshooting

### Common Issues

1. **Agent Service Not Starting**
   - Verify Google Cloud credentials
   - Check Vertex AI is enabled
   - Ensure all environment variables are set

2. **Backend Connection Issues**
   - Verify agent service is running on port 8000
   - Check `ADK_AGENTS_URL` in backend `.env`
   - Confirm Firebase configuration

3. **Frontend Connection Issues**
   - Verify backend is running on port 3000
   - Check `VITE_API_BASE_URL` in frontend `.env`
   - Ensure CORS is configured on backend

### Port Conflicts

If ports are already in use:
- **Port 8000**: Change agent service port in ADK configuration
- **Port 3000**: Update `PORT` in backend `.env`
- **Port 5173**: Vite will automatically find an available port

This project is part of the Ignitrix Agentic AI system. 