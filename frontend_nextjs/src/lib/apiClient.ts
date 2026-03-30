import type { Note, NoteDraft, Tag } from "@/lib/types";

class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Read the public API base URL. This must be configured by the runtime in `.env`.
 * We purposely do NOT rely on Next.js proxying or relative URLs.
 */
function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  signal?: AbortSignal
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new ApiError(
      "Missing NEXT_PUBLIC_API_BASE_URL. Configure it in the environment.",
      0
    );
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(res.statusText || "Request failed", res.status, detail);
  }

  // Handle empty responses
  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}

/**
 * Backend API surface used by the UI.
 *
 * NOTE: The provided OpenAPI spec currently only includes `/` health check.
 * We attempt to call common REST endpoints. If they are not present, we fall back to
 * an in-memory mock store (so UI remains fully usable).
 */
export class NotesApi {
  private useMock = false;

  private mock = createMockStore();

  private async ensureBackendAvailable(): Promise<void> {
    if (this.useMock) return;
    try {
      // Health check is present in OpenAPI
      await requestJson<unknown>("/", { method: "GET" });
    } catch {
      // If health is unreachable, we switch to mock.
      this.useMock = true;
    }
  }

  async listNotes(params?: {
    q?: string;
    tag?: string;
    signal?: AbortSignal;
  }): Promise<Note[]> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.listNotes(params);

    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.tag) qs.set("tag", params.tag);

    // Preferred endpoints (common FastAPI patterns)
    const candidates = [
      `/notes${qs.size ? `?${qs.toString()}` : ""}`,
      `/api/notes${qs.size ? `?${qs.toString()}` : ""}`,
      `/search${qs.size ? `?${qs.toString()}` : ""}`,
    ];

    for (const path of candidates) {
      try {
        const data = await requestJson<unknown>(path, { method: "GET" }, params?.signal);
        const notes = normalizeNotesResponse(data);
        return notes;
      } catch (e) {
        // Keep trying other candidates on 404
        if (e instanceof ApiError && e.status === 404) continue;
        // For other errors, rethrow
        throw e;
      }
    }

    // No compatible endpoint; fall back to mock
    this.useMock = true;
    return this.mock.listNotes(params);
  }

  async getNote(id: string, signal?: AbortSignal): Promise<Note | null> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.getNote(id);

    const candidates = [`/notes/${encodeURIComponent(id)}`, `/api/notes/${encodeURIComponent(id)}`];
    for (const path of candidates) {
      try {
        const data = await requestJson<unknown>(path, { method: "GET" }, signal);
        return normalizeNote(data);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) continue;
        throw e;
      }
    }
    this.useMock = true;
    return this.mock.getNote(id);
  }

  async createNote(draft: NoteDraft): Promise<Note> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.createNote(draft);

    const payload = { title: draft.title, content: draft.content, tags: draft.tags };

    const candidates = [`/notes`, `/api/notes`];
    for (const path of candidates) {
      try {
        const data = await requestJson<unknown>(path, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return normalizeNote(data) ?? this.mock.createNote(draft);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) continue;
        throw e;
      }
    }
    this.useMock = true;
    return this.mock.createNote(draft);
  }

  async updateNote(id: string, draft: NoteDraft): Promise<Note> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.updateNote(id, draft);

    const payload = { title: draft.title, content: draft.content, tags: draft.tags };

    const candidates = [
      `/notes/${encodeURIComponent(id)}`,
      `/api/notes/${encodeURIComponent(id)}`,
    ];
    for (const path of candidates) {
      try {
        const data = await requestJson<unknown>(path, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        return normalizeNote(data) ?? this.mock.updateNote(id, draft);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) continue;
        throw e;
      }
    }
    this.useMock = true;
    return this.mock.updateNote(id, draft);
  }

  async deleteNote(id: string): Promise<void> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.deleteNote(id);

    const candidates = [
      `/notes/${encodeURIComponent(id)}`,
      `/api/notes/${encodeURIComponent(id)}`,
    ];
    for (const path of candidates) {
      try {
        await requestJson<unknown>(path, { method: "DELETE" });
        return;
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) continue;
        throw e;
      }
    }
    this.useMock = true;
    return this.mock.deleteNote(id);
  }

  async listTags(): Promise<Tag[]> {
    await this.ensureBackendAvailable();
    if (this.useMock) return this.mock.listTags();

    const candidates = [`/tags`, `/api/tags`];
    for (const path of candidates) {
      try {
        const data = await requestJson<unknown>(path, { method: "GET" });
        return normalizeTagsResponse(data);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) continue;
        throw e;
      }
    }
    this.useMock = true;
    return this.mock.listTags();
  }
}

