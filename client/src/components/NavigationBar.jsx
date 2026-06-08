import {Link, useLocation} from "react-router-dom";
import {Sparkles, Bookmark} from "lucide-react";
import { useState } from "react";

export default function NavigationBar({ onSearch }) {
    const location = useLocation();
    const [query, setQuery] = useState("");
    
    const ishome = location.pathname === "/";
    const isSaved = location.pathname === "/saved";
    
    function handleSubmit(event) {
        event.preventDefault();

        const trimmedQuery = query.trim();

        if (!trimmedQuery || !onSearch) {
            return;
        }

        onSearch(trimmedQuery);
    }

    return (
        <nav className="bg-zinc-950 border-b border-zinc-800">
            <div className="w-full flex items-center justify-between py-4">
                {/* Logo and Title */}
                <Link to="/" className="text-white font-bold text-2xl">
                    Daily News Brief
                </Link>

                {/* Search Bar */}
                <form onSubmit={handleSubmit} className="flex flex-1 justify-center px-4">
                    <div className="relative h-[48px] w-full max-w-[550px]">
                        <input
                            type="text"
                            placeholder="Search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            className="h-full w-full rounded-[15px] border-[1.5px] border-gray-300 bg-white pl-14 pr-4
                                font-heebo text-lg text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-400"
                        />
                    </div>
                </form>

                {/* Navigation Links */}
                <div className="flex items-center gap-6">
                    <Link
                        to="/"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                            ${ishome ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
                    >
                        <Sparkles className="w-4 h-5" />
                        <span>Daily Brief</span>
                    </Link>
                    
                    <Link
                        to="/saved"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors 
                            ${isSaved ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
                    >
                        <Bookmark className="w-4 h-5" />
                        <span>Saved</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
