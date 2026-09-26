import sys
import json
import os
import time
import urllib.request
import urllib.parse

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

def generate_via_persistent_service(query, context):
    url = "http://127.0.0.1:8000/generate"
    payload = json.dumps({"query": query, "context": context}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        return res_data.get("answer"), res_data.get("provider_used"), res_data.get("inference_ms")

def generate_via_grok_direct(query, context, xai_key):
    if xai_key.startswith("gsk_"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        model = "qwen/qwen3.8-27b"
        provider_name = f"Groq API ({model})"
    else:
        url = "https://api.x.ai/v1/chat/completions"
        model = "grok-2-latest"
        provider_name = f"Grok API ({model})"

    headers = {
        "Authorization": f"Bearer {xai_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"PORTFOLIO CONTEXT:\n{context}\n\nUSER QUESTION: {query}"}
        ],
        "temperature": 0.2,
        "max_tokens": 600
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req, timeout=25) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        return res_data['choices'][0]['message']['content'].strip(), provider_name

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stdin, 'reconfigure'):
        sys.stdin.reconfigure(encoding='utf-8')

    t0_start = time.perf_counter()

    if not sys.stdin.isatty():
        raw_input = sys.stdin.read()
    elif len(sys.argv) > 1:
        raw_input = sys.argv[1]
    else:
        sys.stdout.write(json.dumps({"error": "Missing input JSON payload"}, ensure_ascii=False) + "\n")
        return

    if not raw_input or not raw_input.strip():
        sys.stdout.write(json.dumps({"error": "Empty input JSON payload"}, ensure_ascii=False) + "\n")
        return

    payload = json.loads(raw_input)
    query = payload.get("query", "")
    context = payload.get("context", "")

    answer = None
    provider_used = None
    llm_duration_ms = 0.0
    execution_location = "grok_api"

    # Option A: Try persistent service endpoint first
    try:
        ans, prov, dur = generate_via_persistent_service(query, context)
        if ans:
            answer = ans
            provider_used = prov or "Grok API (grok-2-latest)"
            llm_duration_ms = dur or 0.0
            execution_location = "persistent_grok_service"
    except Exception:
        pass

    # Option B: Direct Grok API call if persistent service is unavailable
    if not answer:
        load_env_local()
        xai_key = os.environ.get("XAI_API_KEY")
        if not xai_key:
            sys.stdout.write(json.dumps({
                "error": "XAI_API_KEY is not set in environment or .env.local. Please add XAI_API_KEY=... to .env.local"
            }, ensure_ascii=False) + "\n")
            return

        t_grok_start = time.perf_counter()
        try:
            ans, prov = generate_via_grok_direct(query, context, xai_key)
            answer = ans
            t_grok_end = time.perf_counter()
            provider_used = prov
            llm_duration_ms = round((t_grok_end - t_grok_start) * 1000, 2)
            execution_location = "direct_grok_api"
        except Exception as err:
            sys.stdout.write(json.dumps({
                "error": f"Grok xAI API request failed: {str(err)}"
            }, ensure_ascii=False) + "\n")
            return

    t_total = time.perf_counter()

    telemetry = {
        "provider_used": provider_used,
        "llm_generation_ms": llm_duration_ms,
        "total_llm_script_ms": round((t_total - t0_start) * 1000, 2),
        "execution_location": execution_location
    }

    sys.stdout.write(json.dumps({"answer": answer, "_telemetry": telemetry}, ensure_ascii=False) + "\n")
    sys.stdout.flush()

if __name__ == "__main__":
    main()
