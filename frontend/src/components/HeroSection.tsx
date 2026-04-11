"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FocusEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { backdropUrl, posterUrl } from "@/lib/utils";
import { moviesAPI, recommendationsAPI } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import type { MovieCompact } from "@/types/movie";

type TrailerStatus = "idle" | "loading" | "ready" | "missing" | "error";

type VideoResult = { site?: string; type?: string; key?: string };

interface HeroSectionProps {
  movies: MovieCompact[];
  loading?: boolean;
}

const SLIDE_DURATION = 3000; 

export default function HeroSection({ movies, loading = false }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerTmdbId, setTrailerTmdbId] = useState<number | null>(null);
  const [trailerTitle, setTrailerTitle] = useState("");
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerStatus, setTrailerStatus] = useState<TrailerStatus>("idle");
  const trailerTrackedRef = useRef(false);

  const heroMovies = movies.slice(0, 6);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setProgressKey((k) => k + 1);
    },
    []
  );

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % heroMovies.length);
  }, [activeIndex, heroMovies.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + heroMovies.length) % heroMovies.length);
  }, [activeIndex, heroMovies.length, goTo]);

  const closeTrailer = useCallback(() => {
    setTrailerOpen(false);
    setTrailerTmdbId(null);
    setTrailerTitle("");
    setTrailerKey(null);
    setTrailerStatus("idle");
  }, []);

  useEffect(() => {
    if (!trailerOpen) trailerTrackedRef.current = false;
  }, [trailerOpen]);

  useEffect(() => {
    if (!trailerOpen || trailerTmdbId == null) return;
    let cancelled = false;
    setTrailerStatus("loading");
    setTrailerKey(null);
    moviesAPI
      .getDetail(trailerTmdbId)
      .then((data: { videos?: { results?: VideoResult[] } }) => {
        if (cancelled) return;
        const videos = data?.videos?.results || [];
        const trailer = videos.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        if (trailer?.key) {
          setTrailerKey(trailer.key);
          setTrailerStatus("ready");
        } else {
          setTrailerStatus("missing");
        }
      })
      .catch(() => {
        if (!cancelled) setTrailerStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [trailerOpen, trailerTmdbId]);

  useEffect(() => {
    if (!trailerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTrailer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trailerOpen, closeTrailer]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (hoverPaused || focusWithin || reducedMotion || heroMovies.length <= 1)
      return;
    const timer = setInterval(goNext, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [goNext, hoverPaused, focusWithin, reducedMotion, heroMovies.length]);

  if (loading && !heroMovies.length) {
    return (
      <div className="relative h-[92vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-1 to-surface-0" />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-20 pb-36 z-10 max-w-2xl space-y-5">
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="skeleton h-14 md:h-20 w-full max-w-xl rounded-xl" />
          <div className="skeleton h-20 w-full max-w-lg rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-9 w-24 rounded-full" />
            <div className="skeleton h-9 w-24 rounded-full" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="skeleton h-12 w-40 rounded-xl" />
            <div className="skeleton h-12 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!heroMovies.length) {
    return (
      <div className="h-[90vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-1 to-surface-0" />
        <div className="relative text-center space-y-5 animate-slide-up">
          <h1 className="text-6xl md:text-8xl font-bold font-display">
            Cine<span className="text-gold">Quest</span>
          </h1>
          <p className="text-white/35 text-lg font-body max-w-md mx-auto">
            Your cinematic discovery engine
          </p>
        </div>
      </div>
    );
  }

  const movie = heroMovies[activeIndex];
  const bgUrl = backdropUrl((movie as any).backdrop_url || movie.poster_url);

  return (
    <div
      role="region"
      aria-label="Featured trending movies"
      className="relative h-[92vh] overflow-hidden"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
    >
      {heroMovies.map((m, i) => {
        const bg = backdropUrl((m as any).backdrop_url || m.poster_url);
        return (
          <div
            key={m.id || m.tmdb_id}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            {bg && (
              <Image
                src={bg}
                alt={m.title}
                fill
                className="object-cover object-top"
                priority={i === 0}
                unoptimized
              />
            )}
          </div>
        );
      })}

      {/* Gradient overlays */}
      <div className="hero-gradient absolute inset-0" />
      <div className="hero-side-gradient absolute inset-0" />

      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 lg:px-20 pb-36 z-10">
        <div key={activeIndex} className="max-w-2xl animate-slide-up">
          {/* Top line */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-[11px] font-semibold uppercase tracking-widest text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Trending Now
            </span>
            {movie.vote_average > 0 && (
              <span className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="font-semibold text-gold">{movie.vote_average.toFixed(1)}</span>
              </span>
            )}
            {movie.year && (
              <span className="text-sm text-white/30">{movie.year}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.05] mb-5 text-white drop-shadow-2xl">
            {movie.title}
          </h1>

          {/* Overview */}
          <p className="text-base md:text-lg text-white/50 line-clamp-2 mb-6 max-w-xl leading-relaxed">
            {movie.overview}
          </p>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-7">
              {movie.genres.slice(0, 4).map((g: any) => (
                <span
                  key={g.id || g.tmdb_id || g.name}
                  className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-medium text-white/60 uppercase tracking-wider"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link
              href={`/movie/${movie.tmdb_id || movie.id}`}
              className="group flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 hover:scale-[1.03] active:scale-[0.98]"
            >
              <Info className="w-[18px] h-[18px]" />
              View Details
            </Link>
            <button
              type="button"
              onClick={() => {
                const id = movie.tmdb_id || movie.id;
                setTrailerTmdbId(id);
                setTrailerTitle(movie.title);
                setTrailerOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card text-sm font-medium text-white/80 hover:text-white transition-all duration-300 hover:scale-[1.02]"
            >
              <Play className="w-4 h-4" fill="currentColor" aria-hidden />
              Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows  */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous featured movie"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 group"
      >
        <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-gold transition-colors" aria-hidden />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next featured movie"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 group"
      >
        <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-gold transition-colors" aria-hidden />
      </button>

      {/* Slide indicators */}
      <div
        className="absolute bottom-20 left-6 md:left-10 lg:left-20 z-20 flex items-center gap-2"
        role="group"
        aria-label="Featured movies"
      >
        {heroMovies.map((m, i) => (
          <button
            type="button"
            key={m.id || m.tmdb_id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}: ${m.title}`}
            aria-current={i === activeIndex ? "true" : undefined}
            className="group relative"
          >
            <div className={`h-[3px] rounded-full transition-all duration-300 ${
              i === activeIndex ? "w-10 bg-gold" : "w-5 bg-white/15 hover:bg-white/25"
            }`}>
              {i === activeIndex && (
                <div
                  key={progressKey}
                  className="hero-progress-fill"
                  style={{
                    animationDuration: `${SLIDE_DURATION}ms`,
                    animationPlayState:
                      hoverPaused || focusWithin || reducedMotion
                        ? "paused"
                        : "running",
                  }}
                />
              )}
            </div>
          </button>
        ))}
        <span
          className="ml-3 text-[11px] text-white/20 font-mono tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {String(activeIndex + 1).padStart(2, "0")} / {String(heroMovies.length).padStart(2, "0")}
        </span>
      </div>

      
      <div className="hidden xl:flex absolute right-10 bottom-32 z-20 gap-3">
        {heroMovies.slice(0, 5).map((m, i) => {
          const pUrl = posterUrl(m.poster_url || (m as any).poster_path, "w185");
          return (
            <button
              type="button"
              key={m.id || m.tmdb_id}
              onClick={() => goTo(i)}
              aria-label={`Show ${m.title} in hero`}
              className={`relative w-[60px] h-[90px] rounded-lg overflow-hidden transition-all duration-400 ${
                i === activeIndex
                  ? "ring-2 ring-gold/60 scale-110 shadow-lg shadow-gold/10"
                  : "opacity-40 hover:opacity-70 scale-100"
              }`}
            >
              <Image
                src={pUrl}
                alt={m.title}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          );
        })}
      </div>

      {trailerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hero-trailer-dialog-title"
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/80 bg-surface-1 p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="hero-trailer-dialog-title"
              className="text-lg font-semibold text-white/90 mb-4 pr-10"
            >
              Trailer{trailerTitle ? `: ${trailerTitle}` : ""}
            </h2>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
              {trailerStatus === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                  Loading trailer…
                </div>
              )}
              {trailerStatus === "ready" && trailerKey && (
                <iframe
                  title={`Trailer for ${trailerTitle}`}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  onLoad={() => {
                    if (trailerTrackedRef.current) return;
                    trailerTrackedRef.current = true;
                    if (isAuthenticated && trailerTmdbId != null) {
                      recommendationsAPI
                        .trackInteraction({
                          movie_tmdb_id: trailerTmdbId,
                          movie_title: trailerTitle,
                          interaction_type: "watched",
                        })
                        .catch(() => {});
                    }
                  }}
                />
              )}
              {(trailerStatus === "missing" || trailerStatus === "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <p className="text-white/50 text-sm">
                    {trailerStatus === "error"
                      ? "We couldn’t load this trailer. Try again later."
                      : "No trailer is available for this title yet."}
                  </p>
                  {trailerTmdbId != null && (
                    <Link
                      href={`/movie/${trailerTmdbId}`}
                      className="text-gold text-sm hover:underline"
                    >
                      Open movie page
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={closeTrailer}
            className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Close trailer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
