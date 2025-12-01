<h1 align="center">FACTZOD — Facts-Check-Agent</h1>
<p align="center"><em>An AI-based fact-checking service that extracts claims, finds evidence, and produces per-claim verdicts with a rewritten (corrected) article.</em></p>

<p align="center">
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-Latest-009688.svg" alt="FastAPI"></a>
  <a href="https://python.langchain.com/"><img src="https://img.shields.io/badge/LangChain-Core-2496ED.svg" alt="LangChain Core"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11%2B-blue.svg" alt="Python"></a>
</p>

---

## 📍 Overview

FactZod (Facts-Check-Agent) analyzes an input article or text for structured fact-check outputs. It:

 - Extracts atomic factual claims using prompt-based LLM parsing.
 - Converts claims into focused web search queries and collects evidence (via `TavilySearchResults`).
 - Generates a per-claim verdict (VERIFIED / FALSE / INCONCLUSIVE) with reasoning, evidence excerpt and source.
 - Produces a rewritten final article where false or uncertain claims are corrected or soft‑qualified.

The backend streams intermediate results (claims, queries, evidence, report, final text) using Server-Sent Events (SSE) so a frontend can render a step-by-step UI (cards for claims + a separate final article view).

**Live Demo View** @ https://factzod-facts-check-agent.onrender.com/

---

## 👾 Features

 - Claim extraction (atomic claims)
 - Search-query generation for each claim
 - Live evidence collection (Tavily search tool)
 - Structured fact-check report (Pydantic-validated JSON per claim)
 - Final rewritten article that incorporates corrections and citations
 - SSE streaming endpoints for progressive UI updates (no polling required)

---

## 🏗 Architecture

The project is organized as a simple backend service with an agent workflow built on a graph (StateGraph):

 - Frontend (any) ↔ FastAPI (SSE endpoints) ↔ Agent graph (claim_extraction → query_generation → web_search → evidence_cross_reference → text_rewriting)

Key components:

 - `backend/app.py` — FastAPI server, PDF extraction, SSE streaming endpoints (`/stream_analyze`, `/upload_analyze`).
 - `backend/agent.py` — Agent implementation: prompt templates, Pydantic models and StateGraph nodes.
 - `Facts_Check_Agent.ipynb` — Original notebook prototype used to craft prompts and workflow.

Core libraries and integrations used:

 - FastAPI — HTTP + SSE server
 - langchain_groq.ChatGroq — LLM (configurable via `GROQ_API_KEY`)
 - langchain_core PromptTemplate + PydanticOutputParser — prompting & JSON parsing
 - langchain_community.tools.tavily_search — web evidence tool
 - langgraph.graph StateGraph — pipeline orchestration
 - pypdf — PDF text extraction

Environment variables required:

 - `GROQ_API_KEY` — Groq/LLM API key
 - `TAVILY_API_KEY` — Tavily search API key (if using the search tool)

---

## Running Locally

Start the backend server:

```cmd
cd c:\Users\ADMIN\OneDrive\Documents\Code\Langchain_Projects\Facts-Check-Agent\backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Start the frontend: 

```cmd
cd c:\Users\ADMIN\OneDrive\Documents\Code\Langchain_Projects\Facts-Check-Agent\frontend
.venv\Scripts\activate
npm install
npm run dev
```

Health check:

```cmd
curl http://127.0.0.1:8000/
```

Factcheck example (curl):

```cmd
curl -X POST http://127.0.0.1:8000/stream_analyze -H "Content-Type: application/json" -d "{\"text\": \"Your article or text goes here\"}"
```

Response (JSON):

```json
{
  "claims": ["Claim 1", "Claim 2"],
  "queries": ["query for claim1", "query for claim2"],
  "evidences": "...joined evidence string...",
  "fact_check_report": "LLM generated report string",
  "final_text": "Rewritten article text"
}
```

---

## Deployment to Render (quick guide)

1. Create a new Web Service on Render (Python).
2. Connect the GitHub repo and point to the `Facts-Check-Agent/backend` directory as the root (Render UI supports subdirectory deploys).
3. Build Command: `pip install -r requirements.txt` 
4. Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Set environment variables in Render: `GROQ_API_KEY`, `GROQ_MODEL`, and any other keys.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Run tests (if added) and linters.
3. Open a PR describing the changes.

---

## 👨‍💻 Author

Aditya Jain

Would love to connect with you and hear your feedback! 

Connect with me on 📧 LinkedIn: https://www.linkedin.com/in/adityajain8595/
