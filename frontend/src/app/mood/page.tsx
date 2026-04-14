"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Heart, Zap, Brain, Smile, Ghost,
  Mountain, Baby, BookOpen, Loader2, Link2, Check,
} from "lucide-react";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

// MOODS defines all available mood categories with their display properties
const MIN_PAGE = 1;
const MAX_PAGES = 500;

const MOODS = [
  { slug: "cozy-night", label: "Cozy Night In", icon: Heart, color: "from-pink-500/15 to-rose-600/15", iconColor: "text-pink-400", desc: "Warm & comforting" },
  { slug: "adrenaline", label: "Adrenaline Rush", icon: Zap, color: "from-red-500/15 to-orange-600/15", iconColor: "text-red-400", desc: "Heart-pumping action" },
  { slug: "date-night", label: "Date Night", icon: Heart, color: "from-rose-500/15 to-pink-500/15", iconColor: "text-rose-400", desc: "Romantic & charming" },
  { slug: "mind-bender", label: "Mind Bender", icon: Brain, color: "from-violet-500/15 to-purple-600/15", iconColor: "text-violet-400", desc: "Twist your reality" },
  { slug: "feel-good", label: "Feel Good", icon: Smile, color: "from-yellow-500/15 to-amber-500/15", iconColor: "text-yellow-400", desc: "Uplifting & joyful" },
  { slug: "edge-of-seat", label: "Edge of Your Seat", icon: Ghost, color: "from-slate-500/15 to-neutral-600/15", iconColor: "text-slate-400", desc: "Suspense & chills" },
  { slug: "epic-adventure", label: "Epic Adventure", icon: Mountain, color: "from-emerald-500/15 to-teal-600/15", iconColor: "text-emerald-400", desc: "Grand & sweeping" },
  { slug: "cry-it-out", label: "Cry It Out", icon: Heart, color: "from-blue-500/15 to-indigo-600/15", iconColor: "text-blue-400", desc: "Emotional & deep" },
  { slug: "family-fun", label: "Family Fun", icon: Baby, color: "from-green-500/15 to-lime-600/15", iconColor: "text-green-400", desc: "All ages welcome" },
  { slug: "documentary-deep-dive", label: "Documentary", icon: BookOpen, color: "from-cyan-500/15 to-sky-600/15", iconColor: "text-cyan-400", desc: "Real stories" },
];

function MoodContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeMood = searchParams.get("mood") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [moodInfo, setMoodInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!activeMood) return;
    // Cancellation flag prevents state updates on unmounted component
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await moviesAPI.getMoodMovies(activeMood, page);
        if (cancelled) return;
        setMovies(data.results || []);
        setMoodInfo(data.mood);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadError(true);
          setMovies([]);
          setMoodInfo(null);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMood, page]);

  // Updates the URL with the selected mood and page without triggering a full navigation
  const setMoodPage = (p: number) => {
    const safePage = Math.max(MIN_PAGE, p);
    router.replace(`/mood?mood=${encodeURIComponent(activeMood)}&page=${p}`, {
      scroll: false,
    });
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/15 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">
            Mood Picker
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
          What&apos;s your <span className="text-gold italic">mood</span>?
        </h1>
        <p className="text-white/35 max-w-md mx-auto">
          Pick a vibe and we&apos;ll curate the perfect movies for your current state of mind.
        </p>
      </div>

      {/* Mood grid — each card sets the active mood and resets to page 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-14">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = activeMood === mood.slug;
          return (
            <button
              key={mood.slug}
              onClick={() => router.push(`/mood?mood=${mood.slug}&page=${MIN_PAGE}`)}
              className={`genre-card glass-card group relative overflow-hidden rounded-xl p-5 text-center transition-all duration-300 ${
                isActive ? "ring-2 ring-gold/40 scale-[1.03]" : ""
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-500`} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? mood.iconColor : "text-white/30"} group-hover:${mood.iconColor} transition-colors`} />
                <p className="text-sm font-semibold text-white/80 mb-0.5">{mood.label}</p>
                <p className="text-[10px] text-white/30">{mood.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Results section — only rendered when a mood is actively selected */}
      {activeMood && (
        <div>
          {/* Error banner shown when mood movie fetch fails */}
          {loadError && (
            <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100/90 text-center max-w-xl mx-auto">
              Could not load movies for this mood. Try again or pick a different mood.
            </div>
          )}
          {moodInfo && (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold font-display">{moodInfo.label}</h2>
                <p className="text-sm text-white/30 mt-0.5">{moodInfo.description}</p>
                <p className="text-[11px] text-white/20 mt-2 font-mono">
                  Shareable URL includes mood and page
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    /* ignore */
                  }
                }}
                aria-label="Copy shareable mood link to clipboard"
                title="Copy a shareable link to this mood and page"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl glass-card text-xs font-medium text-white/70 hover:text-white self-start"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy mood link"}
              </button>
            </div>
          )}

          {/* Show skeleton cards while mood movies are loading */}
          {loading ? (
            <div role="status" aria-label="Loading movies" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {Array.from({ length: 18 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {movies.map((movie, i) => (
                  <MovieCard key={movie.id || movie.tmdb_id} movie={movie} showOverview index={i} />
                ))}
              </div>

              {/* Pagination — only shown when there are multiple pages of results */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    type="button"
                    onClick={() => setMoodPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Go to previous page"
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-white/30 font-mono px-4">{page} / {Math.min(totalPages, MAX_PAGES)}</span>
                  <button
                    type="button"
                    onClick={() => setMoodPage(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Go to next page"
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty state — shown when no mood has been selected yet */}
      {!activeMood && (
        <div className="text-center py-10 text-white/20">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select a mood above to discover movies</p>
        </div>
      )}
    </div>
  );
}

export default function MoodPage() {
  return (
    <Suspense fallback={<div className="pt-32 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold/40" /></div>}>
      <MoodContent />
    </Suspense>
  );
}
