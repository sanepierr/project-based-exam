"use client";

import { useState } from "react";
import GenreGrid from "@/components/GenreGrid";
import { Clapperboard, Link2, Check } from "lucide-react";

export default function GenresPage() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Clapperboard className="w-6 h-6 text-gold" />
          <h1 className="text-3xl font-bold font-display">Browse by Genre</h1>
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
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl glass-card text-xs font-medium text-white/70 hover:text-white self-start"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Link2 className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied" : "Copy link to genres"}
        </button>
      </div>
      <p className="text-white/50 mb-10 max-w-xl">
        Explore movies by genre. Find your next favorite film from action blockbusters
        to indie dramas and everything in between.
      </p>
      <GenreGrid />
    </div>
  );
}
