"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Film,
  Star,
  Users,
  AlertCircle,
  Link2,
  Check,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { peopleAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Person } from "@/types/movie";

type FilmFilter = "all" | "directed" | "acted";

export default function DirectorPage() {
  const params = useParams();
  const personId = Number(params.id);

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filmFilter, setFilmFilter] = useState<FilmFilter>("all");

  const fetchPerson = useCallback(async () => {
    if (!personId || Number.isNaN(personId)) {
      setLoading(false);
      setPerson(null);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      try {
        await peopleAPI.enrich(personId);
      } catch {
        /* enrich is best-effort */
      }
      const data = await peopleAPI.getDetail(personId);
      setPerson(data);
    } catch {
      setLoadError(true);
      setPerson(null);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  if (loading) {
    return (
      <div
        className="pt-24 pb-20 max-w-6xl mx-auto px-6"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Loading person profile…</span>
        <div className="flex gap-8">
          <div className="skeleton w-[200px] h-[300px] rounded-2xl" />
          <div className="flex-1 space-y-4">
            <div className="skeleton h-10 w-1/3 rounded-lg" />
            <div className="skeleton h-6 w-1/4 rounded-lg" />
            <div className="skeleton h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="pt-24 pb-20 max-w-lg mx-auto px-6 text-center">
        <div
          className="flex flex-col items-center gap-4 px-4 py-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200/90"
          role="alert"
        >
          <AlertCircle className="w-10 h-10" aria-hidden />
          <p className="text-sm">We couldn&apos;t load this person. Check your connection or try again.</p>
          <button
            type="button"
            onClick={() => fetchPerson()}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
        <Link href="/search" className="text-gold mt-6 inline-block text-sm">
          ← Back to search
        </Link>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="pt-24 pb-20 text-center px-6">
        <p className="text-white/40">Person not found.</p>
        <Link href="/search" className="text-gold mt-4 inline-block text-sm">
          ← Back to search
        </Link>
      </div>
    );
  }

  const directedMovies = person.directed_movies || [];
  const actedMovies = person.acted_movies || [];
  const bio = person.biography?.trim() || "";
  const bioLong = bio.length > 280;

  const showDirected = filmFilter === "all" || filmFilter === "directed";
  const showActed = filmFilter === "all" || filmFilter === "acted";

  return (
    <main className="pt-24 pb-20 max-w-6xl mx-auto px-6 md:px-12">
      <nav className="flex flex-wrap items-center justify-between gap-3 mb-6" aria-label="Page navigation">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to search
        </Link>
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
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl glass-card text-xs text-white/70 hover:text-white"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy profile link"}
        </button>
      </nav>

      <div className="flex flex-col sm:flex-row gap-8 mb-12">
        <div className="flex-shrink-0">
          <div className="w-[180px] h-[270px] rounded-2xl overflow-hidden bg-surface-3 shadow-xl">
            {person.profile_url ? (
              <Image
                src={person.profile_url}
                alt={person.name}
                width={180}
                height={270}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl text-white/20"
                aria-label={`${person.name} placeholder`}
              >
                {person.name?.[0] ?? "?"}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs text-gold font-semibold uppercase tracking-wider">
              {person.known_for_department || "Filmmaker"}
            </span>
            <h1 className="text-4xl font-bold font-display mt-1">{person.name}</h1>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/50">
            {person.birthday && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" aria-hidden />
                {formatDate(person.birthday)}
              </span>
            )}
            {person.place_of_birth && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" aria-hidden />
                {person.place_of_birth}
              </span>
            )}
          </div>

          {bio && (
            <div className="max-w-2xl">
              <p
                className={`text-white/60 leading-relaxed ${
                  bioExpanded ? "" : "line-clamp-6"
                }`}
              >
                {bio}
              </p>
              {bioLong && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((e) => !e)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold/80 hover:text-gold"
                >
                  {bioExpanded ? "Show less" : "Read more"}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${bioExpanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-6 pt-2 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-gold" aria-hidden />
              <span>
                {directedMovies.length > 0
                  ? `${directedMovies.length} films directed`
                  : "No directing credits listed"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" aria-hidden />
              <span>
                {actedMovies.length > 0
                  ? `${actedMovies.length} acting credits`
                  : "No acting credits listed"}
              </span>
            </div>
          </div>

          <a
            href={`https://www.themoviedb.org/person/${personId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold/80 hover:text-gold mt-2"
          >
            View on TMDB
            <ExternalLink className="w-3.5 h-3.5" aria-hidden />
          </a>

          {(directedMovies.length > 0 || actedMovies.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-4" role="tablist" aria-label="Filmography filter">
              {[
                { id: "all" as const, label: "All credits" },
                ...(directedMovies.length > 0 ? [{ id: "directed" as const, label: "Directed only" }] : []),
                ...(actedMovies.length > 0 ? [{ id: "acted" as const, label: "Acting only" }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filmFilter === tab.id}
                  onClick={() => setFilmFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    filmFilter === tab.id
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-white/[0.08] text-white/45 hover:text-white/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDirected && (
        <section className="mb-12" aria-labelledby="directed-heading">
          <h2 id="directed-heading" className="text-xl font-bold font-display flex items-center gap-2 mb-6">
            <Film className="w-5 h-5 text-gold" aria-hidden />
            Directed
          </h2>
          {directedMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {directedMovies.map((movie) => (
                <MovieCard key={movie.id || movie.tmdb_id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 py-6 border border-white/[0.06] rounded-xl text-center">
              No directed films to show yet.
            </p>
          )}
        </section>
      )}

      {showActed && (
        <section aria-labelledby="acted-heading">
          <h2 id="acted-heading" className="text-xl font-bold font-display flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-gold" aria-hidden />
            Acted In
          </h2>
          {actedMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {actedMovies.map((movie) => (
                <MovieCard key={movie.id || movie.tmdb_id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 py-6 border border-white/[0.06] rounded-xl text-center">
              No acting credits to show yet.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
