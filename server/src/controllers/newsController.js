const newsService = require("../services/newsService");

async function getHeadlines(req, res) {
  try {
    // newsService adds summary, takeaway, and article-framing fields by default.
    const news = await newsService.getHeadlines(req.query);

    res.json(news);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function searchArticles(req, res) {
  try {
    if (!req.query.q) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    // Callers can skip AI enrichment to render result metadata immediately.
    // The selected article is analyzed separately through the endpoint below.
    const news = await newsService.searchArticles(req.query);

    res.json(news);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

async function analyzeArticle(req, res) {
  try {
    const article = req.body?.article;

    if (!article || typeof article !== "object" || !article.title) {
      return res.status(400).json({
        message: "Article data with a title is required",
      });
    }

    const analyzedArticle = await newsService.analyzeArticle(article);

    res.json({
      article: analyzedArticle,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  analyzeArticle,
  getHeadlines,
  searchArticles,
};
