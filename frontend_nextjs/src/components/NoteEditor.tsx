"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note, NoteDraft } from "@/lib/types";
import { Button } from "@/components/Button";
import { TagPill } from "@/components/TagPill";

function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/\s+/g, "-").toLowerCase());
  return Array.from(new Set(tags));
}

function toTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export function NoteEditor({
  note,
  isNew,
  saving,
  deleting,
  error,
  onCreate,
  onUpdate,
  onDelete,
  onCancelNew,
}: {
  note: Note | null;
  isNew: boolean;
  saving: boolean;
  deleting: boolean;
  error: string | null;
  onCreate: (draft: NoteDraft) => void;
  onUpdate: (id: string, draft: NoteDraft) => void;
  onDelete: (id: string) => void;
  onCancelNew: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const derivedTags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  useEffect(() => {
    // Whenever selection changes, repopulate editor (unless we're in "new note" mode)
    if (!note) {
      setTitle("");
      setContent("");
      setTagsInput("");
      return;
    }
    setTitle(note.title ?? "");
    setContent(note.content ?? "");
    setTagsInput(toTagsInput(note.tags ?? []));
  }, [note, isNew]);

  const canSave = title.trim().length > 0 || content.trim().length > 0;

  function handleSave() {
    const draft: NoteDraft = {
      title: title.trim() || "Untitled",
      content,
      tags: derivedTags,
    };

    if (!canSave) return;

    if (isNew) onCreate(draft);
    else if (note) onUpdate(note.id, draft);
  }

  return (
    <section className="retro-card retro-scanlines p-3 sm:p-4 h-full flex flex-col">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="retro-title text-sm">
            {isNew ? "New Note" : note ? "Edit Note" : "Note"}
          </h2>
          <p className="text-xs retro-muted font-mono mt-1">
            {note
              ? `id: ${note.id}`
              : "Select a note from the list, or create a new one."}
          </p>
        </div>

        {isNew ? (
          <Button variant="secondary" onClick={onCancelNew} title="Cancel new note">
            Cancel
          </Button>
        ) : null}
      </header>

      <div className="retro-divider my-3" />

      {!note && !isNew ? (
        <div className="flex-1 grid place-items-center text-center p-6">
          <div className="retro-card-soft p-5 rounded-[14px] max-w-md w-full">
            <div className="font-mono text-sm">No note selected</div>
            <div className="text-xs retro-muted mt-2">
              Use the left panel to pick a note, or press “New Note”.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <label className="block">
              <div className="text-xs font-mono retro-muted mb-1">TITLE</div>
              <input
                className="retro-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon checklist"
              />
            </label>

            <label className="block">
              <div className="text-xs font-mono retro-muted mb-1">TAGS</div>
              <input
                className="retro-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. work, ideas, todo"
              />
              {derivedTags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {derivedTags.map((t) => (
                    <TagPill
                      key={t}
                      label={t}
                      onRemove={() =>
                        setTagsInput(toTagsInput(derivedTags.filter((x) => x !== t)))
                      }
                    />
                  ))}
                </div>
              ) : null}
            </label>

            <label className="block">
              <div className="text-xs font-mono retro-muted mb-1">CONTENT</div>
              <textarea
                className="retro-input min-h-[220px] resize-y font-[var(--font-mono)] text-[13px] leading-5"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your note…"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!canSave || saving}
                title="Save note"
              >
                {saving ? "Saving…" : "Save"}
              </Button>

              {!isNew && note ? (
                <Button
                  variant="danger"
                  onClick={() => onDelete(note.id)}
                  disabled={deleting}
                  title="Delete note"
                  className="border-[rgba(251,113,133,0.55)] hover:border-[rgba(251,113,133,0.9)] bg-[rgba(251,113,133,0.08)]"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              ) : null}
            </div>

            <div className="text-xs font-mono retro-muted">
              {note?.updatedAt
                ? `Updated: ${note.updatedAt}`
                : note?.createdAt
                  ? `Created: ${note.createdAt}`
                  : ""}
            </div>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-[rgba(251,113,133,0.95)] font-mono">
              {error}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
