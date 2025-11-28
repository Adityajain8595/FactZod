# main.py
import json
import asyncio
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import app_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    text: str

async def run_agent_stream(input_text: str):
    """
    Generator function that streams data to the frontend as the agent moves through the graph nodes.
    """
    initial_state = {
        "original_text": input_text,
        "claims": [], "queries": [], "evidences": "", 
        "fact_check_report": {}, "final_text": ""
    }

    # Stream the graph updates
    async for event in app_graph.astream(initial_state):
        
        # 1. Event: Claims Extracted
        if "claim_extraction" in event:
            data = {
                "type": "claims",
                "content": event["claim_extraction"]["claims"]
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 2. Event: Queries Generated
        elif "query_generation" in event:
            data = {
                "type": "queries",
                "content": event["query_generation"]["queries"]
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 3. Event: Evidence Collected
        elif "web_search" in event:
            data = {
                "type": "evidence",
                "content": event["web_search"]["evidences"] # Snippets string
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 4. Event: Fact Report Created (The Cards)
        elif "evidence_cross_reference" in event:
            data = {
                "type": "report",
                "content": event["evidence_cross_reference"]["fact_check_report"]
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 5. Event: Final Rewrite
        elif "text_rewriting" in event:
            data = {
                "type": "final",
                "content": event["text_rewriting"]["final_text"]
            }
            yield f"data: {json.dumps(data)}\n\n"

@app.post("/stream_analyze")
async def stream_analyze(body: RequestBody):
    return StreamingResponse(
        run_agent_stream(body.text), 
        media_type="text/event-stream"
    )
