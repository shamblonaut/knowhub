import json
import threading
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rag.retriever import retrieve
from rag.llm import build_prompt, stream

class RAGAskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question   = (request.data.get('question') or '').strip()
        
        if request.user.role == 'student':
            semester = request.user.semester
        else:
            semester = request.data.get('semester')
            
        subject_id = request.data.get('subject_id') or None
        allowed_subject_ids = request.user.subject_ids if request.user.role == 'faculty' else None

        if not question:
            return Response({'error': 'question required'}, status=400)

        def events():
            chunks = retrieve(question, semester=semester, subject_id=subject_id, allowed_subject_ids=allowed_subject_ids)

            if not chunks:
                yield f"data: {json.dumps({'type':'no_context'})}\n\n"
                yield f"data: {json.dumps({'type':'done'})}\n\n"
                return

            prompt = build_prompt(question, chunks)

            for token in stream(prompt):
                yield f"data: {json.dumps({'type':'token','content':token})}\n\n"

            # Deduplicate sources by resource id
            seen, sources = set(), []
            for c in chunks:
                if c['rid'] not in seen:
                    seen.add(c['rid'])
                    sources.append({'resource_id':c['rid'],'title':c['title'],
                                    'code':c['code'],'score':c['score']})

            yield f"data: {json.dumps({'type':'sources','sources':sources})}\n\n"
            yield f"data: {json.dumps({'type':'done'})}\n\n"

        resp = StreamingHttpResponse(events(), content_type='text/event-stream')
        resp['Cache-Control']     = 'no-cache'
        resp['X-Accel-Buffering'] = 'no'
        return resp
