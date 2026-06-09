const { GoogleGenAI } = require("@google/genai");
const ArticleAnalysis = require("../models/ArticleAnalysis");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DEFAULT_BRIEF = {
  summary: "",
  keyTakeaway: "",
  bias: "Unknown",
};
const BIAS_LABELS = new Set(["Left", "Center", "Right", "Neutral", "Unknown"]);
const BIAS_LABEL_MAP = {
  left: "Left",
  center: "Center",
  right: "Right",
  neutral: "Neutral",
  unclear: "Unknown",
  unknown: "Unknown",
};

let client;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from server environment");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return client;
}

function extractJson(text) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  if (fencedMatch) {
    return fencedMatch[1];
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function normalizeBiasLabel(label) {
  if (typeof label !== "string") {
    return "Unknown";
  }

  const mappedLabel = BIAS_LABEL_MAP[label.trim().toLowerCase()];

  return BIAS_LABELS.has(mappedLabel) ? mappedLabel : "Unknown";
}

function limitText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || "";
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function createFallbackSummary(article) {
  const excerpt = article.excerpt?.trim();
  const title = article.title?.trim();

  if (excerpt) {
    // Summary fallback answers "what happened" and can use the article excerpt.
    return limitText(excerpt, 280);
  }

  if (title) {
    return `This article reports on ${title}.`;
  }

  return "No summary is available for this article yet.";
}

function createFallbackKeyTakeaway(article, summary = "") {
  const excerpt = article.excerpt?.trim();
  const title = article.title?.trim();
  const base = excerpt || summary || title;

  if (base) {
    const takeawayBase =
      base.match(/\b(?:while|because|as|after|amid|if|unless)\b\s+(.+)/i)?.[1] ||
      base;

    // Prefer article body text over the headline so fallback takeaways do not
    // simply repeat the article title when Gemini is unavailable.
    return limitText(takeawayBase, 160);
  }

  return "The most important takeaway is not available for this article yet.";
}

function normalizeBrief(brief, article) {
  const summary =
    typeof brief.summary === "string" && brief.summary.trim()
      ? brief.summary.trim()
      : createFallbackSummary(article);
  const keyTakeaway =
    typeof brief.keyTakeaway === "string" && brief.keyTakeaway.trim()
      ? brief.keyTakeaway.trim()
      : createFallbackKeyTakeaway(article, summary);
  const rawBias =
    typeof brief.bias === "object"
      ? brief.bias?.label?.trim()
      : brief.bias?.trim?.() || "";
  const bias = normalizeBiasLabel(rawBias);
  const biasExplanation =
    typeof brief.bias === "object" && typeof brief.bias.explanation === "string"
      ? brief.bias.explanation.trim()
      : "";

  return {
    summary,
    keyTakeaway,
    // Neutral means no evident leaning; Unknown means there was not enough evidence.
    bias,
    biasExplanation,
  };
}

function formatCachedAnalysis(analysis) {
  return {
    summary: analysis.summary,
    keyTakeaway: analysis.keyTakeaway,
    bias: analysis.biasLabel,
    biasExplanation: analysis.biasExplanation,
  };
}

function buildAnalysisCacheDocument(article, brief) {
  return {
    articleId: article.id,
    title: article.title || "",
    url: article.url || null,
    source: article.source || "Unknown source",
    summary: brief.summary,
    keyTakeaway: brief.keyTakeaway,
    biasLabel: brief.bias,
    biasExplanation: brief.biasExplanation || "",
    model: GEMINI_MODEL,
  };
}

function buildArticleBriefPrompt(article) {
  return `
Create a short daily news brief for this article.

Return JSON only with this exact shape:
{
  "summary": "1-2 neutral sentences explaining what happened",
  "keyTakeaways": "1 sentence stating the single most important thing the reader should remember",
  "bias": {
    "label": "left | center | right | neutral | unclear",
    "explanation": "short explanation"
  }
}

The summary answers "what happened." The keyTakeaways field answers "what should the reader remember."
For bias, judge the article's political or editorial leaning from the supplied text only.
Use "Neutral" when the article appears balanced or factual with no clear leaning.
Use "unclear" only if the text is too short or does not provide enough evidence.

Title: ${article.title || ""}
Source: ${article.source || "Unknown source"}
Description: ${article.excerpt || ""}
URL: ${article.url || ""}
`;
}

async function generateArticleBrief(article) {
  if (!article.id) {
    return normalizeBrief(DEFAULT_BRIEF, article);
  }

  const cachedAnalysis = await ArticleAnalysis.findOne({ articleId: article.id });

  if (cachedAnalysis) {
    // Reuse stored Gemini analysis so refreshes and reselections do not spend API quota.
    return formatCachedAnalysis(cachedAnalysis);
  }

  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: buildArticleBriefPrompt(article),
      config: {
        responseMimeType: "application/json",
      },
    });
    const parsed = JSON.parse(extractJson(response.text || ""));
    const normalizedInput = {
      ...parsed,
      keyTakeaway: parsed.keyTakeaway || parsed.keyTakeaways,
      bias: parsed.bias,
    };
    const brief = normalizeBrief(normalizedInput, article);

    await ArticleAnalysis.findOneAndUpdate(
      { articleId: article.id },
      buildAnalysisCacheDocument(article, brief),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return brief;
  } catch (error) {
    console.error("Gemini article brief failed:", error.message);
    // Always return usable, distinct fields so the UI does not show duplicate placeholders.
    return normalizeBrief(DEFAULT_BRIEF, article);
  }
}

module.exports = {
  generateArticleBrief,
};
