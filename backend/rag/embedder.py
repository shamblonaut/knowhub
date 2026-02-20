_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')   # already in project
    return _model

def embed(text): return get_model().encode(text).tolist()
def embed_many(texts): return get_model().encode(texts, batch_size=32).tolist()
