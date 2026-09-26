import urllib.request
import json
import os

def load_env():
    env_path = '.env.local'
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip().strip("'").strip('"')

load_env()
key = os.environ.get('XAI_API_KEY')
print("Current XAI_API_KEY value:", key)

models = ['grok-2', 'grok-2-1212', 'grok-beta', 'grok-2-latest']

for m in models:
    url = 'https://api.x.ai/v1/chat/completions'
    headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    payload = {'model': m, 'messages': [{'role': 'user', 'content': 'Hi'}], 'max_tokens': 10}
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"Model {m}: SUCCESS {resp.status}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        print(f"Model {m}: HTTP {e.code} - {err_body}")
    except Exception as e:
        print(f"Model {m}: ERROR {e}")
