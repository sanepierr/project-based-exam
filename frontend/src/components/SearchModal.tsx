"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieCompact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens, clear state when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Ctrl/Cmd+K toggles modal; Escape closes it
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search — fires 250ms after the user stops typing
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await moviesAPI.search(query);
        setResults(data.results.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Arrow-key navigation through results + Enter to select
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const movie = results[selectedIndex];
      console.log("selected:", movie.tmdb_id || movie.id);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 animate-scale-in">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          {/* Shine line */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4" onKeyDown={handleKeyDown}>
            <Search className="w-5 h-5 text-gold/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, directors, actors..."
              className="flex-1 bg-transparent text-white placeholder:text-white/25 outline-none text-lg font-body"
            />
            {loading && <Loader2 className="w-5 h-5 text-gold/40 animate-spin" />}
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] text-white/20 px-2 py-1 rounded border border-white/8 font-mono hover:border-white/15 transition-colors"
            >
              ESC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
