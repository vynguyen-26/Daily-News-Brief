import { apiRequest } from "./api";

export async function getSavedArticlesForCurrentUser() {
    const data = await apiRequest("/api/saved-articles");

    return data.articles || [];
}

export async function saveArticleForCurrentUser(article) {
    const data = await apiRequest("/api/saved-articles", {
        method: "POST",
        body: JSON.stringify({ article }),
    });

    return data.articles || [];
}

export async function deleteSavedArticleForCurrentUser(articleId) {
    const data = await apiRequest(`/api/saved-articles/${encodeURIComponent(articleId)}`, {
        method: "DELETE",
    });

    return data.articles || [];
}
