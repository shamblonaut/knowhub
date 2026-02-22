export const askRAG = async (params, { onToken, onSources, onDone, onNoContext, onError }) => {

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
            } catch {
                // Ignore parse errors for malformed lines
            }
        }
    }
}
