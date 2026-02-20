import tiktoken
_enc = tiktoken.get_encoding('cl100k_base')

def chunk(pages, resource_id, size=350, overlap=50):
    tokens, page_map = [], []
    for pg, text in pages:
        toks = _enc.encode(text)
        tokens += toks
        page_map += [pg] * len(toks)

    chunks, i = [], 0
    while i < len(tokens):
        window = tokens[i:i+size]
        text   = _enc.decode(window).strip()
        if len(text) > 20:
            # Most common page in this window
            pgs = [p for p in page_map[i:i+size] if p]
            pg  = max(set(pgs), key=pgs.count) if pgs else None
            chunks.append({'resource_id': resource_id, 'index': len(chunks),
                           'text': text, 'page': pg})
        i += (size - overlap)
    return chunks
