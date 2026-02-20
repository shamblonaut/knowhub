SYSTEM = (
    "You are a BCA academic tutor. Answer ONLY using the course material provided. "
    "Cite sources with [1], [2], etc. If the material doesn't contain the answer, say so."
)

def build_prompt(question, chunks):
    ctx_parts = []
    for i, c in enumerate(chunks):
        page_str = f" p.{c['page']}" if c.get('page') else ""
        ctx_parts.append(f"[{i+1}] {c['title']} ({c['code']}){page_str}\n{c['text']}")
    
    ctx = '\n\n'.join(ctx_parts)
    return f"{SYSTEM}\n\nCOURSE MATERIAL:\n{ctx}\n\nQUESTION: {question}\n\nANSWER:"

def stream(prompt):
    """Generator yielding text tokens."""
    try:
        import ollama
        for chunk in ollama.chat(model='llama3.2:3b',
                                  messages=[{'role':'user','content':prompt}],
                                  stream=True):
            t = chunk.get('message',{}).get('content','')
            if t: yield t
    except Exception as e:
        yield f'[Error: {e}. Is Ollama running? Run: ollama serve]'
