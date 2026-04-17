import {Link, useLocation} from "react-router-dom";
import {Sparkles, Bookmark} from "lucide-react";

export default function NavigationBar() {
    const location = useLocation();
    
    const ishome = location.pathname === "/home";
    const isSaved = location.pathname === "/saved";
    
    return (
        <nav className="bg-zinc-950 border-b border-zinc-800">
            <div className="w-full flex items-center justify-between py-4">
                {/* Logo and Title */}
                <Link to="/home" className="text-white font-bold text-2xl">
                    Daily News Brief
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-6">
                    <Link
                        to="/home"
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