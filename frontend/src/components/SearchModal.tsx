"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens, clear when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

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
          <div className="flex items-center gap-3 px-5 py-4">
            <Search className="w-5 h-5 text-gold/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search movies, directors, actors..."
              className="flex-1 bg-transparent text-white placeholder:text-white/25 outline-none text-lg font-body"
            />
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
