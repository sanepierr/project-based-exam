"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Library, ChevronRight, Loader2 } from "lucide-react";
import { moviesAPI } from "@/lib/api";

interface CollectionMeta {
  slug: string;
  title: string;
  description: string;
  movie_count: number;
}

export default function CollectionsIndexPage() {
  const [rows, setRows] = useState<CollectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await moviesAPI.collectionsList();
        if (!cancelled) setRows(data.results || []);
      } catch {
        if (!cancelled) setError("Could not load collections.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Library className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Curated collections</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Staff-picked lists — great for demos, classes, or a weekend marathon.
          </p>
        </div>
      </div>

      <p className="text-white/45 mb-10 max-w-2xl leading-relaxed">
        Each collection is defined in the API and resolved live from TMDB. Share a link to a list
        or use them as starting points before you branch into search, moods, or Describe.
      </p>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold/40" />
        </div>
      )}

      {error && (
        <p className="text-center text-red-400/80 py-12">{error}</p>
      )}

      {!loading && !error && (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/collections/${c.slug}`}
                className="group flex items-center justify-between gap-4 p-5 rounded-2xl glass-card border border-white/[0.06] hover:border-gold/20 transition-all"
              >
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold font-display text-white/90 group-hover:text-gold transition-colors">
                    {c.title}
                  </h2>
                  <p className="text-sm text-white/35 mt-1 line-clamp-2">{c.description}</p>
                  <p className="text-[11px] text-white/20 mt-2 font-mono tabular-nums">
                    {c.movie_count} films
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-gold/60 flex-shrink-0 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
