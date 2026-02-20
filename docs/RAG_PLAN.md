# Knowledge Hub — RAG Integration Plan
> Brief implementation guide for both backend and frontend.
> Stack adds: PyMuPDF · python-pptx · python-docx · tiktoken · Ollama (llama3.2:1b)

---

## What It Does

Takes a user's natural language question → finds the most relevant chunks from uploaded course files → feeds them to a local LLM → streams a cited answer back to the browser.

```
Question → Embed → Match chunks → Build prompt → LLM → Stream answer + sources
```

---

## New Pieces

| What | Where | Purpose |
|------|-------|---------|
| `resource_chunks` collection | MongoDB | Stores chunked + embedded text per resource |
| `rag/` Django app | Backend | Extraction, chunking, retrieval, LLM, API |
| `RAGChat.jsx` | Frontend | Chat UI with streaming and source cards |
| `useRAGStream.js` | Frontend | Hook managing SSE token stream |

---

## Quick Setup (run first)

```bash
# Backend deps
pip install pymupdf python-pptx python-docx tiktoken ollama

# Install + start Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama serve          # keep this running
ollama pull llama3.2:1b
```

---

---

# BACKEND

---

## Step 1 — Create `rag` app + MongoDB model

```bash
python manage.py startapp rag
```

Add `'rag'` to `INSTALLED_APPS`. Add `path('api/v1/', include('rag.urls'))` to `core/urls.py`.

**`rag/models.py`**
```python
import mongoengine as me

class ResourceChunk(me.Document):
    resource_id    = me.ObjectIdField(required=True)
    resource_title = me.StringField()
    subject_code   = me.StringField()
    semester       = me.IntField()
    chunk_index    = me.IntField()
    chunk_text     = me.StringField(required=True)
    embedding      = me.ListField(me.FloatField())
    page_number    = me.IntField()           # PDF only

    meta = {'collection': 'resource_chunks',
            'indexes': ['resource_id', 'semester']}
```

---

## Step 2 — Text Extraction

**`rag/extractor.py`**
```python
import os
from django.conf import settings

def extract(resource):
    """Returns list of (page_num, text). Empty list for URLs."""
    if resource.resource_type == 'url':
        # Use metadata as fallback text
        text = f"{resource.title} {resource.description} {' '.join(resource.tags or [])}"
        return [(None, text)]

    path = os.path.join(settings.MEDIA_ROOT, resource.file_path or '')
    if not os.path.exists(path):
        return []

    try:
        fmt = resource.file_format
        if fmt == 'pdf':
            import fitz
            doc = fitz.open(path)
            pages = [(i+1, p.get_text()) for i, p in enumerate(doc) if len(p.get_text()) > 30]
            doc.close()
            return pages
        elif fmt == 'ppt':
            from pptx import Presentation
            prs = Presentation(path)
            return [(i+1, '\n'.join(s.text for s in slide.shapes if hasattr(s,'text') and s.text.strip()))
                    for i, slide in enumerate(prs.slides)]
        elif fmt == 'doc':
            from docx import Document
            paras = [p.text for p in Document(path).paragraphs if len(p.text.strip()) > 10]
            return [(None, '\n'.join(paras[i:i+8])) for i in range(0, len(paras), 8)]
        elif fmt == 'image':
            text = f"{resource.title} {resource.description} {' '.join(resource.tags or [])}"
            return [(None, text)]
    except Exception as e:
        print(f'[Extractor] {resource.id}: {e}')
    return []
```

---

## Step 3 — Chunker + Embedder

**`rag/chunker.py`**
```python
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
```

**`rag/embedder.py`**
```python
_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')   # already in project
    return _model

def embed(text): return get_model().encode(text).tolist()
def embed_many(texts): return get_model().encode(texts, batch_size=32).tolist()
```

---

## Step 4 — Pipeline (orchestrator)

**`rag/pipeline.py`**
```python
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
```

