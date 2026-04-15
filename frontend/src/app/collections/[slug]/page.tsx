"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [movies, setMovies] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await moviesAPI.collectionDetail(slug);
        if (cancelled) return;
        setTitle(data.title);
        setDescription(data.description);
        setMovies(data.results || []);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold/40" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pt-28 text-center px-6">
        <p className="text-white/40">Collection not found.</p>
        <Link href="/collections" className="text-gold mt-4 inline-block">
          ← All collections
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All collections
      </Link>

      <h1 className="text-3xl font-bold font-display mb-3">{title}</h1>
      <p className="text-white/45 max-w-2xl mb-10 leading-relaxed">{description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id || movie.tmdb_id} movie={movie} showOverview />
        ))}
      </div>
    </div>
  );
}
