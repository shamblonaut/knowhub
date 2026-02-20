import { useState, useEffect } from "react";

export default function SearchBar({ onSearch }) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => onSearch(value), 300);
        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Search resources by title, subject, or keyword..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent focus:outline-none"
            />
            {value && (
                <button
                    onClick={() => setValue("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
