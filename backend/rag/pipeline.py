from bson import ObjectId
from repository.models import Resource, Subject
from rag.models import ResourceChunk
from rag.extractor import extract
from rag.chunker import chunk
from rag.embedder import embed_many

def process(resource_id: str):
    """Extract → chunk → embed → save. Safe to re-run (deletes old chunks first)."""
    try:
        r = Resource.objects.get(id=ObjectId(resource_id))
    except Exception:
        return

    subject_code = ''
    try:
        subject_code = Subject.objects.get(id=r.subject_id).code
    except Exception:
        pass

    pages  = extract(r)
    chunks = chunk(pages, resource_id)
    if not chunks:
        return

    embeddings = embed_many([c['text'] for c in chunks])

    ResourceChunk.objects(resource_id=r.id).delete()   # idempotent
    ResourceChunk.objects.insert([
        ResourceChunk(
            resource_id=r.id, resource_title=r.title, subject_code=subject_code,
            semester=r.semester, chunk_index=c['index'], chunk_text=c['text'],
            embedding=emb, page_number=c['page']
        )
        for c, emb in zip(chunks, embeddings)
    ])
    print(f'[RAG] Indexed {len(chunks)} chunks — "{r.title}"')
