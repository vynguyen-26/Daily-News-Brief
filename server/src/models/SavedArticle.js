const mongoose = require("mongoose");

const savedArticleSchema = new mongoose.Schema(
  {
    // Every saved article belongs to one MongoDB user account.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    articleId: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: "" },
    source: { type: String, default: "Unknown source" },
    author: { type: String, default: null },
    imageUrl: { type: String, default: null },
    url: { type: String, default: null },
    publishedAt: { type: Date, default: null },
    category: { type: String, default: "news" },
    summary: { type: String, default: "" },
    keyTakeaway: { type: String, default: "" },
    bias: { type: String, default: "" },
    biasExplanation: { type: String, default: "" },
    framingSubject: { type: String, default: "" },
    framingLabel: { type: String, default: "" },
    framingScore: { type: Number, default: null, min: -1, max: 1 },
    framingExplanation: { type: String, default: "" },
    framingStatus: {
      type: String,
      enum: ["complete", "insufficient", "unavailable"],
      default: "insufficient",
    },
  },
  { timestamps: true }
);

// One user can save an article only once, while other users can save it too.
savedArticleSchema.index({ user: 1, articleId: 1 }, { unique: true });

module.exports =
  mongoose.models.SavedArticle ||
  mongoose.model("SavedArticle", savedArticleSchema);
