const express = require("express");
const {
  analyzeArticle,
  getHeadlines,
  searchArticles,
} = require("../controllers/newsController");

const router = express.Router();

router.get("/headlines", getHeadlines);
router.get("/search", searchArticles);
router.post("/analyze", analyzeArticle);

module.exports = router;
