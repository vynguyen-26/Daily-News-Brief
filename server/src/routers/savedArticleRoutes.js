const express = require("express");
const {
  deleteSavedArticle,
  getSavedArticles,
  saveArticle,
} = require("../controllers/savedArticleController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getSavedArticles);
router.post("/", saveArticle);
router.delete("/:articleId", deleteSavedArticle);

module.exports = router;
