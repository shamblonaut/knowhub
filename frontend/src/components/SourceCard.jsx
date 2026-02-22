export default function SourceCard({ source, index }) {
    const pct = Math.round(source.score * 100)
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:border-accent transition-colors group">
            <div className="flex justify-between mb-1 text-[10px] uppercase tracking-wider font-semibold">
                <span className="text-accent">[{index}] Source</span>
                <span className="text-gray-400">{source.code}{source.page ? ` • p.${source.page}` : ''}</span>
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-accent transition-colors">{source.title}</p>
            <p className="text-[11px] text-gray-500 line-clamp-3 mb-3 leading-relaxed italic border-l-2 border-gray-100 pl-2">
                "{source.text}"
            </p>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-medium text-gray-400">{pct}% match</span>
            </div>
        </div>
    )
}
