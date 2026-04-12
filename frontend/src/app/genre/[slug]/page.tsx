"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Copy } from "lucide-react";
import Link from "next/link";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { genresAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

function GenreContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const genreId = searchParams.get("id");

  const pageParam = Number(searchParams.get("page") ?? "1");
  const sortParam = searchParams.get("sort") ?? "popularity.desc";

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Math.max(1, pageParam));
  const [sort, setSort] = useState(sortParam);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [detailUrl, setDetailUrl] = useState("");

  const genreName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  useEffect(() => {
    setPage(Math.max(1, pageParam));
    setSort(sortParam);
  }, [pageParam, sortParam]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDetailUrl(window.location.href);
    }
  }, [slug, pageParam, sortParam]);

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      try {
        const data = await genresAPI.getMovies(slug, page, sort);
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [slug, page, sort]);

  const updateQuery = (nextPage: number) => {
    const nextParams = new URLSearchParams();
    if (genreId) nextParams.set("id", genreId);
    nextParams.set("page", String(nextPage));
    nextParams.set("sort", sort);
    router.push(`/genre/${slug}?${nextParams.toString()}`);
  };

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(detailUrl || window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <Link
        href="/genre"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All Genres
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">{genreName} Movies</h1>
          <p className="mt-2 text-sm text-white/50 max-w-2xl">
            Share this genre view with page and sort in the URL to keep results consistent.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/40">
            <span>Page <span className="font-mono text-white/80">{page}</span></span>
            <span>Sort <span className="font-mono text-white/80">{sort}</span></span>
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
          aria-label="Copy current genre results URL"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? "Copied!" : "Copy results URL"}
        </button>
      </div>

      {detailUrl && (
        <p className="text-xs text-white/40 mb-10 break-words">{detailUrl}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
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
                onClick={() => updateQuery(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {Math.min(totalPages, 500)}
              </span>
              <button
                onClick={() => updateQuery(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GenreDetailPage() {
  return (
    <Suspense fallback={<div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold/40" /></div>}>
      <GenreContent />
    </Suspense>
  );
}
