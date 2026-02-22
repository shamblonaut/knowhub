import json
import threading
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rag.retriever import retrieve
from rag.llm import build_messages, stream

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

        history = request.data.get('history') or []

        if not question:
            return Response({'error': 'question required'}, status=400)

        def events():
            chunks = retrieve(question, semester=semester, subject_id=subject_id, allowed_subject_ids=allowed_subject_ids)

            if not chunks:
                yield f"data: {json.dumps({'type':'no_context'})}\n\n"
                yield f"data: {json.dumps({'type':'done'})}\n\n"
                return

            messages = build_messages(question, chunks, history)

            for token in stream(messages):
                yield f"data: {json.dumps({'type':'token','content':token})}\n\n"

            # Send all chunks as sources (they match the [1], [2] indices used in prompt)
            sources = []
            for i, c in enumerate(chunks):
                sources.append({
                    'index': i + 1,
                    'resource_id': c['rid'],
                    'title': c['title'],
                    'code': c['code'],
                    'page': c.get('page'),
                    'text': c['text'],
                    'score': c['score']
                })

            yield f"data: {json.dumps({'type':'sources','sources':sources})}\n\n"
            yield f"data: {json.dumps({'type':'done'})}\n\n"

        resp = StreamingHttpResponse(events(), content_type='text/event-stream')
        resp['Cache-Control']     = 'no-cache'
        resp['X-Accel-Buffering'] = 'no'
        return resp
