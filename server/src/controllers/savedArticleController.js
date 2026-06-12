const SavedArticle = require("../models/SavedArticle");

function formatSavedArticle(savedArticle) {
  // Convert Mongo fields back into the article shape the React UI expects.
  return {
    id: savedArticle.articleId,
    title: savedArticle.title,
    excerpt: savedArticle.excerpt,
    source: savedArticle.source,
    author: savedArticle.author,
    imageUrl: savedArticle.imageUrl,
    url: savedArticle.url,
    publishedAt: savedArticle.publishedAt,
    category: savedArticle.category,
    summary: savedArticle.summary,
    keyTakeaway: savedArticle.keyTakeaway,
    framingSubject: savedArticle.framingSubject,
    framingLabel: savedArticle.framingLabel,
    framingScore: savedArticle.framingScore,
    framingExplanation: savedArticle.framingExplanation,
    framingStatus: savedArticle.framingStatus,
  };
}

async function getSavedArticles(req, res) {
  try {
    // req.user comes from requireAuth, so this query returns only this user's saves.
    const savedArticles = await SavedArticle.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      articles: savedArticles.map(formatSavedArticle),
    });
  } catch (error) {
    console.error("Get saved articles error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
}

async function saveArticle(req, res) {
  const { article } = req.body;

  if (!article?.id || !article?.title) {
    return res.status(400).json({
      success: false,
      error: "Article id and title are required",
    });
  }

  try {
    // Upsert makes the save operation idempotent if the user clicks twice quickly.
    await SavedArticle.findOneAndUpdate(
      { user: req.user._id, articleId: article.id },
      {
        user: req.user._id,
        articleId: article.id,
        title: article.title,
        excerpt: article.excerpt || "",
        source: article.source || "Unknown source",
        author: article.author || null,
        imageUrl: article.imageUrl || null,
        url: article.url || null,
        publishedAt: article.publishedAt || null,
        category: article.category || "news",
        summary: article.summary || "",
        keyTakeaway: article.keyTakeaway || "",
        // Persist the complete framing result so saved cards keep the same
        // subject, marker, label, status, and explanation.
        framingSubject: article.framingSubject || "",
        framingLabel: article.framingLabel || "",
        framingScore: Number.isFinite(article.framingScore)
          ? article.framingScore
          : null,
        framingExplanation: article.framingExplanation || "",
        framingStatus: ["complete", "insufficient", "unavailable"].includes(
          article.framingStatus
        )
          ? article.framingStatus
          : "insufficient",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return getSavedArticles(req, res);
  } catch (error) {
    console.error("Save article error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
}

async function deleteSavedArticle(req, res) {
  try {
    await SavedArticle.deleteOne({
      user: req.user._id,
      articleId: req.params.articleId,
    });

    return getSavedArticles(req, res);
  } catch (error) {
    console.error("Delete saved article error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server error. Please try again.",
    });
  }
}

module.exports = {
  getSavedArticles,
  saveArticle,
  deleteSavedArticle,
};
