const { GoogleGenAI } = require("@google/genai");
const ArticleAnalysis = require("../models/ArticleAnalysis");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_CONCURRENT_ANALYSES = 2;
const MAX_GEMINI_ATTEMPTS = 4;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MIN_ARTICLE_TEXT_WORDS = 40;
const BAD_CONTENT_PATTERNS = new Set([
  "MENU",
  "ADVERTISEMENT",
  "SUBSCRIBE",
  "SIGN IN",
  "FALSE",
  "[REMOVED]",
]);
const EVALUATIVE_HEADLINE_PATTERNS = [
  /\b(?:best|worst|better|worse|prefer|recommended|disappointing|impressive)\b/i,
  /\b(?:fails?|failed|failure|problem|concern|criticized|praised)\b/i,
  /\b(?:must|should|refuse|unfortunately|surprisingly)\b/i,
];
const DEFAULT_BRIEF = {
  summary: "",
  keyTakeaway: "",
  framing: {
    subject: "",
    score: null,
    explanation: "",
  },
};

let client;
let activeAnalyses = 0;
const analysisQueue = [];

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from server environment");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return client;
}

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function withAnalysisSlot(task) {
  if (activeAnalyses >= MAX_CONCURRENT_ANALYSES) {
    await new Promise((resolve) => analysisQueue.push(resolve));
  }

  activeAnalyses += 1;

  try {
    return await task();
  } finally {
    activeAnalyses -= 1;
    analysisQueue.shift()?.();
  }
}

function getErrorStatus(error) {
  const directStatus = Number(
    error?.status || error?.code || error?.error?.code || error?.response?.status
  );

  if (Number.isInteger(directStatus)) {
    return directStatus;
  }

  // The Google SDK sometimes embeds the HTTP status in a JSON-formatted message.
  const messageMatch = error?.message?.match(
    /(?:"code"\s*:\s*)?(429|500|502|503|504)\b/
  );

  return messageMatch ? Number(messageMatch[1]) : null;
}

async function generateContentWithRetry(prompt) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
    try {
      return await getClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      const canRetry =
        RETRYABLE_STATUS_CODES.has(status) && attempt < MAX_GEMINI_ATTEMPTS;

      if (!canRetry) {
        throw error;
      }

      // Exponential backoff spreads temporary capacity and rate-limit retries.
      await wait(750 * 2 ** (attempt - 1));
    }
  }

  throw lastError;
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

function normalizeFramingScore(score) {
  if (score === null || score === undefined || score === "") {
    return null;
  }

  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return null;
  }

  return Math.max(-1, Math.min(1, numericScore));
}

function getFramingLabel(score) {
  if (!Number.isFinite(score)) return "Unknown";
  if (score <= -0.75) return "Very Negative";
  if (score <= -0.35) return "Negative";
  if (score <= -0.1) return "Slightly Negative";
  if (score < 0.1) return "Neutral";
  if (score < 0.35) return "Slightly Positive";
  if (score < 0.75) return "Positive";
  return "Very Positive";
}

