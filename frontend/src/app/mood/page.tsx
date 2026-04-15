"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Heart, Zap, Flame, Brain, Smile, Ghost,
  Mountain, Baby, BookOpen, ArrowLeft, Loader2, Shuffle, Star, Share,
  Calendar, HelpCircle, CheckCircle,
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

const MOOD_RECOMMENDATIONS: Record<string, string[]> = {
  "cozy-night": ["feel-good", "date-night"],
  adrenaline: ["edge-of-seat", "epic-adventure"],
  "date-night": ["cozy-night", "feel-good"],
  "mind-bender": ["edge-of-seat", "documentary-deep-dive"],
  "feel-good": ["cozy-night", "family-fun"],
  "edge-of-seat": ["adrenaline", "mind-bender"],
  "epic-adventure": ["adrenaline", "family-fun"],
  "cry-it-out": ["date-night", "documentary-deep-dive"],
  "family-fun": ["feel-good", "epic-adventure"],
  "documentary-deep-dive": ["mind-bender", "cry-it-out"],
};

const QUIZ_QUESTIONS = [
  {
    question: "How are you feeling right now?",
    options: [
      { label: "Happy & energetic", mood: "feel-good" },
      { label: "Sad or emotional", mood: "cry-it-out" },
      { label: "Excited & adventurous", mood: "adrenaline" },
      { label: "Relaxed & cozy", mood: "cozy-night" },
      { label: "Curious & thoughtful", mood: "mind-bender" },
      { label: "Scared or suspenseful", mood: "edge-of-seat" },
    ],
  },
  {
    question: "What kind of movie experience do you want?",
    options: [
      { label: "Light-hearted comedy", mood: "feel-good" },
      { label: "Heart-pounding action", mood: "adrenaline" },
      { label: "Romantic & sweet", mood: "date-night" },
      { label: "Deep & meaningful", mood: "cry-it-out" },
      { label: "Mind-bending plot", mood: "mind-bender" },
      { label: "Family-friendly fun", mood: "family-fun" },
    ],
  },
  {
    question: "What's your preferred movie length?",
    options: [
      { label: "Short & sweet (under 2 hours)", mood: "feel-good" },
      { label: "Epic & long (over 2 hours)", mood: "epic-adventure" },
      { label: "Classic runtime (1.5-2 hours)", mood: "cozy-night" },
      { label: "Doesn't matter", mood: "documentary-deep-dive" },
    ],
  },
];

function getSuggestedMoodByTime(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "feel-good"; // Morning - uplifting
  if (hour >= 12 && hour < 18) return "epic-adventure"; // Afternoon - adventurous
  if (hour >= 18 && hour < 22) return "cozy-night"; // Evening - cozy
  return "edge-of-seat"; // Night - suspenseful
}

