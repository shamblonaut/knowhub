import { useState, useCallback, useRef } from 'react'
import { askRAG } from '../api/endpoints/rag'

export function useRAGStream() {
    const [messages, setMessages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const buffer = useRef('')

    const patchLast = (patch) =>
        setMessages(prev => {
            const m = [...prev]
            if (m.length === 0) return m
            m[m.length - 1] = { ...m[m.length - 1], ...patch }
            return m
        })

    const ask = useCallback(async (params) => {
        if (isLoading || !params.question?.trim()) return

        setMessages(prev => [...prev,
        { role: 'user', content: params.question, sources: [] },
        { role: 'assistant', content: '', sources: [], streaming: true },
        ])
        setIsLoading(true)
        buffer.current = ''

        await askRAG(params, {
            onToken: (t) => { buffer.current += t; setIsLoading(false); patchLast({ content: buffer.current }) },
            onSources: (s) => patchLast({ sources: s }),
            onDone: () => { setIsLoading(false); patchLast({ streaming: false }) },
            onNoContext: () => { setIsLoading(false); patchLast({ content: "No relevant material found. Try different filters or rephrase.", streaming: false }) },
            onError: (m) => { setIsLoading(false); patchLast({ content: `Error: ${m}`, streaming: false, error: true }) },
        })
    }, [isLoading])

    const reset = () => { setMessages([]); setIsLoading(false); buffer.current = '' }

    return { messages, isLoading, ask, reset }
}
