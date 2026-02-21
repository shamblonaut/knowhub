import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import ChatMessage from '../components/ChatMessage'
import SourceCard from '../components/SourceCard'
import { useRAGStream } from '../hooks/useRAGStream'
import { getSemesters, getSubjects } from '../api/endpoints/subjects'
import { useAuth } from '../context/AuthContext'

const SUGGESTIONS = [
    'Explain BFS and DFS with examples',
    'What is process scheduling in OS?',
    'Summarise DBMS normalisation',
]

export default function RAGChat() {
    const { user } = useAuth()
    const [input, setInput] = useState('')
    const [semester, setSemester] = useState('')
    const [subjectId, setSubjectId] = useState('')
    const { messages, isLoading, ask, reset } = useRAGStream()
    const bottomRef = useRef(null)

    const { data: semData } = useQuery({ queryKey: ['semesters'], queryFn: getSemesters, enabled: user?.role !== 'student' })

    // For students, use their fixed semester for subjects
    const effectiveSemester = user?.role === 'student' ? user.semester : semester

    const { data: subData } = useQuery({
        queryKey: ['subjects', effectiveSemester], queryFn: () => getSubjects(effectiveSemester || null), enabled: !!effectiveSemester
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
                            {user?.role !== 'student' && (
                                <select value={semester} onChange={e => { setSemester(e.target.value); setSubjectId('') }}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-accent focus:outline-none">
                                    <option value="">All Semesters</option>
                                    {(semData?.semesters || []).map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            )}
                            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!effectiveSemester}
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
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center">🤖</div>
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1">
                                        {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
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
                                {sources.map((s, i) => <SourceCard key={s.resource_id} source={s} index={i + 1} />)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}
