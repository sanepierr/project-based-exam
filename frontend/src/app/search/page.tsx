"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2, ChevronDown } from "lucide-react";
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

const MIN_YEAR = 1900;
const MAX_YEAR = 2026;
const MAX_PAGES = 500;

const GENRE_LIST = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }, { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" },
  { id: 10402, name: "Music" }, { id: 36, name: "History" }, { id: 10752, name: "War" },
  { id: 10751, name: "Family" }, { id: 9648, name: "Mystery" }, { id: 37, name: "Western" },
];

const FILTER_DEFAULTS = {
  genre: "",
  yearFrom: "",
  yearTo: "",
  rating: "",
  runtimeMin: "",
  runtimeMax: "",
  language: "",
  sort: "popularity.desc",
};

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const requestIdRef = useRef(0);

  // Filter state
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYearFrom, setFilterYearFrom] = useState("");
  const [filterYearTo, setFilterYearTo] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [filterRuntimeMin, setFilterRuntimeMin] = useState("");
  const [filterRuntimeMax, setFilterRuntimeMax] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterSort, setFilterSort] = useState("popularity.desc");

  const hasActiveFilters = !!(filterGenre || filterYearFrom || filterYearTo || filterRating || filterRuntimeMin || filterRuntimeMax || filterLanguage);

  function sanitizeNumberInput(value: string, min: number, max: number) {
    const cleaned = value.replace(/[^\d]/g, "");
    if (!cleaned) return "";
    const parsed = Number(cleaned);
    return String(Math.min(Math.max(parsed, min), max));
  }

  function normalizeTotalPages(total: number | undefined) {
    if (!total || Number.isNaN(total)) return 1;
    return Math.min(Math.max(total, 1), MAX_PAGES);
  }

  function startRequest() {
    requestIdRef.current += 1;
    return requestIdRef.current;
  }

  function isActiveRequest(requestId: number) {
    return requestIdRef.current === requestId;
  }

  function updateQueryParam(nextQuery: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 1);
    } else if (sortParam) {
      loadCategory(sortParam, 1);
    } else {
      loadCategory("trending", 1);
    }
  }, [initialQuery, sortParam]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Live debounced search — fires 300ms after user stops typing in the main bar
  useEffect(() => {
    if (!query.trim() || query === initialQuery) return;
    const timer = setTimeout(() => {
      performSearch(query, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function performSearch(q: string, p: number) {
    if (!q.trim()) return;
    const requestId = startRequest();
    setLoading(true);
    try {
      const data = await moviesAPI.search(q, p);
      if (!isActiveRequest(requestId)) return;
      setResults(data.results);
      setTotalPages(normalizeTotalPages(data.total_pages));
      setTotalResults(data.total_results || 0);
      setPage(p);
    } catch (err) {
      if (!isActiveRequest(requestId)) return;
      console.error(err);
    } finally {
      if (isActiveRequest(requestId)) {
        setLoading(false);
      }
    }
  }

  async function loadCategory(cat: string, p: number) {
    const requestId = startRequest();
    setLoading(true);
    try {
      let data;
      switch (cat) {
        case "now_playing": data = await moviesAPI.nowPlaying(p); break;
        case "top_rated": data = await moviesAPI.topRated(p); break;
        default: data = await moviesAPI.trending("week", p);
      }
      if (!isActiveRequest(requestId)) return;
      setResults(data.results);
      setTotalPages(normalizeTotalPages(data.total_pages));
      setTotalResults(data.total_results || data.results.length || 0);
      setPage(p);
    } catch (err) {
      if (!isActiveRequest(requestId)) return;
      console.error(err);
    } finally {
      if (isActiveRequest(requestId)) {
        setLoading(false);
      }
    }
  }

  async function applyFilters(p: number = 1) {
    function buildDiscoverParams(pageNumber: number) {
      const params: Record<string, string | number> = {
        sort: filterSort,
        page: pageNumber,
      };
      if (filterGenre) params.genre = filterGenre;
      if (filterYearFrom) params.year_from = filterYearFrom;
      if (filterYearTo) params.year_to = filterYearTo;
      if (filterRating) params.rating_min = filterRating;
      if (filterRuntimeMin) params.runtime_min = filterRuntimeMin;
      if (filterRuntimeMax) params.runtime_max = filterRuntimeMax;
      if (filterLanguage) params.language = filterLanguage;
      return params;
    }

    const requestId = startRequest();
    setLoading(true);
    try {
      const data = await moviesAPI.discover(buildDiscoverParams(p));
      if (!isActiveRequest(requestId)) return;
      setResults(data.results);
      setTotalPages(normalizeTotalPages(data.total_pages));
      setTotalResults(data.total_results || 0);
      setPage(p);
    } catch (err) {
      if (!isActiveRequest(requestId)) return;
      console.error(err);
    } finally {
      if (isActiveRequest(requestId)) {
        setLoading(false);
      }
    }
  }

  function clearFilters() {
    setFilterGenre(FILTER_DEFAULTS.genre);
    setFilterYearFrom(FILTER_DEFAULTS.yearFrom);
    setFilterYearTo(FILTER_DEFAULTS.yearTo);
    setFilterRating(FILTER_DEFAULTS.rating);
    setFilterRuntimeMin(FILTER_DEFAULTS.runtimeMin);
    setFilterRuntimeMax(FILTER_DEFAULTS.runtimeMax);
    setFilterLanguage(FILTER_DEFAULTS.language);
    setFilterSort(FILTER_DEFAULTS.sort);
    setFiltersOpen(false);
    if (initialQuery) {
      performSearch(initialQuery, 1);
      return;
    }
    loadCategory(sortParam || "trending", 1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedQuery = query.trim();
    updateQueryParam(trimmedQuery);
  }

  function handlePageChange(newPage: number) {
    const activeQuery = initialQuery || query.trim();
    if (hasActiveFilters || filterSort !== "popularity.desc") {
      applyFilters(newPage);
    } else if (activeQuery) {
      performSearch(activeQuery, newPage);
    } else {
      loadCategory(sortParam || "trending", newPage);
    }
  }

  const categoryLabels: Record<string, string> = {
    trending: "Trending Movies",
    now_playing: "Now Playing",
    top_rated: "Top Rated",
  };

  const pageTitle = initialQuery
    ? `Results for "${initialQuery}"`
    : hasActiveFilters
    ? "Filtered Results"
    : categoryLabels[sortParam] || "Trending Movies";
  const emptyStateTitle = hasActiveFilters
    ? "No movies matched these filters"
    : initialQuery
    ? `No movies found for "${initialQuery}"`
    : "No movies found";
  const emptyStateHint = hasActiveFilters
    ? "Try broadening your year, rating, or runtime filters"
    : "Try adjusting your filters or search term";

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
            aria-label="Search for movies, directors, or actors"
            className="w-full h-14 pr-5 rounded-2xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all text-lg font-body"
            style={{ paddingLeft: "3.25rem" }}
          />
        </div>
      </form>

      {/* Filter toggle */}
      <div className="flex items-center justify-center mb-8">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="advanced-search-filters"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            filtersOpen || hasActiveFilters
              ? "bg-gold/15 border border-gold/25 text-gold"
              : "glass-card text-white/50 hover:text-white"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold text-surface-0 text-[10px] font-bold leading-none">
              {[filterGenre, filterYearFrom, filterYearTo, filterRating, filterRuntimeMin, filterRuntimeMax, filterLanguage].filter(Boolean).length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div id="advanced-search-filters" className="glass-card rounded-2xl p-6 mb-10 animate-slide-up">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* Genre */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Genre</label>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 transition-colors appearance-none cursor-pointer"
              >
                <option value="">All Genres</option>
                {GENRE_LIST.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Year range */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Year Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filterYearFrom}
                  onChange={(e) => setFilterYearFrom(sanitizeNumberInput(e.target.value, MIN_YEAR, MAX_YEAR))}
                  placeholder="From"
                  min="1900"
                  max="2026"
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 placeholder:text-white/20 transition-colors"
                />
                <input
                  type="number"
                  value={filterYearTo}
                  onChange={(e) => setFilterYearTo(sanitizeNumberInput(e.target.value, MIN_YEAR, MAX_YEAR))}
                  placeholder="To"
                  min="1900"
                  max="2026"
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 placeholder:text-white/20 transition-colors"
                />
              </div>
            </div>

            {/* Min rating */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">
                Min Rating {filterRating && <span className="text-gold">({filterRating}+)</span>}
              </label>
              <input
                type="range"
                value={filterRating || "0"}
                onChange={(e) => setFilterRating(e.target.value === "0" ? "" : e.target.value)}
                min="0"
                max="9"
                step="0.5"
                className="w-full h-10 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Language */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Language</label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 transition-colors appearance-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Runtime */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Runtime (min)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filterRuntimeMin}
                  onChange={(e) => setFilterRuntimeMin(sanitizeNumberInput(e.target.value, 0, 500))}
                  placeholder="Min"
                  min="0"
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 placeholder:text-white/20 transition-colors"
                />
                <input
                  type="number"
                  value={filterRuntimeMax}
                  onChange={(e) => setFilterRuntimeMax(sanitizeNumberInput(e.target.value, 0, 500))}
                  placeholder="Max"
                  min="0"
                  className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 placeholder:text-white/20 transition-colors"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mb-1.5 block">Sort By</label>
              <select
                value={filterSort}
                onChange={(e) => setFilterSort(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-2 border border-white/[0.08] text-white text-sm outline-none focus:border-gold/30 transition-colors appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04]">
            <button
              onClick={() => applyFilters(1)}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm hover:shadow-lg hover:shadow-gold/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterGenre && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px] text-gold/80">
              {GENRE_LIST.find((g) => String(g.id) === filterGenre)?.name ?? "Genre"}
              <button onClick={() => setFilterGenre("")} className="hover:text-gold transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(filterYearFrom || filterYearTo) && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px] text-gold/80">
              {filterYearFrom || "…"} – {filterYearTo || "…"}
              <button onClick={() => { setFilterYearFrom(""); setFilterYearTo(""); }} className="hover:text-gold transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filterRating && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px] text-gold/80">
              ★ {filterRating}+
              <button onClick={() => setFilterRating("")} className="hover:text-gold transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filterLanguage && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px] text-gold/80">
              {LANGUAGES.find((l) => l.value === filterLanguage)?.label ?? filterLanguage}
              <button onClick={() => setFilterLanguage("")} className="hover:text-gold transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {(filterRuntimeMin || filterRuntimeMax) && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-[12px] text-gold/80">
              {filterRuntimeMin || "0"}–{filterRuntimeMax || "∞"} min
              <button onClick={() => { setFilterRuntimeMin(""); setFilterRuntimeMax(""); }} className="hover:text-gold transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

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
          {Array.from({ length: 18 }).map((_, i) => <MovieCardSkeleton key={i} />)}
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
                aria-label="Previous page"
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span aria-live="polite" className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
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
          <p className="text-lg text-white/25 mb-2">{emptyStateTitle}</p>
          <p className="text-sm text-white/15">{emptyStateHint}</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold/40" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
