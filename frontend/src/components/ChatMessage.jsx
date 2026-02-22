import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // using light theme for standard feel

const Citation = ({ index, onClick }) => {
    return (
        <button 
            onClick={() => onClick(index)}
            className="text-accent font-bold hover:underline mx-0.5 focus:outline-none"
        >
            [{index}]
        </button>
    )
}

export default function ChatMessage({ role, content, sources = [], streaming }) {
    const isUser = role === 'user'
    const [showSources, setShowSources] = React.useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(content)
    }

    return (
        <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm
        ${isUser ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
                {isUser ? '👤' : '🤖'}
            </div>
            <div className={`max-w-[85%] flex flex-col gap-2 ${isUser ? 'items-end' : ''}`}>
                <div className={`relative group/msg rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser ? 'bg-primary text-white rounded-tr-sm shadow-md' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                    
                    {!isUser && content && (
                        <button 
                            onClick={copyToClipboard}
                            className="absolute -right-10 top-0 opacity-0 group-hover/msg:opacity-100 p-2 text-gray-400 hover:text-accent transition-all hover:scale-110"
                            title="Copy message"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 002-2h4.586a1 1 0 011 .707l3.707 3.707a1 1 0 01.293.707V17a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        </button>
                    )}

                    {isUser
                        ? <p>{content}</p>
                        : <div className="max-w-none prose prose-sm text-gray-800 break-words
                                           prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent
                                           prose-code:before:content-none prose-code:after:content-none
                                           prose-code:bg-gray-100 prose-code:text-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md
                                           prose-headings:text-primary prose-a:text-accent">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                                components={{
                                    p: ({ children }) => {
                                        const parts = React.Children.toArray(children).flatMap((child) => {
                                            if (typeof child !== 'string') return child
                                            const citationRegex = /\[(\d+)\]/g
                                            const result = []
                                            let lastIndex = 0
                                            let match
                                            while ((match = citationRegex.exec(child)) !== null) {
                                                if (match.index > lastIndex) {
                                                    result.push(child.substring(lastIndex, match.index))
                                                }
                                                result.push(<Citation key={match.index} index={match[1]} onClick={() => setShowSources(true)} />)
                                                lastIndex = citationRegex.lastIndex
                                            }
                                            if (lastIndex < child.length) {
                                                result.push(child.substring(lastIndex))
                                            }
                                            return result
                                        })
                                        return <p>{parts}</p>
                                    }
                                }}
                            >
                                {content || ''}
                            </ReactMarkdown>
                            {streaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm mt-1 ml-1 align-middle" />}
                        </div>
                    }

                    {!isUser && sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <button 
                                onClick={() => setShowSources(!showSources)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-accent uppercase tracking-widest transition-colors"
                            >
                                <svg className={`w-3 h-3 transition-transform ${showSources ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                                {showSources ? 'Hide Citations' : 'View Full Citations'}
                            </button>
                            
                            {showSources && (
                                <div className="mt-3 space-y-3">
                                    {sources.map((s, i) => (
                                        <div key={`${s.resource_id}-${i}`} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className="text-[10px] font-bold text-accent">[{s.index}] SOURCE</span>
                                                <span className="text-[10px] text-gray-400">{s.code}{s.page ? ` • p.${s.page}` : ''}</span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-gray-700 mb-1 line-clamp-1">{s.title}</p>
                                            <p className="text-[11px] text-gray-500 leading-relaxed italic">"{s.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
