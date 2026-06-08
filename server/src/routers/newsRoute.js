const express = require("express");
const { getHeadlines, searchArticles } = require("../controllers/newsController");

const router = express.Router();

router.get("/headlines", getHeadlines);
router.get("/search", searchArticles);

module.exports = router;