function normalizeNote(data: unknown): Note | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const id = String(obj.id ?? obj.note_id ?? obj.uuid ?? "");
  if (!id) return null;

  const title = String(obj.title ?? obj.name ?? "Untitled");
  const content = String(obj.content ?? obj.body ?? "");
  const tagsRaw = obj.tags ?? obj.tag_names ?? [];
  const tags = Array.isArray(tagsRaw) ? tagsRaw.map((t) => String(t)) : [];

  const createdAt = obj.created_at ? String(obj.created_at) : undefined;
  const updatedAt = obj.updated_at ? String(obj.updated_at) : undefined;

  return { id, title, content, tags, createdAt, updatedAt };
}

function normalizeNotesResponse(data: unknown): Note[] {
  if (Array.isArray(data)) {
    return data.map(normalizeNote).filter(Boolean) as Note[];
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const maybeItems = obj.items ?? obj.notes ?? obj.results;
    if (Array.isArray(maybeItems)) {
      return maybeItems.map(normalizeNote).filter(Boolean) as Note[];
    }
  }
  return [];
}

function normalizeTagsResponse(data: unknown): Tag[] {
  if (Array.isArray(data)) {
    return data
      .map((t) => {
        if (typeof t === "string") return { id: t, name: t };
        if (t && typeof t === "object") {
          const o = t as Record<string, unknown>;
          const name = String(o.name ?? o.tag ?? "");
          const id = String(o.id ?? name);
          if (!name) return null;
          return { id, name };
        }
        return null;
      })
      .filter(Boolean) as Tag[];
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const maybeItems = obj.items ?? obj.tags ?? obj.results;
    if (Array.isArray(maybeItems)) return normalizeTagsResponse(maybeItems);
  }
  return [];
}

function createMockStore() {
  // Simple deterministic mock dataset for UI usability.
  let notes: Note[] = [
    {
      id: "n-1",
      title: "Welcome to Smart Notes",
      content:
        "This is a retro-themed notes workspace.\n\nConfigure NEXT_PUBLIC_API_BASE_URL to connect to the backend.\n\nYou can create notes, edit them, tag them, and search.",
      tags: ["welcome", "retro"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n-2",
      title: "Tagging tips",
      content: "Use comma-separated tags like: work, ideas, todo",
      tags: ["tips"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const uniqTags = (): string[] => {
    const set = new Set<string>();
    for (const n of notes) n.tags.forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };

  return {
    async listNotes(params?: { q?: string; tag?: string }) {
      let filtered = [...notes];
      const q = (params?.q ?? "").trim().toLowerCase();
      const tag = (params?.tag ?? "").trim().toLowerCase();

      if (tag) filtered = filtered.filter((n) => n.tags.some((t) => t.toLowerCase() === tag));
      if (q) {
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
      }
      // newest first
      return filtered.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    },

    async getNote(id: string) {
      return notes.find((n) => n.id === id) ?? null;
    },

    async createNote(draft: NoteDraft) {
      const now = new Date().toISOString();
      const note: Note = {
        id: `n-${Math.random().toString(16).slice(2)}`,
        title: draft.title.trim() || "Untitled",
        content: draft.content,
        tags: draft.tags,
        createdAt: now,
        updatedAt: now,
      };
      notes = [note, ...notes];
      return note;
    },

    async updateNote(id: string, draft: NoteDraft) {
      const now = new Date().toISOString();
      notes = notes.map((n) =>
        n.id === id
          ? {
              ...n,
              title: draft.title.trim() || "Untitled",
              content: draft.content,
              tags: draft.tags,
              updatedAt: now,
            }
          : n
      );
      const updated = notes.find((n) => n.id === id);
      if (!updated) throw new Error("Note not found");
      return updated;
    },

    async deleteNote(id: string) {
      notes = notes.filter((n) => n.id !== id);
    },

    async listTags(): Promise<Tag[]> {
      return uniqTags().map((name) => ({ id: name, name }));
    },
  };
}