**Wire into existing approve + upload views** (`repository/views.py`):
```python
import threading
from rag.pipeline import process

# Add after resource.save() when status == 'approved':
threading.Thread(target=process, args=(str(resource.id),), daemon=True).start()
```

**Backfill existing resources (run once):**
```bash
python manage.py shell
>>> from repository.models import Resource
>>> from rag.pipeline import process
>>> [process(str(r.id)) for r in Resource.objects(status='approved', resource_type='file')]
```

---

## Step 5 — Retriever

**`rag/retriever.py`**
```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from rag.models import ResourceChunk
from rag.embedder import embed

def retrieve(query, semester=None, subject_id=None, top_k=5):
    qs = ResourceChunk.objects(embedding__exists=True)
    if semester:   qs = qs.filter(semester=int(semester))
    if subject_id:
        from bson import ObjectId
        qs = qs.filter(subject_id=ObjectId(subject_id))

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
```

---

## Step 6 — LLM (Ollama)

**`rag/llm.py`**
```python
SYSTEM = (
    "You are a BCA academic tutor. Answer ONLY using the course material provided. "
    "Cite sources with [1], [2], etc. If the material doesn't contain the answer, say so."
)

def build_prompt(question, chunks):
    ctx = '\n\n'.join(
        f"[{i+1}] {c['title']} ({c['code']}){f' p.{c[\"page\"]}' if c.get('page') else ''}\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    return f"{SYSTEM}\n\nCOURSE MATERIAL:\n{ctx}\n\nQUESTION: {question}\n\nANSWER:"

def stream(prompt):
    """Generator yielding text tokens."""
    try:
        import ollama
        for chunk in ollama.chat(model='llama3.2:1b',
                                  messages=[{'role':'user','content':prompt}],
                                  stream=True):
            t = chunk.get('message',{}).get('content','')
            if t: yield t
    except Exception as e:
        yield f'[Error: {e}. Is Ollama running? Run: ollama serve]'
```

---

## Step 7 — API Endpoint (SSE streaming)

**`rag/views.py`**
```python
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
        semester   = request.data.get('semester')
        subject_id = request.data.get('subject_id') or None

        if not question:
            return Response({'error': 'question required'}, status=400)

        def events():
            chunks = retrieve(question, semester=semester, subject_id=subject_id)

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
```

**`rag/urls.py`**
```python
from django.urls import path
from .views import RAGAskView

urlpatterns = [
    path('rag/ask/', RAGAskView.as_view()),
]
```

### Request / SSE Response

```
POST /api/v1/rag/ask/
{ "question": "Explain BFS", "semester": 4, "subject_id": "..." }

→ data: {"type":"token",   "content":"BFS stands for..."}
→ data: {"type":"token",   "content":" Breadth-First..."}
→ data: {"type":"sources", "sources":[{"title":"Unit 3","code":"BCA401","score":0.91,...}]}
→ data: {"type":"done"}
```

---

---

# FRONTEND

---

## Step 1 — API + Mock

**`src/api/endpoints/rag.js`**
```js
import { USE_MOCK } from '../config'

const MOCK_TOKENS = [
  'BFS ','(Breadth-First Search) ','visits all neighbors ','at the current depth ',
  'before going deeper. ','It uses a queue [1].\n\n',
  'DFS ','(Depth-First Search) ','explores as far ','down a branch ','before backtracking [1].',
]
const MOCK_SOURCES = [{ resource_id:'r1', title:'Unit 3 - Trees & Graphs', code:'BCA401', score:0.91 }]

export const askRAG = async (params, { onToken, onSources, onDone, onNoContext, onError }) => {
  if (USE_MOCK) {
    for (const t of MOCK_TOKENS) {
      await new Promise(r => setTimeout(r, 40 + Math.random() * 50))
      onToken(t)
    }
    onSources(MOCK_SOURCES)
    onDone()
    return
  }

  const token    = localStorage.getItem('access_token')
  const response = await fetch('http://localhost:8000/api/v1/rag/ask/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params),
  })

  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const e = JSON.parse(line.slice(6))
        if (e.type === 'token')      onToken(e.content)
        if (e.type === 'sources')    onSources(e.sources)
        if (e.type === 'done')       onDone()
        if (e.type === 'no_context') onNoContext?.()
        if (e.type === 'error')      onError?.(e.message)
      } catch (_) {}
    }
  }
}
```

