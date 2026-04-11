"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { genresAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "vote_average.desc", label: "Highest rated" },
  { value: "primary_release_date.desc", label: "Newest" },
];

function GenreContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const genreId = searchParams.get("id");

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("popularity.desc");

  const genreName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await genresAPI.getMovies(slug, page, sort);
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error(err);
      setError("We couldn’t load movies for this genre. Check your connection and try again.");
      setMovies([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [slug, page, sort]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    setPage(1);
  }, [slug, sort]);

  return (
    <main className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <Link
        href="/genre"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> All Genres
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">{genreName} Movies</h1>
          {genreId && (
            <p className="text-xs text-white/25 mt-1 font-mono tabular-nums">id {genreId}</p>
          )}
        </div>
        <label className="flex flex-col gap-1 text-xs text-white/40 sm:min-w-[200px]">
          <span className="uppercase tracking-wider font-semibold">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/80 px-3 py-2 outline-none focus:border-gold/25"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && !loading && (
        <div
          className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200/90 text-sm"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden />
            {error}
          </div>
          <button
            type="button"
            onClick={() => fetchMovies()}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium w-fit"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? null : movies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <p className="text-white/40 mb-2">No movies found for this genre yet.</p>
          <p className="text-sm text-white/25">Try another sort or sync more data from the backend.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id || movie.tmdb_id} movie={movie} showOverview />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {Math.min(totalPages, 500)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function GenreDetailPage() {
  return (
    <Suspense fallback={<div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold/40" /></div>}>
      <GenreContent />
    </Suspense>
  );
}
