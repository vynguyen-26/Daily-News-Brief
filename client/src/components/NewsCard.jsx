import { Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NewsCard({ article, isAuthenticated = false, isSaved = false, onToggleSave }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [saving, setSaving] = useState(false);

    const timeAgo = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recently";
    // Article ids can be source URLs, so encode them before using them in a route.
    const articlePath = `/article/${encodeURIComponent(article.id)}`;
    const articleLinkState = {
      article,
      from: location.pathname,
    };

    async function toggleSaveArticle() {
      if (!isAuthenticated) {
        // Saving is the first action that requires auth, so keep the article
        // unchanged until the reader logs in and returns to the brief.
        navigate("/login", {
          state: {
            from: location.pathname,
          },
        });
        return;
      }

      if (!onToggleSave) {
        return;
      }

      setSaving(true);

      try {
        await onToggleSave(article);
      } finally {
        setSaving(false);
      }
    }

    return (
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all group">
      <Link to={articlePath} state={articleLinkState}>
        <div className="aspect-video overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full border border-blue-600/30">
            {article.category}
          </span>
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>{timeAgo}</span>
          </div>
        </div>

        <Link to={articlePath} state={articleLinkState}>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>

        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <span className="text-sm text-zinc-500">
            {article.source}
          </span>

          <button
            onClick={toggleSaveArticle}
            disabled={saving}
            className={`p-2 rounded-lg transition-colors ${
              isSaved
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
    )
}
