"use client";

import React from "react";
import type { Note } from "@/lib/types";

export function NotesList({
  notes,
  selectedId,
  loading,
  error,
  onSelect,
}: {
  notes: Note[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="retro-card retro-scanlines p-3 sm:p-4 h-full flex flex-col min-h-[220px]">
      <header className="flex items-center justify-between gap-3 pb-3">
        <h2 className="retro-title text-sm text-[rgba(231,242,255,0.9)]">
          Notes
        </h2>
        <span className="text-xs retro-muted font-mono">{notes.length}</span>
      </header>

      <div className="retro-divider mb-3" />

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-sm retro-muted font-mono">Loading notes…</div>
        ) : error ? (
          <div className="text-sm text-[rgba(251,113,133,0.95)] font-mono">
            {error}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-sm retro-muted font-mono">
            No notes found. Try a different query or create one.
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => {
              const active = n.id === selectedId;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                      active
                        ? "border-[rgba(34,211,238,0.7)] bg-[rgba(34,211,238,0.08)]"
                        : "border-[rgba(231,242,255,0.14)] bg-[rgba(7,10,20,0.22)] hover:border-[rgba(231,242,255,0.28)]"
                    }`}
                    onClick={() => onSelect(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[13px] tracking-wide truncate">
                          {n.title || "Untitled"}
                        </div>
                        <div className="text-xs retro-muted line-clamp-2 mt-1">
                          {n.content || "—"}
                        </div>
                      </div>
                      <div className="text-[10px] retro-muted font-mono whitespace-nowrap">
                        {(n.updatedAt ?? n.createdAt ?? "").slice(0, 10)}
                      </div>
                    </div>

                    {n.tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {n.tags.slice(0, 4).map((t) => (
                          <span
                            key={`${n.id}-${t}`}
                            className="px-2 py-0.5 rounded-full border border-[rgba(231,242,255,0.12)] bg-[rgba(7,10,20,0.28)] text-[11px] font-mono retro-muted"
                          >
                            {t}
                          </span>
                        ))}
                        {n.tags.length > 4 ? (
                          <span className="text-[11px] font-mono retro-muted">
                            +{n.tags.length - 4}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
