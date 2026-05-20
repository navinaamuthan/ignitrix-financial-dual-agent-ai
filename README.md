# IGNITRIX — Dual-Agent Adversarial AI Financial Intelligence System

> Built end-to-end in 48 hours at the Google Cloud Agentic AI Hackathon  
> Grand Finalist — Top 250 of 50,000+ participants worldwide

---

# Overview

IGNITRIX is a dual-agent adversarial financial intelligence system that uses two specialised AI agents to analyse financial data, challenge each other's conclusions, and produce validated financial insights.

The core architectural insight behind IGNITRIX is that a single AI agent tends to over-confirm its own reasoning. By designing two adversarial agents that challenge each other before producing a final recommendation, the system reduces hallucination risk and improves the reliability of financial analysis.

---

# System Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Agent       │
│   (Port 5173)   │◄──►│   (Port 3000)   │◄──►│   (Port 8000)   │
│   React + Vite  │    │   Node.js       │    │   ADK Web       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

# Services Overview

## Agent Service (Port 8000)

- **Technology:** Google ADK Web
- **Purpose:** AI agents for financial analysis and strategy planning
- **Agents:** Maya, Nash, Collaboration Engine
- **Integration:** FI Money MCP for structured financial data access

---

## Backend Service (Port 3000)

- **Technology:** Node.js + Express
- **Purpose:** API gateway, session management, chat orchestration
- **Features:**
  - Firebase integration
  - Session persistence
  - Real-time chat handling

---

## Frontend Service (Port 5173)

- **Technology:** React + Vite
- **Purpose:** Modern chat interface for user interaction
- **Features:**
  - Real-time messaging
  - Session management
  - Responsive UI

---

# AI Agents

## Maya — Financial Health Diagnostic Agent

Maya analyses financial data to surface insights and diagnose the overall health of a user's financial position.

She is the first agent in the reasoning pipeline and produces a structured financial health assessment from raw financial inputs.

---

## Nash — Strategy Planning Agent

Nash takes Maya’s assessment and stress-tests it.

He models alternative scenarios, identifies weaknesses in Maya’s reasoning, and proposes strategic recommendations. Nash is intentionally adversarial to Maya’s outputs.

---

## Collaboration Engine

The Collaboration Engine orchestrates the interaction between Maya and Nash.

It manages:
- Structured handoff
- Reasoning validation
- Challenge cycles
- Final output reconciliation

The final system response represents both agents’ reasoning processes.

---

# Key Architecture Decisions

## 1. Why dual adversarial agents rather than a single agent?

Single agents naturally tend to over-confirm their own reasoning.

In financial analysis, a confident but incorrect answer is worse than an uncertain one. By designing Maya and Nash as adversarial agents where Nash explicitly challenges Maya’s conclusions, IGNITRIX introduces validation directly into the reasoning chain itself rather than bolting it on afterwards.

This was the most important architectural decision in the system.

Every other design choice flows from it.

### Rejected Alternative
**Single orchestrator agent with chain-of-thought prompting**

**Reason for rejection:**  
Chain-of-thought prompting improves reasoning quality but does not introduce genuine adversarial challenge. The model is still validating its own logic rather than being challenged by an independent reasoning process.

---

## 2. How agents safely read and act on financial data

The core challenge was ensuring agents had access to accurate, non-stale, non-duplicated financial data without overloading context windows.

### Decision
Use **FI Money MCP** as a structured retrieval layer rather than injecting full financial datasets directly into prompts.

MCP allows agents to retrieve exactly the fields required for each reasoning step:
- Maya retrieves only what she needs
- Nash retrieves only what he needs to challenge Maya

Neither agent receives unnecessary data unless the reasoning chain requires it.

This:
- Keeps prompts focused
- Reduces irrelevant context noise
- Improves freshness of retrieved financial data
- Reduces token usage and latency

### Rejected Alternative
**Full financial data ingestion at session start**

**Reason for rejection:**  
Injecting complete financial datasets into every prompt increases latency and token cost while also risking stale reasoning over outdated data.

### Rejected Alternative
**Static data snapshots per conversation turn**

**Reason for rejection:**  
Snapshots reduce repeated fetching but introduce staleness risk in real-time financial environments where balances and market conditions change frequently.

---

## 3. Session persistence strategy

### Decision
Use Firebase for session persistence with in-memory state during active conversations.

