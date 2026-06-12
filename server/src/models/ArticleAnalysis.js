const mongoose = require("mongoose");

const articleAnalysisSchema = new mongoose.Schema(
  {
    // articleId is usually the article URL from NewsAPI, so it can identify
    // the same article across refreshes, searches, and different users.
    articleId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "" },
    url: { type: String, default: null },
    source: { type: String, default: "Unknown source" },
    summary: { type: String, required: true },
    keyTakeaway: { type: String, required: true },
    // Legacy bias fields remain readable while cached records transition to framing.
    biasLabel: { type: String, default: "Unknown" },
    biasExplanation: { type: String, default: "" },
    framingSubject: { type: String, default: "" },
    framingLabel: { type: String, default: "" },
    framingScore: { type: Number, default: null, min: -1, max: 1 },
    framingExplanation: { type: String, default: "" },
    framingStatus: {
      type: String,
      enum: ["complete", "insufficient"],
      default: "insufficient",
    },
    model: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ArticleAnalysis ||
  mongoose.model("ArticleAnalysis", articleAnalysisSchema);
