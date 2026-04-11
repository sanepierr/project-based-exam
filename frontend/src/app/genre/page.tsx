"use client";

import GenreGrid, { GENRES } from "@/components/GenreGrid";
import { Clapperboard } from "lucide-react";

export default function GenresPage() {
  return (
    <main
      className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto"
      aria-labelledby="genres-heading"
    >
      <div className="flex items-center gap-3 mb-8">
        <Clapperboard className="w-6 h-6 text-gold" aria-hidden />
        <h1 id="genres-heading" className="text-3xl font-bold font-display">
          Browse by Genre
        </h1>
      </div>
      <p className="text-white/50 mb-2 max-w-xl">
        Explore movies by genre. Find your next favorite film from action blockbusters
        to indie dramas and everything in between.
      </p>
      <p className="text-xs text-white/25 mb-10 uppercase tracking-wider font-semibold">
        {GENRES.length} genres · use the filter to narrow the grid
      </p>
      <GenreGrid />
    </main>
  );
}
