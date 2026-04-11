"use client";

import { Suspense } from "react";
import { Search, Loader2 } from "lucide-react";

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "revenue.desc", label: "Highest Revenue" },
];

const LANGUAGES = [
  { value: "", label: "Any Language" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "hi", label: "Hindi" },
  { value: "zh", label: "Chinese" },
  { value: "it", label: "Italian" },
];

const GENRE_LIST = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 14, name: "Fantasy" }, { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" }, { id: 53, name: "Thriller" },
  { id: 10402, name: "Music" }, { id: 36, name: "History" }, { id: 10752, name: "War" },
  { id: 10751, name: "Family" }, { id: 9648, name: "Mystery" }, { id: 37, name: "Western" },
];

function SearchContent() {
  return (
    <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
      {/* Search bar */}
      <form className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/40" />
          <input
            type="text"
            placeholder="Search movies, directors, actors..."
            className="w-full h-14 pr-5 rounded-2xl bg-surface-2 border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all text-lg font-body"
            style={{ paddingLeft: "3.25rem" }}
          />
        </div>
      </form>

      {/* Page title */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-display">Trending Movies</h1>
      </div>

      {/* Empty state */}
      <div className="text-center py-24">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-5">
          <Search className="w-7 h-7 text-white/15" />
        </div>
        <p className="text-lg text-white/25 mb-2">No movies found</p>
        <p className="text-sm text-white/15">Try searching for something</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold/40" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
