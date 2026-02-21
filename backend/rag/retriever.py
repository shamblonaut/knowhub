import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from rag.models import ResourceChunk
from rag.embedder import embed

def retrieve(query, semester=None, subject_id=None, allowed_subject_ids=None, top_k=5):
    qs = ResourceChunk.objects(embedding__exists=True)
    if semester:   qs = qs.filter(semester=int(semester))
    if subject_id:
        from bson import ObjectId
        qs = qs.filter(subject_id=ObjectId(subject_id))
    if allowed_subject_ids is not None:
        qs = qs.filter(subject_id__in=allowed_subject_ids)


    chunks = list(qs)
    if not chunks: return []

    q_vec  = np.array(embed(query)).reshape(1, -1)
    scores = cosine_similarity(q_vec, np.array([c.embedding for c in chunks]))[0]
    top    = np.argsort(scores)[::-1][:top_k]

    return [{
        'text':  chunks[i].chunk_text,
        'title': chunks[i].resource_title,
        'code':  chunks[i].subject_code,
        'page':  chunks[i].page_number,
        'rid':   str(chunks[i].resource_id),
        'score': round(float(scores[i]), 3),
    } for i in top]
