import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // using light theme for standard feel

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
                        : <div className="max-w-none prose prose-sm text-gray-800 break-words dark:prose-invert
                                           prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent
                                           prose-code:before:content-none prose-code:after:content-none
                                           prose-code:bg-gray-100 prose-code:text-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md
                                           prose-headings:text-primary prose-a:text-accent">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                            >
                                {content || ''}
                            </ReactMarkdown>
                            {streaming && <span className="inline-block w-2 h-4 bg-accent animate-pulse rounded-sm mt-1 ml-1 align-middle" />}
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
