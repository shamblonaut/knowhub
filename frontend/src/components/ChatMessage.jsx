import ReactMarkdown from 'react-markdown';

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
                                [{i + 1}] {s.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
