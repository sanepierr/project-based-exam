"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Heart, Zap, Flame, Brain, Smile, Ghost,
  Mountain, Baby, BookOpen, ArrowLeft, Loader2, Shuffle, Star, Share,
} from "lucide-react";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

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

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [moodInfo, setMoodInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [themeColor, setThemeColor] = useState<string>("");

  useEffect(() => {
    if (!activeMood) return;
    fetchMoodMovies(activeMood, 1);
    // Update history
    const newHistory = [activeMood, ...history.filter(h => h !== activeMood)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("moodHistory", JSON.stringify(newHistory));
  }, [activeMood]);

  useEffect(() => {
    const mood = MOODS.find(m => m.slug === activeMood);
    setThemeColor(mood ? mood.color : "");
  }, [activeMood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === -1) return;
      if (e.key === "Enter") {
        const mood = MOODS[focusedIndex];
        setToastMessage(`Selected ${mood.label}`);
        setTimeout(() => setToastMessage(""), 2000);
        router.push(`/mood?mood=${mood.slug}`);
      } else if (e.key === "ArrowRight") {
        setFocusedIndex((prev) => (prev + 1) % MOODS.length);
      } else if (e.key === "ArrowLeft") {
        setFocusedIndex((prev) => (prev - 1 + MOODS.length) % MOODS.length);
      } else if (e.key === "ArrowDown") {
        setFocusedIndex((prev) => Math.min(prev + 5, MOODS.length - 1));
      } else if (e.key === "ArrowUp") {
        setFocusedIndex((prev) => Math.max(prev - 5, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, router]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("moodFavorites");
    if (saved) setFavorites(JSON.parse(saved));
    const savedHistory = localStorage.getItem("moodHistory");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  async function fetchMoodMovies(slug: string, p: number, sort?: string) {
    setLoading(true);
    try {
      const data = await moviesAPI.getMoodMovies(slug, p, sort || sortBy);
      setMovies(data.results || []);
      setMoodInfo(data.mood);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto transition-all duration-500 ${themeColor ? `bg-gradient-to-br ${themeColor}` : ""}`}>
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gold/90 text-black px-4 py-2 rounded-lg font-semibold transition-opacity duration-300">
          {toastMessage}
        </div>
      )}

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

      {/* Surprise Me Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => {
            const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
            setToastMessage(`Surprise! Selected ${randomMood.label}`);
            setTimeout(() => setToastMessage(""), 2000);
            router.push(`/mood?mood=${randomMood.slug}`);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 text-gold font-semibold transition-all duration-200 hover:scale-105"
        >
          <Shuffle className="w-4 h-4" />
          Surprise Me
        </button>
      </div>

      {/* Mood grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-14">
        {MOODS.map((mood) => {
          const Icon = mood.icon;
          const isActive = activeMood === mood.slug;
          return (
            <button
              key={mood.slug}
              tabIndex={0}
              onFocus={() => setFocusedIndex(MOODS.findIndex(m => m.slug === mood.slug))}
              onClick={() => {
                setToastMessage(`Selected ${mood.label}`);
                setTimeout(() => setToastMessage(""), 2000);
                router.push(`/mood?mood=${mood.slug}`);
              }}
              className={`genre-card glass-card group relative overflow-hidden rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                isActive ? "ring-2 ring-gold/40 scale-[1.03]" : ""
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-500`} />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? mood.iconColor : "text-white/30"} group-hover:${mood.iconColor} transition-colors`} />
                <p className="text-sm font-semibold text-white/80 mb-0.5">{mood.label}</p>
                <p className="text-[10px] text-white/30 group-hover:opacity-0 transition-opacity">{mood.desc}</p>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {mood.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {activeMood && (
        <div>
          {moodInfo && (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold font-display">{moodInfo.label}</h2>
                <p className="text-sm text-white/30 mt-0.5">{moodInfo.description}</p>
              </div>
              <div className="flex items-center gap-4">
                {totalResults > 0 && (
                  <div className="text-sm text-white/50">
                    {totalResults.toLocaleString()} movies
                  </div>
                )}
                <button
                  onClick={() => {
                    const newFavorites = favorites.includes(activeMood)
                      ? favorites.filter(f => f !== activeMood)
                      : [...favorites, activeMood];
                    setFavorites(newFavorites);
                    localStorage.setItem("moodFavorites", JSON.stringify(newFavorites));
                    setToastMessage(favorites.includes(activeMood) ? "Removed from favorites" : "Added to favorites");
                    setTimeout(() => setToastMessage(""), 2000);
                  }}
                  className={`p-2 rounded-lg transition-colors ${favorites.includes(activeMood) ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50 hover:text-white"}`}
                >
                  <Star className={`w-4 h-4 ${favorites.includes(activeMood) ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/mood?mood=${activeMood}`;
                    navigator.clipboard.writeText(url);
                    setToastMessage("Link copied to clipboard!");
                    setTimeout(() => setToastMessage(""), 2000);
                  }}
                  className="p-2 rounded-lg bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <Share className="w-4 h-4" />
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    fetchMoodMovies(activeMood, 1, e.target.value);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-sm text-white"
                >
                  <option value="popularity.desc">Most Popular</option>
                  <option value="vote_average.desc">Highest Rated</option>
                  <option value="release_date.desc">Newest</option>
                  <option value="release_date.asc">Oldest</option>
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
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

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => fetchMoodMovies(activeMood, page - 1)}
                    disabled={page <= 1}
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-white/30 font-mono px-4">{page} / {Math.min(totalPages, 500)}</span>
                  <button
                    onClick={() => fetchMoodMovies(activeMood, page + 1)}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 bg-gold/20 hover:bg-gold/30 border border-gold/30 text-gold p-3 rounded-full transition-all duration-200 hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5 rotate-[-90deg]" />
        </button>
      )}

      {/* Empty state */}
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
