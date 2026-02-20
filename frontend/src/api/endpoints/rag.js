import { USE_MOCK } from '../config'

const MOCK_TOKENS = [
    'BFS ', '(Breadth-First Search) ', 'visits all neighbors ', 'at the current depth ',
    'before going deeper. ', 'It uses a queue [1].\n\n',
    'DFS ', '(Depth-First Search) ', 'explores as far ', 'down a branch ', 'before backtracking [1].',
]
const MOCK_SOURCES = [{ resource_id: 'r1', title: 'Unit 3 - Trees & Graphs', code: 'BCA401', score: 0.91 }]

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

    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/v1/rag/ask/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params),
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError?.(errorData.error || 'Failed to connect to RAG API');
        return;
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

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
                if (e.type === 'token') onToken(e.content)
                if (e.type === 'sources') onSources(e.sources)
                if (e.type === 'done') onDone()
                if (e.type === 'no_context') onNoContext?.()
                if (e.type === 'error') onError?.(e.message)
            } catch (_) { }
        }
    }
}
