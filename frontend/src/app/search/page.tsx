"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Highest Revenue" },
];

const LANGUAGES = [
  { value: "", label: "Any Language" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "it", label: "Italian" },
];

const GENRE_LIST = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }, { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" },
  { id: 10402, name: "Music" }, { id: 36, name: "History" }, { id: 10752, name: "War" },
  { id: 10751, name: "Family" }, { id: 9648, name: "Mystery" }, { id: 37, name: "Western" },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const sortParam   = searchParams.get("sort") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 1);
    } else if (sortParam) {
      loadCategory(sortParam, 1);
    } else {
      loadCategory("trending", 1);
    }
  }, [initialQuery, sortParam]);

  async function performSearch(q: string, p: number) {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await moviesAPI.search(q, p);
      setResults(data.results);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategory(cat: string, p: number) {
    setLoading(true);
    try {
      let data;
      switch (cat) {
        case "now_playing": data = await moviesAPI.nowPlaying(p); break;
        case "top_rated":  data = await moviesAPI.topRated(p);   break;
        default:           data = await moviesAPI.trending("week", p);
      }
      setResults(data.results);
      setTotalPages(data.total_pages || 1);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query, 1);
    }
  }

  function handlePageChange(newPage: number) {
    if (initialQuery) {
      performSearch(initialQuery, newPage);
    } else {
      loadCategory(sortParam || "trending", newPage);
    }
  }

  const categoryLabels: Record<string, string> = {
    trending:    "Trending Movies",
    now_playing: "Now Playing",
    top_rated:   "Top Rated",
  };

  const pageTitle = initialQuery
    ? `Results for "${initialQuery}"`
    : categoryLabels[sortParam] || "Trending Movies";

  return (
    <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, directors, actors..."
            className="w-full h-14 pr-5 rounded-2xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all text-lg font-body"
            style={{ paddingLeft: "3.25rem" }}
          />
        </div>
      </form>

      {/* Title + count */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-display">{pageTitle}</h1>
        {totalResults > 0 && (
          <span className="text-sm text-white/30">{totalResults.toLocaleString()} results</span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((movie, i) => (
              <MovieCard key={movie.id || movie.tmdb_id} movie={movie} showOverview index={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {Math.min(totalPages, 500)}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-5">
            <Search className="w-7 h-7 text-white/15" />
          </div>
          <p className="text-lg text-white/25 mb-2">No movies found</p>
          <p className="text-sm text-white/15">Try adjusting your search term</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold/40" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
