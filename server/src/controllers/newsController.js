const newsService = require("../services/newsService");

async function getHeadlines(req, res) {
  try {
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

    const news = await newsService.searchArticles(req.query);

    res.json(news);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  getHeadlines,
  searchArticles,
};