Firebase provides reliable asynchronous persistence for completed sessions while active sessions remain memory-resident for lower latency.

### What I would improve in production

Writing to Firebase on every message introduces latency at scale.

In production, I would:
- Use Redis for active conversation state
- Persist asynchronously to Firebase only:
  - on session close
  - or at checkpoint intervals

This would significantly reduce per-message latency under high traffic.

---

## 4. Frontend communication model

### Decision
Use a React + Vite frontend communicating with a Node.js backend via REST APIs, with the backend acting as the gateway to the ADK agent service.

The frontend never communicates directly with agents.

All agent interactions are mediated through the backend which handles:
- Session management
- Authentication context
- Validation
- Error handling

### Why this matters

Direct frontend-to-agent communication would expose the agent service to unauthenticated requests.

The backend gateway ensures only validated and authenticated sessions can trigger agent reasoning.

---

# What I Would Build Next

1. **Streaming agent responses**  
   Stream partial outputs for improved perceived latency during longer reasoning chains.

2. **Structured disagreement logging**  
   Surface disagreements between Maya and Nash to improve transparency and user trust.

3. **Redis session store**  
   Replace Firebase for active session state to reduce latency at production scale.

4. **Evaluation harness**  
   Systematically benchmark whether the dual-agent architecture outperforms single-agent systems across financial reasoning scenarios.

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Agent Framework | Google ADK |
| Persistence | Firebase |
| AI Infrastructure | Vertex AI |
| Financial Data Layer | FI Money MCP |

---

# Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Google Cloud Project with Vertex AI enabled
- Firebase Project
- FI Money MCP access

---

# Quick Start

## 1. Agent Service Setup

```bash
cd agent
cp env.example .env
```

Configure `.env`:

```env
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
FINANCIAL_NEWS_API_KEY=your_eventregistry_api_key
```

Install dependencies and start the agent service:

```bash
pip install -r requirements.txt
adk web start
```

Verify:
```text
http://localhost:8000
```

---

## 2. Backend Service Setup

```bash
cd backend
cp env.example .env
```

Configure `.env`:

```env
PORT=3000
ADK_AGENTS_URL=http://localhost:8000
ADK_APP_NAME=final_agent
FIREBASE_SERVICE_ACCOUNT_PATH=./config/your-firebase-adminsdk.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

Install dependencies and start backend:

```bash
npm install
npm start
```

Verify:
```text
http://localhost:3000/api/health
```

---

## 3. Frontend Service Setup

```bash
cd frontend
cp env.example .env
```

Configure `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Install dependencies and start frontend:

```bash
npm install
npm run dev
```

Verify:
```text
http://localhost:5173
```

---

# Environment Variables Reference

## Agent Service

| Variable | Description | Required |
|---|---|---|
| GOOGLE_GENAI_USE_VERTEXAI | Enable Vertex AI | Yes |
| GOOGLE_CLOUD_PROJECT | Google Cloud Project ID | Yes |
| GOOGLE_CLOUD_LOCATION | Google Cloud Location | Yes |
| FINANCIAL_NEWS_API_KEY | EventRegistry API Key | Yes |

---

## Backend Service

| Variable | Description | Required |
|---|---|---|
| PORT | Server Port | No |
| ADK_AGENTS_URL | Agent Service URL | Yes |
| ADK_APP_NAME | ADK Application Name | Yes |
| FIREBASE_PROJECT_ID | Firebase Project ID | Yes |
| FIREBASE_SERVICE_ACCOUNT_PATH | Firebase Service Account Path | Yes |

---

## Frontend Service

| Variable | Description | Required |
|---|---|---|
| VITE_API_BASE_URL | Backend API URL | Yes |

---

# Troubleshooting

### Agent service not starting
Verify:
- Google Cloud credentials
- Vertex AI is enabled

---

### Backend connection issues
Verify:
- Agent service is running on port 8000
- `ADK_AGENTS_URL` is configured correctly

---

### Frontend connection issues
Verify:
- Backend is running on port 3000
- `VITE_API_BASE_URL` is configured correctly

---

### Port conflicts
Update the relevant `.env` files if ports are already in use.

---

# Built At

Google Cloud Agentic AI Hackathon
Team Ignitirix - Navina Amuthan & Harihara Roopan
Grand Finalist — Top 250 of 50,000+ participants worldwide

---

