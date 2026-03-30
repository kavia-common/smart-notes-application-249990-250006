"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NotesApi } from "@/lib/apiClient";
import type { Note, NoteDraft, Tag } from "@/lib/types";
import { Button } from "@/components/Button";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { TagSidebar } from "@/components/TagSidebar";

const api = new NotesApi();

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [isNew, setIsNew] = useState(false);

  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadAbort = useRef<AbortController | null>(null);

  const apiConfigured = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
  }, []);

  async function loadTags() {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const data = await api.listTags();
      setTags(data);
    } catch (e) {
      setTagsError(e instanceof Error ? e.message : "Failed to load tags");
    } finally {
      setTagsLoading(false);
    }
  }

  async function loadNotes() {
    loadAbort.current?.abort();
    const controller = new AbortController();
    loadAbort.current = controller;

    setNotesLoading(true);
    setNotesError(null);
    try {
      const data = await api.listNotes({
        q: debouncedQuery.trim() || undefined,
        tag: activeTag || undefined,
        signal: controller.signal,
      });
      setNotes(data);

      // Maintain selection if present, otherwise select first.
      if (isNew) return;
      if (selectedId && data.some((n) => n.id === selectedId)) return;

      const next = data[0]?.id ?? null;
      setSelectedId(next);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setNotesError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  }

  async function loadSelectedNote(id: string | null) {
    setEditorError(null);
    if (!id) {
      setSelectedNote(null);
      return;
    }
    try {
      const note = await api.getNote(id);
      setSelectedNote(note);
    } catch {
      // If backend does not have per-note fetch, we can still pick from list.
      const fallback = notes.find((n) => n.id === id) ?? null;
      setSelectedNote(fallback);
    }
  }

  useEffect(() => {
    void loadTags();
  }, []);

  useEffect(() => {
    void loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, activeTag]);

  useEffect(() => {
    if (isNew) {
      setSelectedNote({ id: "", title: "", content: "", tags: [] });
      return;
    }
    void loadSelectedNote(selectedId);
  }, [selectedId, isNew, notes]);

  async function handleCreate(draft: NoteDraft) {
    setSaving(true);
    setEditorError(null);
    try {
      const created = await api.createNote(draft);
      setIsNew(false);
      await loadNotes();
      await loadTags();
      setSelectedId(created.id);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : "Failed to create note");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, draft: NoteDraft) {
    setSaving(true);
    setEditorError(null);
    try {
      const updated = await api.updateNote(id, draft);
      await loadNotes();
      await loadTags();
      setSelectedId(updated.id);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : "Failed to update note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setEditorError(null);
    try {
      await api.deleteNote(id);
      await loadNotes();
      await loadTags();
      setSelectedId(null);
      setSelectedNote(null);
    } catch (e) {
      setEditorError(e instanceof Error ? e.message : "Failed to delete note");
    } finally {
      setDeleting(false);
    }
  }

  function handleNewNote() {
    setIsNew(true);
    setSelectedId(null);
    setSelectedNote({ id: "", title: "", content: "", tags: [] });
    setEditorError(null);
  }

  function handleCancelNew() {
    setIsNew(false);
    setEditorError(null);
    // Restore selection to first item if any
    setSelectedId(notes[0]?.id ?? null);
  }

  return (
    <main className="space-y-4">
      {/* Top bar */}
      <header className="retro-card retro-scanlines p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="retro-title text-lg sm:text-xl">
              Smart Notes<span className="text-[var(--accent)]">.exe</span>
            </h1>
            <p className="text-xs sm:text-sm retro-muted mt-1">
              Search, tag, create, edit — all in a neon retro workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
            <div className="w-full sm:w-[360px]">
              <label className="block">
                <span className="sr-only">Search notes</span>
                <input
                  className="retro-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes… (title or content)"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleNewNote} title="Create a new note">
                New Note
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setActiveTag(null);
                }}
                title="Clear filters"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {!apiConfigured ? (
          <div className="mt-3 text-xs font-mono text-[rgba(251,191,36,0.95)]">
            NEXT_PUBLIC_API_BASE_URL is not set. The app will still work using a
            mock dataset, but it won’t persist to the backend.
          </div>
        ) : null}
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="h-[260px] lg:h-[calc(100vh-210px)]">
            <TagSidebar
              tags={tags}
              activeTag={activeTag}
              loading={tagsLoading}
              error={tagsError}
              onSelectTag={(name) => setActiveTag((prev) => (prev === name ? null : name))}
              onClear={() => setActiveTag(null)}
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="lg:col-span-4">
          <div className="h-[340px] lg:h-[calc(100vh-210px)]">
            <NotesList
              notes={notes}
              selectedId={selectedId}
              loading={notesLoading}
              error={notesError}
              onSelect={(id) => {
                setIsNew(false);
                setSelectedId(id);
              }}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-5">
          <div className="h-[520px] lg:h-[calc(100vh-210px)]">
            <NoteEditor
              note={isNew ? selectedNote : selectedNote}
              isNew={isNew}
              saving={saving}
              deleting={deleting}
              error={editorError}
              onCreate={handleCreate}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onCancelNew={handleCancelNew}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="retro-card-soft p-3 sm:p-4 rounded-[14px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs font-mono retro-muted">
            {activeTag ? `Filter tag: ${activeTag}` : "No tag filter"}{" "}
            {debouncedQuery ? `• Query: "${debouncedQuery}"` : ""}
          </div>
          <div className="text-xs font-mono retro-muted">
            Backend:{" "}
            <span className="text-white/90">
              {process.env.NEXT_PUBLIC_API_BASE_URL || "mock-mode"}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
