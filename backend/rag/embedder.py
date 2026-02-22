import threading

_model = None
_lock  = threading.Lock()

def get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                print("[RAG] Loading SentenceTransformer model...")
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer('all-MiniLM-L6-v2')
                print("[RAG] Model loaded successfully.")
    return _model


def embed(text): return get_model().encode(text).tolist()
def embed_many(texts): return get_model().encode(texts, batch_size=32).tolist()
