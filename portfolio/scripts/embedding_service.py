import sys
import os
import time
import json
import warnings
import uvicorn
import urllib.request
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union

warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

def load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    key = key.strip()
                    val = val.strip().strip("'").strip('"')
                    if key not in os.environ:
                        os.environ[key] = val

load_env_local()

model = None
model_load_time_ms = 0.0

SYSTEM_PROMPT = """You are Sujan K S's Portfolio AI Assistant.
Your task is to answer user questions about Sujan's work, experience, projects, education, and skills accurately and concisely using ONLY the provided portfolio context.

CRITICAL INSTRUCTIONS:
1. Grounding: Rely strictly on the provided context chunks. Do NOT invent, hallucinate, or assume facts not present in the context. Always preserve exact facts like CGPA 8.56.
2. Synthesis: Treat retrieved Markdown text strictly as background knowledge context. Do NOT blindly copy Markdown formatting or output raw key-value dumps (such as "**Company:** ... \n **Location:** ..."). Generate natural, conversational, human-like AI responses.
3. Metadata Removal: Never output metadata headers such as `[Document: ...]`, `[Chunk ...]`, `Source:`, `Section:`, or `Language:`.
4. Missing Information: If the query cannot be answered using the provided context, clearly state: "The requested information is not available in Sujan's portfolio knowledge base."
5. Proposed / Planned Status: If a project status is marked as "Proposed / Planned — Not Started" (e.g. final-year colorectal polyp detection project), clearly state that it is a proposed/planned research project and NOT yet fully implemented or completed.
6. Language: Answer in the same language as the user's query (English for English queries, Japanese for Japanese queries).
7. Conciseness: Keep answers concise, factual, and direct to the point.
"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, model_load_time_ms
    print("\n=======================================================================")
    print("[SERVICE] Starting BGE-M3 Embedding & Grok/xAI Persistent Service...")
    print("=======================================================================")
    print("[EMBEDDING SERVICE] Loading BAAI/bge-m3 SentenceTransformer into RAM...")
    
    t0 = time.perf_counter()
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("BAAI/bge-m3")
    t1 = time.perf_counter()
    model_load_time_ms = round((t1 - t0) * 1000, 2)
    
    xai_key = os.environ.get("XAI_API_KEY")
    if xai_key:
        print("[LLM SERVICE] [OK] Grok/xAI API key configured.")
    else:
        print("[LLM SERVICE] Warning: XAI_API_KEY is not set in environment or .env.local")

    print(f"[SERVICE] [OK] Server ready on http://127.0.0.1:8000")
    print("=======================================================================\n")
    yield
    print("\n[SERVICE] Shutting down service and releasing memory...")

app = FastAPI(title="BGE-M3 & Grok xAI Persistent Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbedRequest(BaseModel):
    text: Union[str, List[str]]

class GenerateRequest(BaseModel):
    query: str
    context: str

@app.get("/health")
def health():
    if model is None:
        raise HTTPException(status_code=503, detail="Embedding model is still loading...")
    return {
        "status": "healthy",
        "embedding_model": "BAAI/bge-m3",
        "llm_provider": "xAI Grok API (grok-2-latest)",
        "dimension": 1024,
        "model_load_time_ms": model_load_time_ms,
        "xai_api_key_configured": bool(os.environ.get("XAI_API_KEY"))
    }

@app.post("/embed")
def embed(req: EmbedRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Embedding model is still initializing.")
    
    if isinstance(req.text, list):
        queries = req.text
    else:
        queries = [req.text]
    
    t0 = time.perf_counter()
    embeddings = model.encode(queries, normalize_embeddings=True).tolist()
    t1 = time.perf_counter()
    inference_ms = round((t1 - t0) * 1000, 2)
    
    if isinstance(req.text, str):
        return {
            "embedding": embeddings[0],
            "dimension": len(embeddings[0]),
            "inference_ms": inference_ms,
            "cached_in_memory": True
        }
    
    return {
        "embeddings": embeddings,
        "dimension": len(embeddings[0]) if embeddings else 1024,
        "inference_ms": inference_ms,
        "cached_in_memory": True
    }

@app.post("/generate")
def generate(req: GenerateRequest):
    t0 = time.perf_counter()
    
    load_env_local()
    xai_key = os.environ.get("XAI_API_KEY")
    if not xai_key:
        raise HTTPException(
            status_code=400,
            detail="XAI_API_KEY is missing. Please add XAI_API_KEY=... to .env.local"
        )

    if xai_key.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        model_name = "qwen/qwen3.8-27b"
        provider_label = f"Groq API ({model_name})"
    else:
        url = "https://api.x.ai/v1/chat/completions"
        model_name = "grok-2-latest"
        provider_label = f"Grok API ({model_name})"

    headers = {
        "Authorization": f"Bearer {xai_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"PORTFOLIO CONTEXT:\n{req.context}\n\nUSER QUESTION: {req.query}"}
        ],
        "temperature": 0.2,
        "max_tokens": 600
    }
    
    for attempt in range(4):
        try:
            r = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
            with urllib.request.urlopen(r, timeout=25) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                answer = res_data['choices'][0]['message']['content'].strip()
                t1 = time.perf_counter()
                return {
                    "answer": answer,
                    "provider_used": provider_label,
                    "inference_ms": round((t1 - t0) * 1000, 2)
                }
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 3:
                time.sleep(2.0 * (attempt + 1))
                continue
            raise HTTPException(status_code=500, detail=f"LLM API call failed: {str(e)}")
        except Exception as e:
            if attempt < 3:
                time.sleep(1.5)
                continue
            raise HTTPException(status_code=500, detail=f"LLM API call failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("EMBEDDING_SERVICE_PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
