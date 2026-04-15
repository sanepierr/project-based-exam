"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { moviesAPI } from "@/lib/api";

interface TrailerModalProps {
  open: boolean;
  onClose: () => void;
  tmdbId: number | null;
  movieTitle?: string;
  onTrailerPlay?: () => void;
}

export default function TrailerModal({
  open,
  onClose,
  tmdbId,
  movieTitle = "",
  onTrailerPlay,
}: TrailerModalProps) {
  const [trailer, setTrailer] = useState<{
    key: string;
    name: string;
    embed_url: string;
    watch_url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !tmdbId) return;

    setLoading(true);
    setError("");
    setTrailer(null);

    moviesAPI
      .getVideos(tmdbId)
      .then((data) => {
        if (data.trailer) {
          setTrailer(data.trailer);
          onTrailerPlay?.();
        } else {
          setError("No trailer available for this movie.");
        }
      })
      .catch(() => setError("Failed to load trailer."))
      .finally(() => setLoading(false));
  }, [open, tmdbId, onTrailerPlay]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-white/90 font-semibold text-lg truncate">
              {movieTitle || "Trailer"}
            </h3>
            {trailer && (
              <a
                href={trailer.watch_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gold/60 hover:text-gold transition-colors flex-shrink-0"
              >
                YouTube
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Player */}
        <div className="relative rounded-2xl overflow-hidden bg-surface-2 shadow-2xl shadow-black/60 border border-white/[0.06]">
          {loading && (
            <div className="aspect-video flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gold/40 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="aspect-video flex items-center justify-center">
              <p className="text-white/30 text-sm">{error}</p>
            </div>
          )}

          {trailer && !loading && (
            <iframe
              src={`${trailer.embed_url}?autoplay=1&rel=0`}
              title={trailer.name || movieTitle}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
