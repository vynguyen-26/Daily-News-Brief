const NEWS_API_BASE_URL = "https://newsapi.org/v2";

function formatArticle(article, index) {
  return {
    id: article.url || String(index),
    title: article.title,
    excerpt: article.description || article.content || "",
    source: article.source?.name || "Unknown source",
    author: article.author || null,
    imageUrl: article.urlToImage || null,
    url: article.url,
    publishedAt: article.publishedAt,
    category: "news",
  };
}

async function fetchFromNewsApi(endpoint, params) {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    throw new Error("NEWS_API_KEY is missing from server environment");
  }

  const url = new URL(`${NEWS_API_BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch news");
  }

  return {
    totalResults: data.totalResults,
    articles: data.articles.map(formatArticle),
  };
}

async function getHeadlines({ country = "us", category, pageSize = "20" }) {
  return fetchFromNewsApi("/top-headlines", {
    country,
    category,
    pageSize,
  });
}

async function searchArticles({
  q,
  language = "en",
  sortBy = "publishedAt",
  pageSize = "20",
  from,
  to,
}) {
  return fetchFromNewsApi("/everything", {
    q,
    language,
    sortBy,
    pageSize,
    from,
    to,
  });
}

module.exports = {
  getHeadlines,
  searchArticles,
};
