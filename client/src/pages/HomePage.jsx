import NavigationBar from "../components/NavigationBar";
import CategorySidebar from "../components/CategorySidebar";
import ArticleBriefCard from "../components/ArticleBriefCard";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    deleteSavedArticleForCurrentUser,
    getSavedArticlesForCurrentUser,
    saveArticleForCurrentUser,
} from "../utils/savedArticles";
import { useAuth } from "../context/useAuth";

const categories = [
  { id: 1, name: "All", value: "all" },
  { id: 2, name: "Technology", value: "technology" },
  { id: 3, name: "Science", value: "science" },
  { id: 4, name: "Business", value: "business" },
  { id: 5, name: "World", value: "world" },
  { id: 6, name: "Politics", value: "politics" },
  { id: 7, name: "Health", value: "health" },
  { id: 8, name: "Entertainment", value: "entertainment" },
  { id: 9, name: "Sports", value: "sports" },
  { id: 10, name: "Environment", value: "environment" },
  { id: 11, name: "Education", value: "education" },
  { id: 12, name: "Economy", value: "economy" },
  { id: 13, name: "Cybersecurity", value: "cybersecurity" },
  { id: 14, name: "Space", value: "space" },
  { id: 15, name: "Energy", value: "energy" },
];

const newsApiHeadlineCategories = [
    "business",
    "entertainment",
    "health",
    "science",
    "sports",
    "technology",
];

// These categories create the automatic "top 5 stories" homepage view.
const defaultHomepageCategories = [
    "business",
    "technology",
    "science",
    "health",
    "sports",
];

