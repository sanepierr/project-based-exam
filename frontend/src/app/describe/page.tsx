"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Search,
  Sparkles,
  X,
  Loader2,
  Wand2,
  Tag,
  Zap,
} from "lucide-react";
import MovieCard, { MovieCardSkeleton } from "@/components/MovieCard";
import { moviesAPI } from "@/lib/api";
import type { MovieCompact } from "@/types/movie";

interface Chip {
  term: string;
  keyword_id: number | null;
  keyword_name: string | null;
}

interface DetectedMood {
  slug: string;
  label: string;
}

const EXAMPLE_PROMPTS = [
  "superhero, dark city, vigilante",
  "romantic comedy, vacation, summer",
  "space exploration, survival, alone",
  "heist, clever plan, team",
  "coming of age, school, friendship",
  "haunted house, paranormal, creepy",
];

export default function DescribePage() {
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<MovieCompact[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [detectedMood, setDetectedMood] = useState<DetectedMood | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  /** Shown when the mic is visible but disabled (wrong browser or context). */
  const [voiceUnavailableReason, setVoiceUnavailableReason] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      setVoiceUnavailableReason(
        "Voice input needs HTTPS (or http://localhost). Open the site over a secure URL."
      );
      return;
    }

    const w = window as typeof window & {
      SpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((e: Event) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((e: Event) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceUnavailableReason(
        "Speech recognition is not available in this browser. Try Chrome or Edge on desktop."
      );
      return;
    }
    setVoiceUnavailableReason(null);
    setVoiceSupported(true);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: Event) => {
      const ev = event as unknown as {
        results: ArrayLike<{ 0: { transcript: string } }>;
      };
      const transcript = Array.from(ev.results)
        .map((r) => r[0].transcript)
        .join("");
      setDescription(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = useCallback(() => {
    if (!voiceSupported) return;
    const rec = recognitionRef.current as { stop: () => void; start: () => void } | null;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setDescription("");
      rec.start();
      setListening(true);
    }
  }, [listening, voiceSupported]);

  const handleSubmit = useCallback(
    async (desc?: string, p = 1) => {
      const text = desc ?? description;
      if (!text.trim()) return;
      setLoading(true);
      setHasSearched(true);
      try {
        const data = await moviesAPI.describe(text.trim(), p);
        setResults(data.results || []);
        setChips(data.chips || []);
        setDetectedMood(data.detected_mood || null);
        setTotalPages(data.total_pages || 1);
        setPage(data.page || 1);
        setUsedFallback(data.fallback || false);
      } catch {
        setResults([]);
        setChips([]);
        setDetectedMood(null);
      } finally {
        setLoading(false);
      }
    },
    [description]
  );

  const removeChip = useCallback(
    (term: string) => {
      const newDesc = description
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.toLowerCase() !== term.toLowerCase())
        .join(", ");
      setDescription(newDesc);
      if (newDesc.trim()) handleSubmit(newDesc);
      else {
        setResults([]);
        setChips([]);
        setDetectedMood(null);
        setHasSearched(false);
      }
    },
    [description, handleSubmit]
  );

  return (
    <div className="pt-24 pb-20 px-6 md:px-10 lg:px-20 max-w-[1440px] mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/15 mb-5">
          <Wand2 className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">
            Describe &amp; Discover
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display mb-3">
          Describe your <span className="text-gold italic">perfect movie</span>
        </h1>
        <p className="text-white/35 max-w-lg mx-auto">
          Type or speak what you&apos;re in the mood for. We&apos;ll match your
          words to real movie keywords and find exactly what you want.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl">
          <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="p-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="e.g. superhero, dark city, vigilante justice..."
                rows={3}
                className="w-full bg-transparent text-white placeholder:text-white/20 outline-none resize-none text-lg font-body leading-relaxed pr-14"
              />
              <button
                type="button"
                disabled={!voiceSupported}
                onClick={toggleVoice}
                aria-label={
                  !voiceSupported
                    ? voiceUnavailableReason || "Voice input not available"
                    : listening
                      ? "Stop listening"
                      : "Speak your description"
                }
                className={`absolute top-1 right-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  !voiceSupported
                    ? "cursor-not-allowed opacity-40 bg-white/[0.02] border border-white/[0.06] text-white/25"
                    : listening
                      ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                      : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-gold hover:border-gold/20"
                }`}
                title={
                  !voiceSupported
                    ? voiceUnavailableReason || "Voice input not available"
                    : listening
                      ? "Stop listening"
                      : "Speak your description"
                }
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            {listening && (
              <div className="flex items-center gap-2 mt-2 animate-fade-in">
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${10 + (i % 3) * 5}px`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  ))}
                </span>
                <span className="text-xs text-red-400/70">Listening... speak now</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 text-[11px] text-white/20">
                <Search className="w-3.5 h-3.5" />
                <span>Comma-separate multiple terms</span>
                <span className="text-white/10">|</span>
                <Mic className="w-3.5 h-3.5" />
                <span>
                  {voiceSupported
                    ? "Or tap the mic to speak"
                    : voiceUnavailableReason || "Voice needs Chrome/Edge (desktop)"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!description.trim() || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-surface-0 font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-gold/15 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Discover
              </button>
            </div>
          </div>
        </div>

        {!hasSearched && (
          <div className="mt-6 text-center animate-fade-in">
            <p className="text-[11px] uppercase tracking-wider text-white/20 font-semibold mb-3">
              Try these
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => {
                    setDescription(prompt);
                    handleSubmit(prompt);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-white/40 hover:text-gold hover:border-gold/15 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {chips.length > 0 && (
        <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-white/20" />
            {chips.map((chip) => (
              <span
                key={chip.term}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  chip.keyword_id
                    ? chip.keyword_id === -1
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                      : "bg-gold/10 border border-gold/20 text-gold"
                    : "bg-white/[0.04] border border-white/[0.08] text-white/30 line-through"
                }`}
                title={chip.keyword_id === -1 ? `Matched words: ${chip.keyword_name}` : undefined}
              >
                {chip.keyword_id === -1 ? chip.term : chip.keyword_name || chip.term}
                <button
                  type="button"
                  onClick={() => removeChip(chip.term)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {detectedMood && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[12px] font-medium text-emerald-400 ml-1">
                <Zap className="w-3 h-3" />
                Mood: {detectedMood.label}
              </span>
            )}
          </div>
          {chips.some((c) => !c.keyword_id) && (
            <p className="text-[10px] text-white/15 mt-2 pl-6">
              Crossed-out terms had no matching TMDB keywords and were skipped.
            </p>
          )}
        </div>
      )}

      {usedFallback && results.length > 0 && !loading && (
        <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/80 text-sm animate-fade-in">
          <Search className="w-4 h-4 flex-shrink-0" />
          <span>
            No description matches found. Showing title search results instead.
            Try more descriptive terms like <em>&ldquo;superhero, dark, vigilante&rdquo;</em>.
          </span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">
              {usedFallback
                ? "Title Matches"
                : detectedMood
                  ? `${detectedMood.label} Movies`
                  : "Discovered Movies"}
            </h2>
            <span className="text-sm text-white/30">
              Page {page} of {Math.min(totalPages, 500)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {results.map((movie, i) => (
              <MovieCard
                key={movie.id || movie.tmdb_id}
                movie={movie}
                showOverview
                index={i}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                type="button"
                onClick={() => handleSubmit(description, page - 1)}
                disabled={page <= 1}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-white/30 font-mono tabular-nums px-4">
                {page} / {Math.min(totalPages, 500)}
              </span>
              <button
                type="button"
                onClick={() => handleSubmit(description, page + 1)}
                disabled={page >= totalPages}
                className="px-5 py-2.5 rounded-xl glass-card text-sm font-medium disabled:opacity-20 hover:border-gold/15 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : hasSearched && !loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-5">
            <Search className="w-7 h-7 text-white/15" />
          </div>
          <p className="text-lg text-white/25 mb-2">No movies matched your description</p>
          <p className="text-sm text-white/15">Try different words or more general terms</p>
        </div>
      ) : null}
    </div>
  );
}
