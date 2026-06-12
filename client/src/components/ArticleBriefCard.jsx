import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";

const framingColors = {
    "Very Negative": "#dc2626",
    Negative: "#ef4444",
    "Slightly Negative": "#f87171",
    Neutral: "#a1a1aa",
    "Slightly Positive": "#4ade80",
    Positive: "#22c55e",
    "Very Positive": "#16a34a",
    Unknown: "#a1a1aa",
    Unavailable: "#f59e0b",
};

function getFramingPosition(score) {
    if (!Number.isFinite(score)) {
        return "50%";
    }

    // Keep the marker inside the rounded bar while mapping -1 through 1
    // continuously from the negative end to the positive end.
    const percentage = ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;
    return `${Math.max(4, Math.min(96, percentage))}%`;
}

export default function ArticleBriefCard({
    article,
    isSaved = false,
    onToggleSave,
}) {
    const publishedDate = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString()
        : null;
    const framingStatus =
        article.framingStatus ||
        (Number.isFinite(article.framingScore) ? "complete" : "insufficient");
    const framingLabel = article.framingLabel || "Unknown";
    const displayedFraming =
        framingStatus === "unavailable"
            ? "Analysis temporarily unavailable"
            : framingStatus === "insufficient"
              ? "Insufficient text"
              : framingLabel;
    const framingColor =
        framingStatus === "unavailable"
            ? framingColors.Unavailable
            : framingColors[framingLabel] || framingColors.Unknown;
    const framingExplanation =
        article.framingExplanation ||
        (framingStatus === "unavailable"
            ? "The analysis service could not complete this request. Reloading later will retry it."
            : "The available headline and article text were not detailed enough to assess framing reliably.");
    const showFramingScale = framingStatus === "complete";

    return (
        <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-left">
            <header className="flex flex-col gap-4 border-b border-zinc-800 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
                        {article.category || "News"}
                    </p>
                    <h2 className="!mb-0 !text-2xl font-semibold !text-white">
                        {article.title}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        {[article.source, publishedDate].filter(Boolean).join(" · ")}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {article.url && (
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Read article
                        </a>
                    )}

                    {onToggleSave && (
                        <button
                            type="button"
                            onClick={() => onToggleSave(article)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                isSaved
                                    ? "bg-zinc-700 text-white"
                                    : "bg-blue-600 text-white hover:bg-blue-500"
                            }`}
                        >
                            {isSaved ? (
                                <BookmarkCheck className="h-4 w-4" />
                            ) : (
                                <Bookmark className="h-4 w-4" />
                            )}
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    )}
                </div>
            </header>

            {/* The ten-column grid gives summary, takeaway, and framing a 40/30/30 split
                on large screens while keeping each article stacked on smaller screens. */}
            <div className="grid grid-cols-1 lg:grid-cols-10">
                <section className="border-b border-zinc-800 p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
                    <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
                    <p className="leading-7 text-zinc-300">
                        {article.summary || article.excerpt || "No summary available yet."}
                    </p>
                </section>

                <section className="border-b border-zinc-800 p-6 lg:col-span-3 lg:border-b-0 lg:border-r">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                        Key Takeaway
                    </h3>
                    <p className="leading-7 text-zinc-300">
                        {article.keyTakeaway || "AI key takeaway will appear here later."}
                    </p>
                </section>

                <aside className="p-6 lg:col-span-3">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                        Article Framing
                    </h3>

                    {/* Only completed analyses show the scale. Missing text and service
                        failures must not look like neutral midpoint ratings. */}
                    {showFramingScale && (
                        <>
                            <div className="mb-2 flex justify-between text-xs text-zinc-500">
                                <span>Negative</span>
                                <span>Neutral</span>
                                <span>Positive</span>
                            </div>
                            <div className="relative mb-4 h-3 rounded-full bg-gradient-to-r from-red-600 via-zinc-500 to-green-600">
                                <span
                                    className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                                    style={{
                                        left: getFramingPosition(article.framingScore),
                                        backgroundColor: framingColor,
                                    }}
                                    aria-label={`Article framing: ${displayedFraming}`}
                                />
                            </div>
                        </>
                    )}

                    <p className="font-semibold" style={{ color: framingColor }}>
                        {displayedFraming}
                    </p>
                    {article.framingSubject && (
                        <p className="mt-1 text-sm text-zinc-400">
                            Subject: {article.framingSubject}
                        </p>
                    )}
                    <div className="mt-5 border-t border-zinc-800 pt-4">
                        <p className="mb-2 text-sm font-medium text-zinc-400">
                            Why this framing?
                        </p>
                        <p className="text-sm leading-6 text-zinc-300">
                            {framingExplanation}
                        </p>
                    </div>
                </aside>
            </div>
        </article>
    );
}
