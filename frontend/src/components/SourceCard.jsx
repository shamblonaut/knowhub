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
