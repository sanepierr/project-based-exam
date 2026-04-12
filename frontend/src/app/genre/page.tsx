"use client";

import { useEffect, useState } from "react";
import GenreGrid from "@/components/GenreGrid";
import { Clapperboard, Copy } from "lucide-react";

export default function GenresPage() {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Clapperboard className="w-6 h-6 text-gold" />
        <h1 className="text-3xl font-bold font-display">Browse by Genre</h1>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <p className="text-white/50 max-w-xl">
          Explore movies by genre. Find your next favorite film from action blockbusters
          to indie dramas and everything in between.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
          aria-label="Copy genre index URL"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? "Copied!" : "Copy list URL"}
        </button>
      </div>
      {currentUrl && (
        <p className="text-xs text-white/40 mb-10 break-words">{currentUrl}</p>
      )}
      <GenreGrid />
    </div>
  );
}
