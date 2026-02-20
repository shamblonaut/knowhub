from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from bson import ObjectId

from repository.models import Resource, Subject
from repository.views import serialize_resource


class SearchView(APIView):
    """
    GET: Hybrid semantic search.
    Embeds the query and calculates cosine similarity with resource embeddings.
    Falls back to keyword matching if no embedding is present.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({"error": "Search query 'q' is required."}, status=400)

        # Base queryset — approved only
        qs = Resource.objects(status='approved')

        # Apply filters
        if semester := request.query_params.get('semester'):
            try:
                qs = qs.filter(semester=int(semester))
            except ValueError:
                return Response({"error": "Invalid semester parameter."}, status=400)
        
        if subject := request.query_params.get('subject'):
            try:
                qs = qs.filter(subject_id=ObjectId(subject))
            except Exception:
                return Response({"error": "Invalid subject ID."}, status=400)
        
        if fmt := request.query_params.get('format'):
            qs = qs.filter(file_format=fmt)

        resources = list(qs)
        if not resources:
            return Response({"query": q, "count": 0, "results": []})

        # Embed the query
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        query_embedding = model.encode(q)

        # Score resources with embeddings
        scored = []
        for r in resources:
            if r.embedding:
                sim = cosine_similarity(
                    [query_embedding],
                    [np.array(r.embedding)]
                )[0][0]
            else:
                # Fallback: score by title keyword match
                sim = 0.1 if q.lower() in r.title.lower() else 0.0

            scored.append((r, float(sim)))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)

        results = []
        for resource, score in scored:
            data = serialize_resource(resource)
            data['similarity_score'] = round(score, 4)
            results.append(data)

        return Response({
            "query": q,
            "count": len(results),
            "results": results,
        })


class RecommendView(APIView):
    """
    GET: Recommend 5 similar resources based on semantic similarity.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, resource_id):
        try:
            target = Resource.objects.get(id=ObjectId(resource_id))
        except Exception:
            return Response({"error": "Resource not found."}, status=404)

        if not target.embedding:
            return Response({"error": "Resource has no embedding yet."}, status=400)

        # All other approved resources with embeddings
        candidates = Resource.objects(
            status='approved',
            id__ne=target.id,
            embedding__exists=True
        )

        if not candidates:
            return Response({
                "resource_id": str(target.id),
                "recommendations": [],
            })

        target_vec = np.array(target.embedding)
        scored = []
        for r in candidates:
            sim = cosine_similarity([target_vec], [np.array(r.embedding)])[0][0]
            scored.append((r, float(sim)))

        scored.sort(key=lambda x: x[1], reverse=True)
        top5 = scored[:5]

        recommendations = []
        for resource, score in top5:
            subject_code = None
            try:
                subject = Subject.objects.get(id=resource.subject_id)
                subject_code = subject.code
            except Exception:
                pass

            rec = {
                "id": str(resource.id),
                "title": resource.title,
                "subject_code": subject_code,
                "similarity_score": round(score, 4),
            }
            if resource.resource_type == 'file':
                rec['file_format'] = resource.file_format
                rec['file_url'] = f"http://localhost:8000/media/{resource.file_path}"
            else:
                rec['url'] = resource.url
            recommendations.append(rec)

        return Response({
            "resource_id": str(target.id),
            "recommendations": recommendations,
        })
