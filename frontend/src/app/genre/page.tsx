"use client";

import { useState } from "react";
import GenreGrid from "@/components/GenreGrid";
import { Clapperboard, Link2, Check } from "lucide-react";

export default function GenresPage() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Clapperboard className="w-6 h-6 text-gold" />
        <h1 className="text-3xl font-bold font-display">Browse by Genre</h1>
        <button onClick={() => setCopied(true)}>Copy</button>
      </div>
      <p className="text-white/50 mb-6 max-w-xl">
        Explore movies by genre. Genre pages support shareable links with sort and page in the URL
        so you can bookmark or send a list to friends.
      </p>
      <p className="text-xs text-white/25 mb-10 font-mono">17 genres · TMDB-powered</p>
      <GenreGrid />
    </div>
  );
}
