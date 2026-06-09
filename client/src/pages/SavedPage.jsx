import {useEffect, useState} from "react";
import {Bookmark} from "lucide-react";
import NewsCard from "../components/NewsCard";
import NavigationBar from "../components/NavigationBar";
import {
    deleteSavedArticleForCurrentUser,
    getSavedArticlesForCurrentUser,
} from "../utils/savedArticles";
import { useAuth } from "../context/useAuth";

export default function SavedPage() {
    const { isAuthenticated } = useAuth();
    const [savedArticles, setSavedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSavedArticles() {
            setLoading(true);
            setError("");

            try {
                const articles = await getSavedArticlesForCurrentUser();
                setSavedArticles(articles);
            } catch (err) {
                setError(err.message || "Failed to load saved articles");
            } finally {
                setLoading(false);
            }
        }

        loadSavedArticles();
    }, []);

    async function removeSavedArticle(article) {
        const articles = await deleteSavedArticleForCurrentUser(article.id);
        setSavedArticles(articles);
    }

    return (
        <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-zinc-950 border-b border-zinc-800">
            <NavigationBar />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Bookmark className="w-8 h-8 text-blue-500" />
                    <h1 className="!text-white">Saved Articles</h1>
                </div>
                <p className="text-zinc-400 flex items-center mb-2">Your bookmarked articles for later reading</p>
            </div>

            {loading && <p className="text-zinc-400">Loading saved articles...</p>}
            {error && <p className="text-red-400">{error}</p>}

            {/* Saved Articles Grid */}
            {!loading && !error && savedArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedArticles.map(article => (
                        <NewsCard
                            key={article.id}
                            article={article}
                            isAuthenticated={isAuthenticated}
                            isSaved
                            onToggleSave={removeSavedArticle}
                        />
                    ))}
                </div>
            ) : !loading && !error ? (
                <div className="text-center py-24">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bookmark className="w-10 h-10 text-zinc-700" />
                    </div>
                    <h2 className="text-2xl font-semibold !text-white mb-2">No saved articles yet</h2>
                    <p className="text-zinc-500 mb-6">
                        Start bookmarking articles you want to read later
                    </p>
                </div>
            ) : null}
        </div>
    );
}
