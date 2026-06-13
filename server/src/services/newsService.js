const { generateArticleBrief } = require("./aiService");

const NEWS_API_BASE_URL = "https://newsapi.org/v2";

function formatArticle(article, index) {
  const description =
    typeof article.description === "string" ? article.description.trim() : "";
  const content =
    typeof article.content === "string" &&
    !["false", "[removed]"].includes(article.content.trim().toLowerCase())
      ? article.content.trim()
      : "";

  return {
    id: article.url || String(index),
    title: article.title,
    // Keep both NewsAPI text fields for analysis instead of discarding content
    // whenever a shorter description is present.
    excerpt: description || content,
    description,
    content,
    source: article.source?.name || "Unknown source",
    author: article.author || null,
    imageUrl: article.urlToImage || null,
    url: article.url,
    publishedAt: article.publishedAt,
    category: "news",
  };
}

function shouldIncludeAi(value) {
  return value !== false && value !== "false";
}

async function enrichArticlesWithBriefs(articles) {
  // generateArticleBrief applies a process-wide concurrency limit because the
  // homepage also creates separate simultaneous category requests.
  const enrichedArticles = await Promise.all(
    articles.map(async (article) => ({
      ...article,
      ...(await generateArticleBrief(article)),
    }))
  );

  return enrichedArticles;
}

async function fetchFromNewsApi(endpoint, params, options = {}) {
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

  const articles = data.articles.map(formatArticle);
  const enrichedArticles = options.includeAi
    ? await enrichArticlesWithBriefs(articles)
    : articles;

  return {
    totalResults: data.totalResults,
    articles: enrichedArticles,
  };
}

async function getHeadlines({
  country = "us",
  category,
  pageSize = "20",
  includeAi = "true",
}) {
  return fetchFromNewsApi(
    "/top-headlines",
    {
      country,
      category,
      pageSize,
    },
    { includeAi: shouldIncludeAi(includeAi) }
  );
}

async function searchArticles({
  q,
  language = "en",
  sortBy = "publishedAt",
  pageSize = "20",
  from,
  to,
  includeAi = "true",
}) {
  return fetchFromNewsApi(
    "/everything",
    {
      q,
      language,
      sortBy,
      pageSize,
      from,
      to,
    },
    { includeAi: shouldIncludeAi(includeAi) }
  );
}

async function analyzeArticle(article) {
  // Search results are returned without AI so the list can render immediately.
  // Enrich only the article the reader chooses instead of blocking on every hit.
  return {
    ...article,
    ...(await generateArticleBrief(article)),
  };
}

module.exports = {
  analyzeArticle,
  getHeadlines,
  searchArticles,
};