function MoodContent() {
  const renderSkeletons = () => Array.from({ length: 18 }).map((_, i) => <MovieCardSkeleton key={i} />);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeMood = searchParams.get("mood") || "";

  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [moodInfo, setMoodInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<typeof MOODS>([]);
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const [stats, setStats] = useState<{ averageRating: number; topGenres: string[] }>({ averageRating: 0, topGenres: [] });
  const [error, setError] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [themeColor, setThemeColor] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [suggestedMood, setSuggestedMood] = useState<string>("");
  const [virtualScroll, setVirtualScroll] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 300; // approximate height of movie card
  const containerHeight = 800;

  useEffect(() => {
    if (!activeMood) return;
    setIsTransitioning(true);
    fetchMoodMovies(activeMood, 1);
    setHistory((currentHistory) => {
      const newHistory = [activeMood, ...currentHistory.filter(h => h !== activeMood)].slice(0, 5);
      localStorage.setItem("moodHistory", JSON.stringify(newHistory));
      return newHistory;
    });
    const recommendedSlugs = MOOD_RECOMMENDATIONS[activeMood] || [];
    setRecommended(MOODS.filter((m) => recommendedSlugs.includes(m.slug)));
    setTimeout(() => setIsTransitioning(false), 300);
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
    setSuggestedMood(getSuggestedMoodByTime());
  }, []);

  async function fetchMoodMovies(slug: string, p: number, sort?: string, append = false) {
    setLoading(true);
    setError("");
    setError(null);
    try {
      const data = await moviesAPI.getMoodMovies(slug, p, sort || sortBy);
      const nextMovies = append ? [...movies, ...(data.results || [])] : (data.results || []);
      setMovies(nextMovies);
      setMoodInfo(data.mood);
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || 0);
      setPage(p);

      const averageRating = nextMovies.length
        ? nextMovies.reduce((sum, movie) => sum + movie.vote_average, 0) / nextMovies.length
        : 0;
      const genreCounts: Record<string, number> = {};
      nextMovies.forEach((movie) => {
        movie.genres?.forEach((genre) => {
          genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
        });
      });
      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      setStats({ averageRating: Number(averageRating.toFixed(1)), topGenres });

      // Enable virtual scroll for large result sets
      setVirtualScroll(nextMovies.length > 100);
    } catch (err) {
      console.error(err);
      setError("Failed to load movies. Please try again.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch movies matching this mood. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuizAnswer(answer: string) {
    const newAnswers = [...quizAnswers, answer];
    setQuizAnswers(newAnswers);

    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Determine mood based on answers
      const moodCounts: Record<string, number> = {};
      newAnswers.forEach((mood) => {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });
      const selectedMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
      setQuizActive(false);
      setQuizStep(0);
      setQuizAnswers([]);
      setToastMessage(`Quiz result: ${MOODS.find(m => m.slug === selectedMood)?.label}`);
      setTimeout(() => setToastMessage(""), 3000);
      router.push(`/mood?mood=${selectedMood}`);
    }
  }

  return (
    <div className={`pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto transition-all duration-500 ${themeColor ? `bg-gradient-to-br ${themeColor}` : ""} ${isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}>
      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gold/90 text-black px-4 py-2 rounded-lg font-semibold transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
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

      {/* Mood quiz */}
      {quizActive && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-6 h-6 text-gold" />
              <h3 className="text-xl font-bold">Mood Quiz</h3>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/50 mb-2">
                <span>Question {quizStep + 1} of {QUIZ_QUESTIONS.length}</span>
                <span>{Math.round(((quizStep + 1) / QUIZ_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div
                  className="bg-gold h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            <h4 className="text-lg font-semibold mb-4">{QUIZ_QUESTIONS[quizStep].question}</h4>
            <div className="space-y-3">
              {QUIZ_QUESTIONS[quizStep].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleQuizAnswer(option.mood)}
                  className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/30 transition-all duration-200"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setQuizActive(false);
                setQuizStep(0);
                setQuizAnswers([]);
              }}
              className="w-full mt-6 py-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              Skip quiz
            </button>
          </div>
        </div>
      )}

      {/* Suggested mood by time */}
      {suggestedMood && !activeMood && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gold/10 border border-gold/20">
            <Calendar className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-medium">Suggested for now:</span>
            <button
              onClick={() => router.push(`/mood?mood=${suggestedMood}`)}
              className="text-sm text-white hover:text-gold transition-colors"
            >
              {MOODS.find(m => m.slug === suggestedMood)?.label}
            </button>
          </div>
        </div>
      )}

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
        <button
          onClick={() => setShowQuiz(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all duration-200 hover:scale-105 ml-4"
        >
          <HelpCircle className="w-4 h-4" />
          Take Quiz
        </button>
        <button
          onClick={() => {
            const suggestedMood = getSuggestedMoodByTime();
            setActiveMood(suggestedMood);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all duration-200 hover:scale-105 ml-4"
        >
          <Calendar className="w-4 h-4" />
          Time-Based Mood
        </button>
      </div>

      {/* Take Quiz Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setQuizActive(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all duration-200 hover:scale-105"
        >
          <HelpCircle className="w-4 h-4" />
          Take Mood Quiz
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
              onClick={() => { if (!isActive) router.push(`/mood?mood=${mood.slug}`) }}
              className={`genre-card glass-card group relative overflow-hidden rounded-xl p-5 text-center transition-all duration-300 ${
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
              aria-label={`Select ${mood.label}`}
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
        <div className={`transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
          {moodInfo && (
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex items-start justify-between gap-6 flex-wrap">
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
                    aria-label={favorites.includes(activeMood) ? "Remove mood from favorites" : "Add mood to favorites"}
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
                    aria-label="Copy mood link"
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
                    aria-label="Sort mood results"
                  >
                    <option value="popularity.desc">Most Popular</option>
                    <option value="vote_average.desc">Highest Rated</option>
                    <option value="release_date.desc">Newest</option>
                    <option value="release_date.asc">Oldest</option>
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm text-white/50 ml-3">
                    <input
                      type="checkbox"
                      checked={infiniteScroll}
                      onChange={() => setInfiniteScroll((current) => !current)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-gold focus:ring-gold/40"
                      aria-label="Toggle infinite scroll"
                    />
                    Infinite scroll
                  </label>
                </div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold font-display">{moodInfo.label}</h2>
                  <button onClick={() => router.push('/mood')} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white/40">Clear</button>
                </div>
                <p className="text-sm text-white/30 mt-0.5">{moodInfo.description}</p>
                {totalResults > 0 && <span className="inline-block mt-2 text-[11px] px-2 py-1 bg-white/5 rounded-md text-white/40">{totalResults} titles found</span>}
              </div>

              {stats.averageRating > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/50">Average rating</p>
                    <p className="text-2xl font-bold text-white mt-2">{stats.averageRating}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                    <p className="text-sm text-white/50">Top genres</p>
                    <p className="text-base text-white mt-2">{stats.topGenres.join(" • ") || "—"}</p>
                  </div>
                </div>
              )}

              {recommended.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-white/50">You might also enjoy:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((mood) => (
                      <button
                        key={mood.slug}
                        onClick={() => router.push(`/mood?mood=${mood.slug}`)}
                        className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition-all duration-200 hover:border-gold/40 hover:bg-gold/10"
                        aria-label={`Try ${mood.label} next`}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl border border-red-500/10">
              <Zap className="w-10 h-10 text-red-400 mb-4" />
              <h3 className="text-xl font-display font-medium text-white/90 mb-2">Something went wrong</h3>
              <p className="text-sm text-white/40 mb-6">{error}</p>
              <button type="button" onClick={() => fetchMoodMovies(activeMood, page)} className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {renderSkeletons()}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
              {Array.from({ length: 18 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => fetchMoodMovies(activeMood, page)}
                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
          ) : (
            <>
              {virtualScroll ? (
                <div
                  className="relative overflow-auto"
                  style={{ height: containerHeight }}
                  onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
                >
                  <div style={{ height: movies.length * itemHeight, position: 'relative' }}>
                    {movies
                      .slice(
                        Math.floor(scrollTop / itemHeight),
                        Math.floor(scrollTop / itemHeight) + Math.ceil(containerHeight / itemHeight) + 5
                      )
                      .map((movie, i) => (
                        <div
                          key={movie.id || movie.tmdb_id}
                          style={{
                            position: 'absolute',
                            top: (Math.floor(scrollTop / itemHeight) + i) * itemHeight,
                            left: 0,
                            width: '100%',
                          }}
                        >
                          <MovieCard movie={movie} showOverview index={Math.floor(scrollTop / itemHeight) + i} />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
                  style={{ opacity: loading ? 0.7 : 1, transition: "opacity 300ms ease" }}
                  aria-live="polite"
                >
                  {movies.map((movie, i) => (
                    <MovieCard key={movie.id || movie.tmdb_id} movie={movie} showOverview index={i} />
                  ))}
                </div>
              )}

              {totalPages > 1 && !infiniteScroll && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button
                    onClick={() => fetchMoodMovies(activeMood, page - 1)}
                    disabled={page <= 1}
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:bg-white/5 transition-all active:scale-95"
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-white/30 font-mono px-4">{page} / {Math.min(totalPages, 500)}</span>
                  <button
                    onClick={() => fetchMoodMovies(activeMood, page + 1)}
                    disabled={page >= totalPages}
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:bg-white/5 transition-all active:scale-95"
                    className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              )}
              {totalPages > 1 && infiniteScroll && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => fetchMoodMovies(activeMood, page + 1, sortBy, true)}
                    disabled={page >= totalPages}
                    className="px-6 py-3 rounded-xl glass-card text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors disabled:hover:bg-transparent"
                    aria-label="Load more movies"
                  >
                    Load more movies
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

      {/* Mood Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl border border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gold" />
                  Mood Quiz
                </h3>
                <button
                  onClick={() => setShowQuiz(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white/60">
                    Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
                  </span>
                  <div className="flex gap-1">
                    {QUIZ_QUESTIONS.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index <= quizStep ? 'bg-gold' : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h4 className="text-lg font-medium text-white mb-4">
                  {QUIZ_QUESTIONS[quizStep].question}
                </h4>

                <div className="space-y-2">
                  {QUIZ_QUESTIONS[quizStep].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newAnswers = [...quizAnswers];
                        newAnswers[quizStep] = option.mood;
                        setQuizAnswers(newAnswers);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        quizAnswers[quizStep] === option.mood
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-white/20 bg-white/5 text-white hover:border-white/30'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {quizStep > 0 && (
                  <button
                    onClick={() => setQuizStep(quizStep - 1)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {quizStep < QUIZ_QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => {
                      if (quizAnswers[quizStep]) {
                        setQuizStep(quizStep + 1);
                      }
                    }}
                    disabled={!quizAnswers[quizStep]}
                    className="flex-1 px-4 py-2 rounded-lg bg-gold text-black font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (quizAnswers[quizStep]) {
                        // Calculate recommended mood based on answers
                        const moodCounts = quizAnswers.reduce((acc, mood) => {
                          acc[mood] = (acc[mood] || 0) + 1;
                          return acc;
                        }, {});
                        const recommendedMood = Object.entries(moodCounts).reduce((a, b) =>
                          moodCounts[a[0]] > moodCounts[b[0]] ? a : b
                        )[0];
                        setActiveMood(recommendedMood);
                        setShowQuiz(false);
                        setQuizStep(0);
                        setQuizAnswers([]);
                      }
                    }}
                    disabled={!quizAnswers[quizStep]}
                    className="flex-1 px-4 py-2 rounded-lg bg-gold text-black font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Get My Mood
                  </button>
                )}
              </div>
            </div>
          </div>
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
