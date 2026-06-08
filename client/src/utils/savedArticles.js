export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
}

export function isCurrentUserAuthenticated() {
    const token = localStorage.getItem("token");
    const user = getCurrentUser();

    // A valid saved-article session needs both auth proof and a user id,
    // because saved articles are stored under that specific user.
    return Boolean(token && user?.id);
}

function getSavedArticlesKey() {
    const user = getCurrentUser();

    return user?.id ? `savedArticles:${user.id}` : null;
}

export function getSavedArticlesForCurrentUser() {
    const key = getSavedArticlesKey();

    if (!key) {
        return [];
    }

    // Saved articles are scoped to the logged-in user instead of one shared list.
    return JSON.parse(localStorage.getItem(key)) || [];
}

export function isArticleSavedForCurrentUser(articleId) {
    return getSavedArticlesForCurrentUser().some((article) => article.id === articleId);
}

export function toggleSavedArticleForCurrentUser(article) {
    const key = getSavedArticlesKey();

    if (!key) {
        throw new Error("User must be logged in before saving articles");
    }

    const currentSaved = getSavedArticlesForCurrentUser();
    const isSaved = currentSaved.some((savedArticle) => savedArticle.id === article.id);
    const nextSaved = isSaved
        ? currentSaved.filter((savedArticle) => savedArticle.id !== article.id)
        : [...currentSaved, article];

    localStorage.setItem(key, JSON.stringify(nextSaved));

    return nextSaved;
}
