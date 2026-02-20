import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.chunker import chunk
from rag.embedder import embed, embed_many

pages = [(1, "Content of page 1. " * 50), (2, "Content of page 2. " * 50)]
try:
    chunks = chunk(pages, "test_res_1", size=50, overlap=10)
    print(f"Chunks created: {len(chunks)}")
    for i, c in enumerate(chunks[:2]):
        print(f"  Chunk {i}: text={c['text'][:30]}... page={c['page']}")
        
    print("Generating embeddings...")
    embs = embed_many([c['text'] for c in chunks])
    print(f"Embeddings generated: {len(embs)} items of dimension {len(embs[0]) if embs else 0}")
    print("Step 3 verification clear!")
except Exception as e:
    print(f"Error during verification: {e}")
