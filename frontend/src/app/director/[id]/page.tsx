"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Calendar, MapPin, Film, Star, Users, Link2, Check, ChevronDown, ExternalLink,
} from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { peopleAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type FilmFilter = "all" | "directed" | "acted";

export default function DirectorPage() {
  const params = useParams();
  const personId = Number(params.id);

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [filmFilter, setFilmFilter] = useState<FilmFilter>("all");
  const [copied, setCopied] = useState(false);

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

  return (
    <main className="pt-24 pb-20 max-w-6xl mx-auto px-6 md:px-12">
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to search
      </Link>

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
              <div className="w-full h-full flex items-center justify-center text-4xl text-white/20">
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
                  className="mt-2 text-sm font-medium text-gold hover:text-gold/80"
                >
                  {bioExpanded ? "Show less" : "Read more"}
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
        </div>
      </div>

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
    </main>
  );
}
