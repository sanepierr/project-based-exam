"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Link2, Check } from "lucide-react";
import Link from "next/link";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { genresAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "revenue.desc", label: "Revenue" },
] as const;

function GenreContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const genreId = searchParams.get("id");

  const sortParam = searchParams.get("sort") || "popularity.desc";
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam)
    ? sortParam
    : "popularity.desc";

  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const genreName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const setSort = (value: string) => {
    const q = new URLSearchParams();
    if (genreId) q.set("id", genreId);
    q.set("sort", value);
    q.set("page", "1");
    router.replace(`/genre/${slug}?${q.toString()}`, { scroll: false });
  };

  const setPageSafe = (p: number) => {
    const q = new URLSearchParams();
    if (genreId) q.set("id", genreId);
    q.set("sort", sort);
    q.set("page", String(p));
    router.replace(`/genre/${slug}?${q.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await genresAPI.getMovies(slug, page, sort);
        if (!cancelled) {
          setMovies(data.results || []);
          setTotalPages(data.total_pages || 1);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(true);
          setMovies([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, page, sort]);

  return (
    <main className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <Link
        href="/genre"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> All Genres
      </Link>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
        <h1 className="text-3xl font-bold font-display">{genreName} Movies</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-white/35 uppercase tracking-wider font-semibold">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-2 mt-1 block w-full sm:w-auto min-w-[160px] h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-sm text-white outline-none focus:border-gold/40"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={async () => {
              const url =
                typeof window !== "undefined" ? window.location.href : "";
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl glass-card text-xs font-medium text-white/70 hover:text-white hover:border-gold/20 transition-all"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100/90 glass-card backdrop-blur-md shadow-lg">
          Could not load movies for this genre. Check your connection or try another sort.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? null : movies.length === 0 ? (
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
                onClick={() => setPageSafe(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {Math.min(totalPages, 500)}
              </span>
              <button
                onClick={() => setPageSafe(page + 1)}
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
