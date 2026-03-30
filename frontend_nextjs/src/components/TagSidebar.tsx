"use client";

import React from "react";
import type { Tag } from "@/lib/types";
import { TagPill } from "@/components/TagPill";

export function TagSidebar({
  tags,
  activeTag,
  loading,
  error,
  onSelectTag,
  onClear,
}: {
  tags: Tag[];
  activeTag: string | null;
  loading: boolean;
  error: string | null;
  onSelectTag: (tagName: string) => void;
  onClear: () => void;
}) {
  return (
    <aside className="retro-card retro-scanlines p-3 sm:p-4 h-full">
      <header className="flex items-center justify-between gap-3 pb-3">
        <h2 className="retro-title text-sm">Tags</h2>
        <button
          type="button"
          className="text-xs font-mono retro-link"
          onClick={onClear}
          title="Clear tag filter"
        >
          Clear
        </button>
      </header>

      <div className="retro-divider mb-3" />

      {loading ? (
        <div className="text-sm retro-muted font-mono">Loading tags…</div>
      ) : error ? (
        <div className="text-sm text-[rgba(251,113,133,0.95)] font-mono">
          {error}
        </div>
      ) : tags.length === 0 ? (
        <div className="text-sm retro-muted font-mono">
          No tags yet. Add tags to notes to see them here.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagPill
              key={t.id}
              label={t.name}
              active={activeTag === t.name}
              onClick={() => onSelectTag(t.name)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
