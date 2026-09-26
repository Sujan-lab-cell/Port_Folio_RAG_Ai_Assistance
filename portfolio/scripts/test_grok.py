import os
import json
import urllib.request

env_path = '.env.local'
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'").strip('"')

key = os.environ.get('XAI_API_KEY')
print("XAI_API_KEY from .env.local:", key)

url = 'https://api.x.ai/v1/chat/completions'
headers = {
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}
payload = {
    'model': 'grok-2-latest',
    'messages': [{'role': 'user', 'content': 'Say hello in 3 words.'}],
    'max_tokens': 30
}

try:
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("GROK API SUCCESS!")
        print("MODEL USED:", res.get("model"))
        print("RESPONSE:", res['choices'][0]['message']['content'])
except Exception as e:
    print("GROK API ERROR:", e)
