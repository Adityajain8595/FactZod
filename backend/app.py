import json
import io
from pypdf import PdfReader
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import app_graph

app = FastAPI()

# Defining CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RequestBody(BaseModel):
    text: str

# Extraction of text from PDF
def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
        return text
    except Exception as e:
        print(f"PDF Extraction Error: {e}")
        return ""

# Defining core agent streamer: streams data to the frontend as the agent moves through the graph nodes.
async def run_agent_stream(input_text: str):
    initial_state = {
        "original_text": input_text,
        "claims": [], "queries": [], "evidences": "", 
        "fact_check_report": {}, "final_text": ""
    }

    # Stream the graph updates
    async for event in app_graph.astream(initial_state):
        
        # 1. Event: Claims Extracted
        if "claim_extraction" in event:
            # Safety access
            claims_data = event["claim_extraction"].get("claims", [])
            data = {
                "type": "claims",
                "content": claims_data
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 2. Event: Queries Generated
        elif "query_generation" in event:
            queries_data = event["query_generation"].get("queries", [])
            data = {
                "type": "queries",
                "content": queries_data
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 3. Event: Evidence Collected
        elif "web_search" in event:
            evidence_data = event["web_search"].get("evidences", "")
            data = {
                "type": "evidence",
                "content": evidence_data 
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 4. Event: Fact Report Created
        elif "evidence_cross_reference" in event:
            # get report or empty dict if missing
            report_data = event["evidence_cross_reference"].get("fact_check_report", {})
            data = {
                "type": "report",
                "content": report_data
            }
            yield f"data: {json.dumps(data)}\n\n"

        # 5. Event: Final Rewrite
        elif "text_rewriting" in event:
            final_text_data = event["text_rewriting"].get("final_text", "")
            data = {
                "type": "final",
                "content": final_text_data
            }
            yield f"data: {json.dumps(data)}\n\n"

@app.get("/")
def home():
    return {"status": "FactZod API is running"}

@app.post("/stream_analyze")
async def stream_analyze(body: RequestBody):
    return StreamingResponse(
        run_agent_stream(body.text), 
        media_type="text/event-stream"
    )

@app.post("/upload_analyze")
async def upload_analyze(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    try:
        content = await file.read()
        extracted_text = extract_text_from_pdf(content)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file might be scanned or empty.")

        return StreamingResponse(
            run_agent_stream(extracted_text), 
            media_type="text/event-stream"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))