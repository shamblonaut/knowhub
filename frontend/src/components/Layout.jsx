import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-white flex items-center px-4 lg:hidden z-40 shadow-md">
                <button
                    onClick={openSidebar}
                    className="p-2 -ml-2 text-2xl"
                    aria-label="Open menu"
                >
                    ☰
                </button>
                <div className="ml-3 font-bold text-lg">📚 Corpus</div>
                {localStorage.getItem("demo_mode") === "true" && (
                    <span className="ml-2 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded font-bold tracking-wider">
                        DEMO MODE
                    </span>
                )}
            </header>

            {/* Sidebar with mobile drawer functionality */}
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-16 lg:pt-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {children}
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}
        </div>
    );
}