// Shared category fetcher used by both the default homepage brief and manual
// category picks, so both flows shape articles the same way.
async function requestCategoryArticle(categoryValue) {
    const today = new Date().toISOString().split("T")[0];
    const isHeadlineCategory = newsApiHeadlineCategories.includes(categoryValue);
    const endpoint = isHeadlineCategory
        ? `/api/news/headlines?category=${encodeURIComponent(categoryValue)}&pageSize=1`
        : `/api/news/search?q=${encodeURIComponent(categoryValue)}&from=${today}&to=${today}&sortBy=popularity&pageSize=1`;

    const res = await fetch(endpoint);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Failed to fetch category article");
    }

    const article = data.articles?.[0];

    if (!article) {
        throw new Error(`No new article found for "${categoryValue}" category today`);
    }

    return {
        ...article,
        category: categoryValue,
    };
}

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categoryArticles, setCategoryArticles] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [savedArticleIds, setSavedArticleIds] = useState([]);
    // Keeps async default-load results from overwriting a user's manual choice.
    const showingDefaultBriefRef = useRef(true);
    const displayedArticles = selectedArticle ? [selectedArticle] : categoryArticles;

    useEffect(() => {
        async function loadDefaultBrief() {
            setLoading(true);
            setError("");

            try {
                // Load the first homepage view automatically, with the matching
                // category buttons highlighted as the default daily brief.
                const articles = await Promise.all(
                    defaultHomepageCategories.map(async (category) => {
                        try {
                            return await requestCategoryArticle(category);
                        } catch {
                            return null;
                        }
                    })
                );
                const availableArticles = articles.filter(Boolean);

                if (availableArticles.length === 0) {
                    throw new Error("No top stories found for today");
                }

                if (!showingDefaultBriefRef.current) {
                    // The reader already interacted with the page, so ignore
                    // the automatic brief response if it finishes late.
                    return;
                }

                setSelectedCategories(availableArticles.map((article) => article.category));
                setCategoryArticles(availableArticles);
            } catch (err) {
                if (showingDefaultBriefRef.current) {
                    setError(err.message);
                }
            } finally {
                if (showingDefaultBriefRef.current) {
                    setLoading(false);
                }
            }
        }

        loadDefaultBrief();
    }, []);

    useEffect(() => {
        async function loadSavedArticles() {
            if (!isAuthenticated) {
                setSavedArticleIds([]);
                return;
            }

            try {
                const savedArticles = await getSavedArticlesForCurrentUser();
                setSavedArticleIds(savedArticles.map((article) => article.id));
            } catch {
                setSavedArticleIds([]);
            }
        }

        loadSavedArticles();
    }, [isAuthenticated]);

    async function toggleCategory(categoryValue) {
        // After the default brief loads, category buttons behave like normal
        // selections: clicking a highlighted one removes only that category.
        showingDefaultBriefRef.current = false;

        if (selectedCategories.includes(categoryValue)) {
            // remove category
            setSelectedCategories(selectedCategories.filter((value) => value !== categoryValue));
            setCategoryArticles((articles) =>
                articles.filter((article) => article.category !== categoryValue)
            );
            return
        }

        if (selectedCategories.length < 5) {
            // add category
            setSelectedCategories([...selectedCategories, categoryValue]);
            const article = await fetchCategoryArticle(categoryValue);

            if (article) {
                setCategoryArticles((articles) => [...articles, article]);
            }
        }
    }

    async function fetchCategoryArticle(categoryValue) {
        // Manual category fetches reset search/selected article state before
        // replacing or adding to the visible brief.
        setLoading(true);
        setError("");
        setSelectedArticle(null);
        setSearchResults([]);

        try {
            return await requestCategoryArticle(categoryValue);
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function handleSearch(query) {
        setLoading(true);
        setError("");
        showingDefaultBriefRef.current = false;
        setSelectedArticle(null);
        setCategoryArticles([]);
        setSelectedCategories([]);
        setSearchResults([]);

        try {
            const res = await fetch(`/api/news/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to search articles");
            }

            setSearchResults(data.articles || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSelectArticle(article) {
        showingDefaultBriefRef.current = false;
        setSelectedArticle(article);
        setCategoryArticles([]);
        setSelectedCategories([]);
        setSearchResults([]);
    }

    function isArticleSaved(articleId) {
        return savedArticleIds.includes(articleId);
    }

    async function toggleSaveArticle(article) {
        if (!isAuthenticated) {
            // Match the existing save flow: guests can read summaries, but saving
            // sends them to login before any article is written to saved storage.
            navigate("/login", {
                state: {
                    from: location.pathname,
                },
            });
            return;
        }

        const nextSaved = isArticleSaved(article.id)
            ? await deleteSavedArticleForCurrentUser(article.id)
            : await saveArticleForCurrentUser(article);

        setSavedArticleIds(nextSaved.map((savedArticle) => savedArticle.id));
    }
    
    return (
        <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-zinc-950 border-b border-zinc-800">
            <NavigationBar onSearch={handleSearch} />

            <div className="flex">
                <CategorySidebar
                    categories={categories}
                    selectedCategories={selectedCategories}
                    toggleCategory={toggleCategory}
                />
                <main className="flex-1 p-6">
                    {loading && (
                        <p className="text-zinc-400">Loading articles...</p>
                    )}

                    {error && (
                        <p className="text-red-400">{error}</p>
                    )}

                    {searchResults.length > 0 && displayedArticles.length === 0 && (
                        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <h2 className="text-2xl font-semibold !text-white mb-6">
                                Search Results
                            </h2>

                            <div className="space-y-3">
                                {searchResults.map((article) => (
                                    <button
                                        key={article.id}
                                        onClick={() => handleSelectArticle(article)}
                                        className="w-full text-left bg-zinc-800 border border-zinc-700 rounded-xl p-4 hover:border-blue-500 transition-colors"
                                    >
                                        <p className="text-white font-medium mb-1">
                                            {article.title}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {displayedArticles.length > 0 && (
                        // Each article now owns one complete analysis row instead of
                        // being split across three unrelated page-level panels.
                        <div className="space-y-6">
                            {displayedArticles.map((article) => (
                                <ArticleBriefCard
                                    key={`${article.category}-${article.id}`}
                                    article={article}
                                    isSaved={isArticleSaved(article.id)}
                                    onToggleSave={toggleSaveArticle}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div> 
        </div>
    );
}