function limitText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || "";
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function cleanArticleText(text) {
  if (typeof text !== "string") {
    return "";
  }

  const cleaned = text
    .replace(/\[\+\d+\s+chars\]$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return BAD_CONTENT_PATTERNS.has(cleaned.toUpperCase()) ? "" : cleaned;
}

function getAvailableArticleText(article) {
  const description = cleanArticleText(article.description || article.excerpt);
  const content = cleanArticleText(article.content);

  // Avoid inflating the word count when NewsAPI repeats the description as content.
  return description && content && description !== content
    ? `${description} ${content}`
    : description || content;
}

function hasEvaluativeHeadline(article) {
  const headline = article.title?.trim() || "";

  return EVALUATIVE_HEADLINE_PATTERNS.some((pattern) => pattern.test(headline));
}

function isArticleTextInsufficient(article) {
  const availableText = getAvailableArticleText(article);
  const wordCount = availableText.split(/\s+/).filter(Boolean).length;

  // A clearly evaluative headline can contain enough framing evidence even when
  // the publisher supplies only a short preview, as with reviews or commentary.
  return wordCount < MIN_ARTICLE_TEXT_WORDS && !hasEvaluativeHeadline(article);
}

function hasUsableArticleText(article) {
  return Boolean(getAvailableArticleText(article));
}

function createFallbackSummary(article) {
  const excerpt = getAvailableArticleText(article);
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
  const excerpt = getAvailableArticleText(article);
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

function createInsufficientTextBrief(article) {
  const preview = cleanArticleText(article.description || article.excerpt);
  const headline = article.title?.trim() || "this topic";
  const evidenceLabel = preview ? "headline and available preview" : "headline";
  const summaryBasis = (preview || headline).replace(/[.!?]+$/, "");

  return {
    summary: `Full article text was not available. Based on the ${evidenceLabel}, this article appears to discuss ${limitText(
      summaryBasis,
      220
    )}.`,
    keyTakeaway: `The ${evidenceLabel} suggests ${limitText(
      summaryBasis,
      150
    )}, but more article text is needed for a reliable takeaway.`,
    framingSubject: "",
    framingLabel: "Unknown",
    framingScore: null,
    framingExplanation:
      "The available article text is too limited to determine its framing reliably.",
    framingStatus: "insufficient",
  };
}

function normalizeBrief(brief, article, sourceFallback = null) {
  const shouldKeepQualifiedCopy = !hasUsableArticleText(article);
  const summary =
    !shouldKeepQualifiedCopy &&
    typeof brief.summary === "string" &&
    brief.summary.trim()
      ? brief.summary.trim()
      : sourceFallback?.summary || createFallbackSummary(article);
  const keyTakeaway =
    !shouldKeepQualifiedCopy &&
    typeof brief.keyTakeaway === "string" &&
    brief.keyTakeaway.trim()
      ? brief.keyTakeaway.trim()
      : sourceFallback?.keyTakeaway ||
        createFallbackKeyTakeaway(article, summary);
  const framingSubject =
    typeof brief.framing?.subject === "string"
      ? brief.framing.subject.trim()
      : "";
  const framingScore = normalizeFramingScore(brief.framing?.score);
  const framingExplanation =
    typeof brief.framing?.explanation === "string"
      ? brief.framing.explanation.trim()
      : "";

  return {
    summary,
    keyTakeaway,
    // Derive the label from the score so the text, marker, and color cannot disagree.
    framingSubject,
    framingLabel: getFramingLabel(framingScore),
    framingScore,
    framingExplanation,
    framingStatus: Number.isFinite(framingScore) ? "complete" : "insufficient",
  };
}

function createUnavailableBrief(article, sourceFallback = null) {
  const fallback = normalizeBrief(DEFAULT_BRIEF, article, sourceFallback);

  return {
    ...fallback,
    framingStatus: "unavailable",
  };
}

function formatCachedAnalysis(analysis) {
  return {
    summary: analysis.summary,
    keyTakeaway: analysis.keyTakeaway,
    framingSubject: analysis.framingSubject,
    framingLabel: analysis.framingLabel,
    framingScore: analysis.framingScore,
    framingExplanation: analysis.framingExplanation,
    framingStatus: analysis.framingStatus,
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
    framingSubject: brief.framingSubject || "",
    framingLabel: brief.framingLabel,
    framingScore: brief.framingScore,
    framingExplanation: brief.framingExplanation || "",
    framingStatus: brief.framingStatus,
    model: GEMINI_MODEL,
  };
}

function buildArticleBriefPrompt(article) {
  const description = cleanArticleText(article.description || article.excerpt);
  const content = cleanArticleText(article.content);

  return `
Create a short daily news brief for this article.

Return JSON only with this exact shape:
{
  "summary": "1-2 neutral sentences explaining what happened",
  "keyTakeaways": "1 sentence stating the single most important thing the reader should remember",
  "framing": {
    "subject": "the main person, organization, policy, product, team, or idea being evaluated",
    "score": 0.0,
    "explanation": "short evidence-based explanation of how the main subject is framed"
  }
}

The summary answers "what happened." The keyTakeaways field answers "what should the reader remember."
For framing, first identify the article's main subject, then judge how favorably or critically
the supplied text presents that subject. A score of -1 is strongly negative or critical,
0 is factual or balanced, and 1 is strongly positive or favorable.
Consider loaded or emotional wording, praise, criticism, quoted viewpoints, omitted balance,
and whether claims are presented favorably, skeptically, or as plain facts.
Rate the presentation and language, not whether the event itself is good or bad.
Use intermediate decimal values for mildly or moderately positive/negative framing.
If there is not enough text to identify a subject and assess its framing, return null for score
and explain what evidence is missing. Do not invent details beyond the supplied text.

Title: ${article.title || ""}
Source: ${article.source || "Unknown source"}
Description: ${description}
Content snippet: ${content}
URL: ${article.url || ""}
`;
}

async function generateArticleBrief(article) {
  if (!article.id) {
    return normalizeBrief(DEFAULT_BRIEF, article);
  }

  // Read completed cache entries before applying today's source-text gate so a
  // previously successful analysis is never replaced by an insufficient result.
  const cachedAnalysis = await ArticleAnalysis.findOne({
    articleId: article.id,
  }).lean();

  if (cachedAnalysis?.framingStatus === "complete") {
    return formatCachedAnalysis(cachedAnalysis);
  }

  const qualifiedSourceBrief = !hasUsableArticleText(article)
    ? createInsufficientTextBrief(article)
    : null;

  if (isArticleTextInsufficient(article)) {
    // Do not ask Gemini to infer tone from a headline or publisher boilerplate.
    // Cache the qualified preview-based copy so later loads stay transparent.
    const insufficientBrief =
      qualifiedSourceBrief || createInsufficientTextBrief(article);

    await ArticleAnalysis.findOneAndUpdate(
      { articleId: article.id },
      buildAnalysisCacheDocument(article, insufficientBrief),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return insufficientBrief;
  }

  try {
    const response = await withAnalysisSlot(() =>
      generateContentWithRetry(buildArticleBriefPrompt(article))
    );
    const parsed = JSON.parse(extractJson(response.text || ""));
    const normalizedInput = {
      ...parsed,
      keyTakeaway: parsed.keyTakeaway || parsed.keyTakeaways,
      framing: parsed.framing,
    };
    const brief = normalizeBrief(normalizedInput, article, qualifiedSourceBrief);

    await ArticleAnalysis.findOneAndUpdate(
      { articleId: article.id },
      buildAnalysisCacheDocument(article, brief),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return brief;
  } catch (error) {
    console.error("Gemini article brief failed:", error.message);
    // Temporary failures remain uncached so a later page load can retry analysis.
    return createUnavailableBrief(article, qualifiedSourceBrief);
  }
}

module.exports = {
  generateArticleBrief,
};
