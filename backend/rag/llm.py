SYSTEM = (
    "You are a BCA academic tutor. Answer ONLY using the course material provided. "
    "Cite sources with [1], [2], etc. If the material doesn't contain the answer, say so."
)

def build_messages(question, chunks, history=None):
    if history is None:
        history = []

    ctx_parts = []
    for i, c in enumerate(chunks):
        page_str = f" p.{c['page']}" if c.get('page') else ""
        ctx_parts.append(f"[{i+1}] {c['title']} ({c['code']}){page_str}\n{c['text']}")
    
    ctx = '\n\n'.join(ctx_parts)
    system_content = f"{SYSTEM}\n\nCOURSE MATERIAL:\n{ctx}"

    messages = [{"role": "system", "content": system_content}]
    
    # Append conversation history
    for msg in history:
        # Assuming history format is [{'role': 'user', 'content': '...'}, {'role': 'assistant', ...}]
        messages.append({"role": msg.get("role"), "content": msg.get("content")})
        
    messages.append({"role": "user", "content": question})
    return messages

import os
from groq import Groq

def stream(messages):
    """Generator yielding text tokens."""
    try:
        client = Groq()
        response = client.chat.completions.create(
            model='llama-3.1-8b-instant',
            messages=messages,
            stream=True
        )
        for chunk in response:
            token = chunk.choices[0].delta.content
            if token:
                yield token
    except Exception as e:
        yield f'[Error: {e}. Please ensure GROQ_API_KEY is properly set in the environment]'