---

## Step 2 — `useRAGStream` Hook

**`src/hooks/useRAGStream.js`**
```js
import { useState, useCallback, useRef } from 'react'
import { askRAG } from '../api/endpoints/rag'

export function useRAGStream() {
  const [messages,  setMessages]  = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const buffer = useRef('')

  const patchLast = (patch) =>
    setMessages(prev => {
      const m = [...prev]
      m[m.length - 1] = { ...m[m.length - 1], ...patch }
      return m
    })

  const ask = useCallback(async (params) => {
    if (isLoading || !params.question?.trim()) return

    setMessages(prev => [...prev,
      { role: 'user',      content: params.question, sources: [] },
      { role: 'assistant', content: '', sources: [], streaming: true },
    ])
    setIsLoading(true)
    buffer.current = ''

    await askRAG(params, {
      onToken:     (t) => { buffer.current += t; setIsLoading(false); patchLast({ content: buffer.current }) },
      onSources:   (s) => patchLast({ sources: s }),
      onDone:      ()  => { setIsLoading(false); patchLast({ streaming: false }) },
      onNoContext:  ()  => { setIsLoading(false); patchLast({ content: "No relevant material found. Try different filters or rephrase.", streaming: false }) },
      onError:     (m) => { setIsLoading(false); patchLast({ content: `Error: ${m}`, streaming: false, error: true }) },
    })
  }, [isLoading])

  const reset = () => { setMessages([]); setIsLoading(false); buffer.current = '' }

  return { messages, isLoading, ask, reset }
}
```

---

## Step 3 — Components

Install markdown renderer: `npm install react-markdown`

