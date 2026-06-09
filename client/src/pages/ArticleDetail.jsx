import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import { getSavedArticlesForCurrentUser } from "../utils/savedArticles";

export default function ArticleDetail() {
    const { articleId } = useParams();
    const location = useLocation();
    const decodedArticleId = decodeURIComponent(articleId);
    const backPath = location.state?.from || "/saved";
    const [article, setArticle] = useState(location.state?.article || null);
    const [loading, setLoading] = useState(!location.state?.article);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadArticleFromSavedList() {
            if (location.state?.article) {
                return;
            }

            setLoading(true);
            setError("");

            try {
                const savedArticles = await getSavedArticlesForCurrentUser();
                const savedArticle = savedArticles.find(
                    (item) => item.id === decodedArticleId
                );

                setArticle(savedArticle || null);
            } catch (err) {
                setError(err.message || "Failed to load saved article");
            } finally {
                setLoading(false);
            }
        }

        loadArticleFromSavedList();
    }, [decodedArticleId, location.state?.article]);

    return (
        <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-zinc-950 border-b border-zinc-800">
            <NavigationBar />

            <main className="max-w-6xl mx-auto py-8">
                <Link
                    to={backPath}
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Go Back</span>
                </Link>

                {loading ? (
                    <p className="text-zinc-400">Loading article...</p>
                ) : error ? (
                    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h1 className="text-2xl font-semibold !text-white mb-2">
                            Article could not be loaded
                        </h1>
                        <p className="text-zinc-400">{error}</p>
                    </section>
                ) : !article ? (
                    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h1 className="text-2xl font-semibold !text-white mb-2">
                            Article not found
                        </h1>
                        <p className="text-zinc-400">
                            This saved article is no longer available in your saved list.
                        </p>
                    </section>
                ) : (
                    <>
                        <header className="mb-6">
                            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-2">
                                {article.category}
                            </p>
                            <h1 className="!text-white text-3xl font-semibold leading-tight">
                                {article.title}
                            </h1>
                        </header>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[360px]">
                                <h2 className="text-2xl font-semibold !text-white mb-6">
                                    Summary
                                </h2>
                                <p className="text-zinc-200 leading-7">
                                    {article.summary || article.excerpt || "No summary available yet."}
                                </p>
                            </section>

                            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[360px]">
                                <h2 className="text-2xl font-semibold !text-white mb-6">
                                    Key Takeaway
                                </h2>
                                <p className="text-zinc-200 leading-7">
                                    {article.keyTakeaway || "AI key takeaway will appear here later."}
                                </p>
                            </section>

                            <aside className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 min-h-[360px]">
                                <h2 className="text-2xl font-semibold !text-white mb-6">
                                    Bias Indicator
                                </h2>
                                <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-500 via-zinc-500 to-red-500 mb-4" />
                                <p className="text-white font-medium">
                                    {article.bias || "Not analyzed yet"}
                                </p>
                            </aside>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