**`src/components/ChatMessage.jsx`**
```jsx
import ReactMarkdown from 'react-markdown'

export default function ChatMessage({ role, content, sources = [], streaming }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
        ${isUser ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="max-w-[78%] flex flex-col gap-2">
        <div className={`rounded-2xl px-4 py-3 text-sm
          ${isUser ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
          {isUser
            ? <p>{content}</p>
            : <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
                {streaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm ml-1" />}
              </div>
          }
        </div>
        {!isUser && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {sources.map((s, i) => (
              <span key={s.resource_id} className="text-xs bg-blue-50 text-accent border border-blue-100 px-2 py-0.5 rounded-full">
                [{i+1}] {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**`src/components/SourceCard.jsx`**
```jsx
export default function SourceCard({ source, index }) {
  const pct = Math.round(source.score * 100)
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
      <div className="flex justify-between mb-1 text-xs">
        <span className="font-bold text-accent">[{index}]</span>
        <span className="text-gray-400">{source.code}</span>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{source.title}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-400">{pct}%</span>
      </div>
    </div>
  )
}
```

---

## Step 4 — RAGChat Page

**`src/pages/RAGChat.jsx`**
```jsx
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import ChatMessage from '../components/ChatMessage'
import SourceCard from '../components/SourceCard'
import { useRAGStream } from '../hooks/useRAGStream'
import { getSemesters, getSubjects } from '../api/endpoints/subjects'

const SUGGESTIONS = [
  'Explain BFS and DFS with examples',
  'What is process scheduling in OS?',
  'Summarise DBMS normalisation',
]

export default function RAGChat() {
  const [input,     setInput]     = useState('')
  const [semester,  setSemester]  = useState('')
  const [subjectId, setSubjectId] = useState('')
  const { messages, isLoading, ask, reset } = useRAGStream()
  const bottomRef = useRef(null)

  const { data: semData } = useQuery({ queryKey: ['semesters'], queryFn: getSemesters })
  const { data: subData  } = useQuery({
    queryKey: ['subjects', semester], queryFn: () => getSubjects(semester || null), enabled: !!semester
  })

  // Latest sources from most recent assistant message
  const sources = [...messages].reverse().find(m => m.role === 'assistant' && m.sources?.length)?.sources || []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const submit = (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    ask({ question: input.trim(), semester: semester || undefined, subject_id: subjectId || undefined })
    setInput('')
  }

  return (
    <Layout>
      <div className="flex gap-4" style={{ height: 'calc(100vh - 100px)' }}>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header + filters */}
          <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 mb-3 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-primary">AI Study Assistant</h1>
                <p className="text-xs text-gray-400">Answers from your course materials</p>
              </div>
              {messages.length > 0 && <button onClick={reset} className="text-xs text-gray-400 hover:text-red-500">Clear</button>}
            </div>
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select value={semester} onChange={e => { setSemester(e.target.value); setSubjectId('') }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-accent focus:outline-none">
                <option value="">All Semesters</option>
                {(semData?.semesters || []).map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!semester}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-40">
                <option value="">All Subjects</option>
                {(subData?.results || []).map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-1 pb-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="text-5xl mb-4">🤖</div>
                <h2 className="text-lg font-bold text-primary mb-6">Ask your course material anything</h2>
                <div className="space-y-2 w-full max-w-sm">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="w-full text-left px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm text-gray-600 hover:border-accent hover:text-accent transition shadow-sm">
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => <ChatMessage key={i} {...m} />)
            )}
            {/* Typing indicator */}
            {isLoading && messages[messages.length-1]?.role === 'user' && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center">🤖</div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0,150,300].map(d => <span key={d} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{animationDelay:`${d}ms`}} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={submit} className="flex gap-2 shrink-0 pt-3">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about your course material..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-50 bg-white" />
            <button type="submit" disabled={isLoading || !input.trim()}
              className="w-12 h-12 bg-primary text-white rounded-xl text-xl font-bold hover:bg-opacity-90 disabled:opacity-40">
              {isLoading ? '…' : '↑'}
            </button>
          </form>
        </div>

        {/* Sources panel */}
        {sources.length > 0 && (
          <div className="w-52 shrink-0">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sources ({sources.length})</h3>
              <div className="space-y-2">
                {sources.map((s, i) => <SourceCard key={s.resource_id} source={s} index={i+1} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

---

## Step 5 — Wire into App

**`src/App.jsx`** — add route:
```jsx
import RAGChat from './pages/RAGChat'
// in <Routes>:
<Route path="/ask" element={<ProtectedRoute><RAGChat /></ProtectedRoute>} />
```

**`src/components/Sidebar.jsx`** — add nav entry (after Notices):
```js
{ to: '/ask', label: 'AI Assistant', icon: '🤖', roles: ['hod','faculty','student'] },
```

---

## Smoke Test

```
Backend
[ ] backfill runs: ResourceChunk.objects.count() > 0
[ ] POST /rag/ask/ streams SSE events (token → sources → done)
[ ] POST /rag/ask/ with semester filter → sources are all that semester
[ ] POST /rag/ask/ off-topic question → no_context event

Frontend
[ ] /ask loads with suggestion buttons
[ ] Submit question → typing dots → tokens stream in
[ ] Markdown renders (bold, lists)
[ ] Sources panel appears with relevance bars
[ ] Semester/subject filter narrows sources
[ ] "No material found" message on off-topic question
[ ] Clear button resets conversation
```

---

## Common Pitfalls

| Problem | Fix |
|---------|-----|
| Text appears all at once | Add `Cache-Control: no-cache` and `X-Accel-Buffering: no` to response |
| `import fitz` fails | Package is `pymupdf`, import name is `fitz` — both needed |
| No chunks after approval | Check Django logs for `[RAG]` output; extractor may have failed silently |
| Ollama first response slow (20–30s) | Normal cold start on CPU — typing indicator covers this |
| SSE returns 401 | Use `fetch()` with `Authorization` header directly, not Axios |
